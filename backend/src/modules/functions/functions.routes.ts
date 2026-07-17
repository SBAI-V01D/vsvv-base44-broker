// ============================================================================
// VSVV Backend — Functions Invoke Routes
//
// Provides a generic function invocation endpoint that maps function names
// to backend service operations. Replaces Base44's `base44.functions.invoke()`.
//
// POST /api/functions/:name — Invoke a named function with parameters
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { requireTenant } from '../../middleware/tenant.js';
import { prisma } from '../../lib/prisma.js';
import { extractFromBuffer } from '../../services/ai-extraction.js';
import { resolveFileBuffer } from '../../services/file-storage.js';

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

  'getAllContractsForDashboard': {
    description: 'Get all contracts for dashboard display',
    handler: async (_, { orgId }) => {
      return prisma.contract.findMany({
        where: { organization_id: orgId, archived: false },
        include: {
          customer: { select: { first_name: true, last_name: true, email: true } },
          insurance_product: { select: { name: true, insurance_type: true, category: true } },
        },
        orderBy: { created_at: 'desc' },
      });
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

  // ==========================================================================
  // AI Document Analysis
  // ==========================================================================

  'smartDocumentAnalysis': {
    description: 'Analyse a document with AI (general purpose)',
    handler: async (params) => {
      const { file_url, file_name, mime_type } = params as { file_url?: string; file_name?: string; mime_type?: string };
      if (!file_url) throw new Error('file_url is required');
      const buffer = await resolveFileBuffer(file_url);
      return extractFromBuffer(buffer, file_name || 'document', mime_type || 'application/pdf');
    },
  },

  'extractApplicationData': {
    description: 'Extract application form data from a document',
    handler: async (params) => {
      const { file_url, file_name, mime_type } = params as { file_url?: string; file_name?: string; mime_type?: string };
      if (!file_url) throw new Error('file_url is required');
      const buffer = await resolveFileBuffer(file_url);
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
  // Application & Contract Operations
  // ==========================================================================

  'acceptApplicationAndCreateContract': {
    description: 'Accept an application and create a corresponding contract',
    handler: async (params, { orgId }) => {
      const { applicationId, policy_number, start_date } = params as {
        applicationId?: string;
        policy_number?: string;
        start_date?: string;
      };
      if (!applicationId) throw new Error('applicationId is required');

      const application = await prisma.application.findFirst({
        where: { id: applicationId, organization_id: orgId },
      });
      if (!application) throw new Error('Application not found');

      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'approved' },
      });

      const contract = await prisma.contract.create({
        data: {
          customer_id: application.customer_id,
          organization_id: orgId,
          policy_number: policy_number || `POL-${Date.now()}`,
          start_date: start_date ? new Date(start_date) : new Date(),
          status: 'active',
          product: application.product || '',
          insurer: application.insurer || '',
        },
      });

      return { applicationId, contractId: contract.id, status: 'approved' };
    },
  },

  // ==========================================================================
  // Customer Operations
  // ==========================================================================

  'generateCustomerNumber': {
    description: 'Generate a unique customer number',
    handler: async (_, { orgId }) => {
      const count = await prisma.customer.count({
        where: { organization_id: orgId },
      });
      const prefix = 'K';
      const number = String(count + 1).padStart(6, '0');
      return { customerNumber: `${prefix}${number}` };
    },
  },

  'detectDuplicates': {
    description: 'Detect potential duplicate customer records',
    handler: async (params, { orgId }) => {
      const { email, firstName, lastName } = params as {
        email?: string;
        firstName?: string;
        lastName?: string;
      };
      const where: Record<string, unknown> = {
        organization_id: orgId,
        archived: false,
      };
      if (email) {
        where.email = email;
      }
      if (firstName || lastName) {
        where.OR = [];
        if (firstName) {
          (where.OR as any[]).push({
            first_name: { contains: firstName, mode: 'insensitive' },
          });
        }
        if (lastName) {
          (where.OR as any[]).push({
            last_name: { contains: lastName, mode: 'insensitive' },
          });
        }
      }
      const duplicates = await prisma.customer.findMany({ where });
      return { duplicates, count: duplicates.length };
    },
  },

  'mergeCustomers': {
    description: 'Merge two customer records',
    handler: async (params, { orgId }) => {
      const { primaryId, secondaryId } = params as {
        primaryId?: string;
        secondaryId?: string;
      };
      if (!primaryId || !secondaryId) throw new Error('primaryId and secondaryId are required');

      const [primary, secondary] = await Promise.all([
        prisma.customer.findFirst({ where: { id: primaryId, organization_id: orgId } }),
        prisma.customer.findFirst({ where: { id: secondaryId, organization_id: orgId } }),
      ]);
      if (!primary || !secondary) throw new Error('One or both customers not found');

      await Promise.all([
        prisma.contract.updateMany({ where: { customer_id: secondaryId }, data: { customer_id: primaryId } }),
        prisma.application.updateMany({ where: { customer_id: secondaryId }, data: { customer_id: primaryId } }),
        prisma.document.updateMany({ where: { customer_id: secondaryId }, data: { customer_id: primaryId } }),
        prisma.lead.updateMany({ where: { customer_id: secondaryId }, data: { customer_id: primaryId } }),
        prisma.task.updateMany({ where: { customer_id: secondaryId }, data: { customer_id: primaryId } }),
      ]);

      await prisma.customer.update({
        where: { id: secondaryId },
        data: { archived: true, archived_at: new Date() },
      });

      return { merged: true, primaryId, archivedId: secondaryId };
    },
  },

  'convertLeadToCustomer': {
    description: 'Convert a lead into a customer record',
    handler: async (params, { orgId, userId }) => {
      const { leadId } = params as { leadId?: string };
      if (!leadId) throw new Error('leadId is required');

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, organization_id: orgId },
      });
      if (!lead) throw new Error('Lead not found');

      const customer = await prisma.customer.create({
        data: {
          organization_id: orgId,
          first_name: lead.first_name || '',
          last_name: lead.last_name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          source: 'lead_conversion',
        },
      });

      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'converted', converted_to_customer_id: customer.id },
      });

      return { customerId: customer.id, leadId };
    },
  },

  // ==========================================================================
  // Portal Operations
  // ==========================================================================

  'getPortalData': {
    description: 'Get all customer portal data in one call',
    handler: async (params, { orgId }) => {
      const { customerId } = params as { customerId?: string };
      if (!customerId) throw new Error('customerId is required');

      const [customer, contracts, applications, documents] = await Promise.all([
        prisma.customer.findFirst({ where: { id: customerId, organization_id: orgId } }),
        prisma.contract.findMany({ where: { customer_id: customerId, organization_id: orgId, archived: false } }),
        prisma.application.findMany({ where: { customer_id: customerId, organization_id: orgId, archived: false } }),
        prisma.document.findMany({ where: { customer_id: customerId, organization_id: orgId, archived: false } }),
      ]);

      return { customer, contracts, applications, documents };
    },
  },

  'inviteCustomerToPortal': {
    description: 'Invite a customer to the portal and create access',
    handler: async (params, { orgId }) => {
      const { customerId, email } = params as { customerId?: string; email?: string };
      if (!customerId) throw new Error('customerId is required');

      const customer = await prisma.customer.findFirst({
        where: { id: customerId, organization_id: orgId },
      });
      if (!customer) throw new Error('Customer not found');

      const token = crypto.randomBytes(32).toString('hex');

      await prisma.customer.update({
        where: { id: customerId },
        data: {
          portal_token: token,
          portal_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { invited: true, customerId, email: email || customer.email, token };
    },
  },

  'managePortalPassword': {
    description: 'Set or reset a portal password for a customer',
    handler: async (params, { orgId }) => {
      const { customerId, password } = params as { customerId?: string; password?: string };
      if (!customerId || !password) throw new Error('customerId and password are required');

      const customer = await prisma.customer.findFirst({
        where: { id: customerId, organization_id: orgId },
      });
      if (!customer) throw new Error('Customer not found');

      const hashed = await bcrypt.hash(password, 12);

      await prisma.customer.update({
        where: { id: customerId },
        data: { portal_password_hash: hashed },
      });

      return { success: true, customerId };
    },
  },

  // ==========================================================================
  // Audit & Logging
  // ==========================================================================

  'createAuditLog': {
    description: 'Create an audit log entry',
    handler: async (params, { orgId, userId }) => {
      const { entity_type, entity_id, action, details } = params as {
        entity_type?: string;
        entity_id?: string;
        action?: string;
        details?: string;
      };

      const log = await prisma.auditLog.create({
        data: {
          audit_id: `audit-${entity_id || 'unknown'}-${Date.now()}`,
          timestamp: new Date(),
          trigger_type: 'manual',
          actor_type: 'user',
          actor_name: userId,
          entity_type: entity_type || 'unknown',
          entity_id: entity_id || '',
          action: action || 'unknown',
          details: details || '',
          organization_id: orgId,
        },
      });

      return { auditLogId: log.id };
    },
  },

  'logError': {
    description: 'Log an error to the error log',
    handler: async (params, { orgId }) => {
      const { message, stack, source, context } = params as {
        message?: string;
        stack?: string;
        source?: string;
        context?: string;
      };

      const errorLog = await prisma.errorLog.create({
        data: {
          message: message || 'No message',
          stack: stack || '',
          source: source || 'frontend',
          context: context || '',
          organization_id: orgId,
        },
      });

      return { errorLogId: errorLog.id };
    },
  },

  'createBackup': {
    description: 'Create a backup log entry',
    handler: async (params, { orgId }) => {
      const { type, notes } = params as { type?: string; notes?: string };

      const backup = await prisma.backupLog.create({
        data: {
          type: type || 'manual',
          status: 'completed',
          notes: notes || '',
          organization_id: orgId,
        },
      });

      return { backupId: backup.id, status: 'completed' };
    },
  },

  // ==========================================================================
  // AI & Insights
  // ==========================================================================

  'aiCustomerInsights': {
    description: 'Generate AI insights for a customer',
    handler: async (params, { orgId }) => {
      const { customerId } = params as { customerId?: string };
      if (!customerId) throw new Error('customerId is required');

      const customer = await prisma.customer.findFirst({
        where: { id: customerId, organization_id: orgId },
        include: { contracts: true, documents: true },
      });
      if (!customer) throw new Error('Customer not found');

      return {
        customerId,
        insights: {
          totalContracts: customer.contracts?.length || 0,
          totalDocuments: customer.documents?.length || 0,
          name: `${customer.first_name} ${customer.last_name}`,
        },
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
