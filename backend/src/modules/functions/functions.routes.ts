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
