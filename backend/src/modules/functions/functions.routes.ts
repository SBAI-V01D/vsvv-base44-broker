// ============================================================================
// avaai Backend — Functions Invoke Routes
//
// Provides a generic function invocation endpoint that maps function names
// to backend service operations. Replaces avaai's `avaai.functions.invoke()`.
//
// POST /api/functions/:name — Invoke a named function with parameters
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { requireTenant } from '../../middleware/tenant.js';
import { prisma } from '../../lib/prisma.js';
import { extractFromBuffer } from '../../services/ai-extraction.js';
import { addJob, QueueName } from '../../lib/queue.js';

// ---------------------------------------------------------------------------
// Function Registry — maps function names to handler implementations
// ---------------------------------------------------------------------------

interface FunctionHandler {
  description: string;
  handler: (params: Record<string, unknown>, context: { userId: string; orgId: string; role: string }) => Promise<unknown>;
}

const functionRegistry: Record<string, FunctionHandler> = {
  // ==========================================================================
  // Dashboard & Analytics
  // ==========================================================================

  'dashboard:getStats': {
    description: 'Get dashboard statistics',
    handler: async (_, { orgId }) => {
      const [customerCount, contractCount, taskCount, documentCount] = await Promise.all([
        prisma.customer.count({ where: { organization_id: orgId, archived: false } }),
        prisma.contract.count({ where: { organization_id: orgId, archived: false } }),
        prisma.task.count({ where: { organization_id: orgId, archived: false, status: { not: 'completed' } } }),
        prisma.document.count({ where: { organization_id: orgId, archived: false } }),
      ]);
      return { customerCount, contractCount, taskCount, documentCount };
    },
  },

  'dashboard:getRevenue': {
    description: 'Get revenue overview for a given year',
    handler: async (params, { orgId }) => {
      const year = (params.year as number) || new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);

      const periods = await prisma.financePeriod.findMany({
        where: {
          organization_id: orgId,
          month: { gte: startDate, lt: endDate },
          archived: false,
        },
      });

      return {
        year,
        totalCommissions: periods.reduce((sum, p) => sum + (p.total_commissions || 0), 0),
        totalPayouts: periods.reduce((sum, p) => sum + (p.total_payouts || 0), 0),
        monthCount: periods.length,
      };
    },
  },

  // ==========================================================================
  // Customer Operations
  // ==========================================================================

  'customer:search': {
    description: 'Search customers by query',
    handler: async (params, { orgId }) => {
      const query = (params.query as string) || '';
      const limit = Math.min(50, (params.limit as number) || 20);
      return prisma.customer.findMany({
        where: {
          organization_id: orgId,
          archived: false,
          OR: [
            { first_name: { contains: query, mode: 'insensitive' } },
            { last_name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { created_at: 'desc' },
      });
    },
  },

  'generateCustomerNumber': {
    description: 'Generate the next sequential customer number',
    handler: async (_, { orgId }) => {
      const lastCustomer = await prisma.customer.findFirst({
        where: { organization_id: orgId },
        orderBy: { created_at: 'desc' },
        select: { customer_number: true },
      });

      let nextNum = 1001;
      if (lastCustomer?.customer_number) {
        const match = lastCustomer.customer_number.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }

      const customer_number = `K-${orgId.slice(0, 4).toUpperCase()}-${nextNum.toString().padStart(4, '0')}`;
      return { customer_number };
    },
  },

  'importEntityData': {
    description: 'Import entity data from an uploaded CSV/Excel file',
    handler: async (params, { orgId, userId }) => {
      const { file_url, entity_name } = params as Record<string, string>;
      if (!file_url || !entity_name) throw new Error('file_url and entity_name are required');

      // Fetch the uploaded file
      const response = await fetch(file_url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const text = await response.text();

      // Parse CSV content (first line = headers)
      const lines = text.split('\n').filter(Boolean);
      if (lines.length < 2) throw new Error('File must have a header row and at least one data row');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
        return headers.reduce((obj, h, i) => {
          (obj as Record<string, string>)[h] = values[i];
          return obj;
        }, {} as Record<string, string>);
      });

      let successful = 0;
      let failed = 0;

      if (entity_name === 'Contract') {
        for (const row of rows) {
          try {
            const customer_name = row.customer_name || row.Kunde || row.kunde || '';
            const insurer = row.insurer || row.Versicherer || row.versicherer || '';
            if (!customer_name || !insurer) { failed++; continue; }

            // Find or create customer
            let customer = await prisma.customer.findFirst({
              where: { organization_id: orgId, last_name: { contains: customer_name.split(' ').pop() || '', mode: 'insensitive' } },
            });
            if (!customer) {
              const nameParts = customer_name.split(' ');
              customer = await prisma.customer.create({
                data: {
                  first_name: nameParts.slice(0, -1).join(' ') || customer_name,
                  last_name: nameParts.pop() || customer_name,
                  organization_id: orgId,
                },
              });
            }

            await prisma.contract.create({
              data: {
                customer_id: customer.id,
                customer_name,
                organization_id: orgId,
                insurer,
                insurance_type: (row.insurance_type || row.Sparte || row.sparte || 'other') as any,
                product: row.product || row.Produkt || null,
                premium_yearly: row.premium_yearly ? parseFloat(row.premium_yearly) : null,
                start_date: row.start_date ? new Date(row.start_date) : null,
                end_date: row.end_date ? new Date(row.end_date) : null,
                status: 'active',
                policy_number: row.policy_number || row.Police || null,
              },
            });
            successful++;
          } catch {
            failed++;
          }
        }
      } else {
        throw new Error(`Import for entity '${entity_name}' not implemented yet`);
      }

      return { successful, failed, total: rows.length };
    },
  },

  'acceptApplicationAndCreateContract': {
    description: 'Accept an application and create a contract from it',
    handler: async (params, { orgId, userId }) => {
      const { application_id } = params as Record<string, string>;
      if (!application_id) throw new Error('application_id is required');

      const application = await prisma.application.findFirst({
        where: { id: application_id, organization_id: orgId },
        include: { customer: true },
      });
      if (!application) throw new Error('Application not found');

      const contract = await prisma.contract.create({
        data: {
          customer_id: application.customer_id,
          customer_name: application.customer_name,
          organization_id: orgId,
          advisor_id: application.advisor_id,
          insurer: application.insurer,
          insurance_type: (application.insurance_type || 'other') as any,
          product: application.product || undefined,
          premium_yearly: application.estimated_premium_yearly || undefined,
          premium_monthly: application.estimated_premium_monthly || undefined,
          start_date: application.requested_start_date || undefined,
          policy_number: application.policy_number || undefined,
          status: 'active',
          source_application_id: application.id,
        },
      });

      await prisma.application.update({
        where: { id: application_id },
        data: {
          status: 'approved',
          linked_contract_id: contract.id,
          custom_status: 'angenommen',
          status_changed_at: new Date(),
        },
      });

      return {
        contract_id: contract.id,
        application_id,
        status: 'accepted',
      };
    },
  },

  'customer:mergeDuplicates': {
    description: 'Merge duplicate customer records',
    handler: async (params, { orgId }) => {
      const primaryId = params.primaryId as string;
      const duplicateIds = params.duplicateIds as string[];
      if (!primaryId || !duplicateIds?.length) {
        throw new Error('primaryId and duplicateIds are required');
      }

      // Find primary customer
      const primary = await prisma.customer.findFirst({
        where: { id: primaryId, organization_id: orgId },
      });
      if (!primary) throw new Error('Primary customer not found');

      // Reassign related records from duplicates to primary
      const updateOps = [
        prisma.contract.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
        prisma.application.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
        prisma.document.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
        prisma.lead.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
        prisma.task.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
        prisma.interaction.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
        // Interaction model does not have 'related_customer_id' — skip
        prisma.claim.updateMany({ where: { customer_id: { in: duplicateIds } }, data: { customer_id: primaryId } }),
      ];
      await Promise.all(updateOps);

      // Archive duplicates
      await prisma.customer.updateMany({
        where: { id: { in: duplicateIds } },
        data: { archived: true, archived_at: new Date() },
      });

      // Create audit log for the merge operation
      // Note: uses string literals matching Prisma enum values
      await prisma.auditLog.create({
        data: {
          audit_id: `merge-${primaryId}-${Date.now()}`,
          timestamp: new Date(),
          trigger_type: 'manual',
          actor_type: 'system',
          actor_name: 'system',
          entity_type: 'customer',
          entity_id: primaryId,
          action: 'update',
          organization_id: orgId,
        },
      });

      return { merged: duplicateIds.length, primaryId };
    },
  },

  // ==========================================================================
  // Document Operations
  // ==========================================================================

  'document:search': {
    description: 'Search documents by name or content',
    handler: async (params, { orgId }) => {
      const query = (params.query as string) || '';
      const limit = Math.min(50, (params.limit as number) || 20);
      return prisma.document.findMany({
        where: {
          organization_id: orgId,
          archived: false,
          name: { contains: query, mode: 'insensitive' },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
      });
    },
  },

  'extractInsuranceDocument': {
    description: 'Extract structured insurance data from a document (PDF/image)',
    handler: async (params, { userId, orgId }) => {
      const { file_url, file_name, mime_type } = params as Record<string, string>;
      if (!file_url) throw new Error('file_url is required');

      // Fetch file content
      const response = await fetch(file_url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Extract using AI
      const result = await extractFromBuffer(buffer, file_name || 'document', mime_type || 'application/pdf');

      // If document was uploaded in our system, queue it for background processing
      if (params.documentId) {
        await addJob(QueueName.DOCUMENT, 'extract-document', {
          documentId: params.documentId as string,
          fileKey: params.file_key as string || file_url,
          mimeType: mime_type as string || 'application/pdf',
          organizationId: orgId,
          userId,
        });
      }

      return result;
    },
  },

  'smartDocumentAnalysis': {
    description: 'Analyse a document with AI (general purpose)',
    handler: async (params, { orgId }) => {
      const { file_url, file_name, mime_type } = params as Record<string, string>;
      if (!file_url) throw new Error('file_url is required');

      const response = await fetch(file_url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      return extractFromBuffer(buffer, file_name || 'document', mime_type || 'application/pdf');
    },
  },

  'extractApplicationData': {
    description: 'Extract application form data from a document',
    handler: async (params, { orgId }) => {
      const { file_url, file_name, mime_type } = params as Record<string, string>;
      if (!file_url) throw new Error('file_url is required');

      const response = await fetch(file_url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      return extractFromBuffer(buffer, file_name || 'document', mime_type || 'application/pdf');
    },
  },

  // ==========================================================================
  // Commission Calculations
  // ==========================================================================

  'commission:calculate': {
    description: 'Calculate commission for a contract',
    handler: async (params, { orgId }) => {
      const contractId = params.contractId as string;
      if (!contractId) throw new Error('contractId is required');

      const contract = await prisma.contract.findFirst({
        where: { id: contractId, organization_id: orgId },
        include: { commissions: true },
      });
      if (!contract) throw new Error('Contract not found');

      // Simple commission calculation based on contract value
      const contractValue = (contract as any).premium_amount || 0;
      const commissionRate = 0.05; // 5% default
      const calculatedAmount = contractValue * commissionRate;

      return {
        contractId,
        contractValue,
        commissionRate,
        calculatedAmount,
        existingCommissions: contract.commissions,
      };
    },
  },

  // ==========================================================================
  // Search (Cross-Entity)
  // ==========================================================================

  'search:global': {
    description: 'Global search across all entities',
    handler: async (params, { orgId }) => {
      const query = (params.query as string) || '';
      if (!query || query.length < 2) return { results: [] };

      const limit = Math.min(10, (params.limit as number) || 5);

      const [customers, contracts, documents, tasks, leads] = await Promise.all([
        prisma.customer.findMany({
          where: {
            organization_id: orgId,
            archived: false,
            OR: [
              { first_name: { contains: query, mode: 'insensitive' } },
              { last_name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        }),
        prisma.contract.findMany({
          where: { organization_id: orgId, archived: false },
          take: limit,
        }),
        prisma.document.findMany({
          where: { organization_id: orgId, archived: false, name: { contains: query, mode: 'insensitive' } },
          take: limit,
        }),
        prisma.task.findMany({
          where: {
            organization_id: orgId,
            archived: false,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        }),
        prisma.lead.findMany({
          where: {
            organization_id: orgId,
            archived: false,
            OR: [
              { first_name: { contains: query, mode: 'insensitive' } },
              { last_name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        }),
      ]);

      return { results: { customers, contracts, documents, tasks, leads } };
    },
  },
};

// ============================================================================
// Routes
// ============================================================================

const functionsRoutes: FastifyPluginAsync = async (app) => {
  // ---------------------------------------------------------------------------
  // GET /api/functions — List available functions
  // ---------------------------------------------------------------------------
  app.get(
    '/api/functions',
    { preHandler: [app.requireAuth, requireTenant] },
    async () => {
      return {
        data: Object.entries(functionRegistry).map(([name, fn]) => ({
          name,
          description: fn.description,
        })),
      };
    },
  );

  // ---------------------------------------------------------------------------
  // POST /api/functions/:name — Invoke a function
  // ---------------------------------------------------------------------------
  app.post(
    '/api/functions/:name',
    { preHandler: [app.requireAuth, requireTenant] },
    async (request, reply) => {
      const { name } = request.params as { name: string };
      const params = (request.body as Record<string, unknown>) || {};

      const fn = functionRegistry[name];
      if (!fn) {
        return reply.code(404).send({
          error: 'function_not_found',
          message: `Function '${name}' not found`,
          availableFunctions: Object.keys(functionRegistry),
        });
      }

      try {
        const result = await fn.handler(params, {
          userId: request.user.id,
          orgId: request.orgId!,
          role: request.user.role,
        });

        return { data: result };
      } catch (err: any) {
        return reply.code(400).send({
          error: 'function_error',
          message: err.message || 'Function execution failed',
        });
      }
    },
  );
};

export default functionsRoutes;
