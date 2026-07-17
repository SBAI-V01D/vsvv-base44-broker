// ============================================================================
// VSVV Backend — Generic CRUD Route Factory
//
// Generates standard CRUD routes (list, get, create, update, soft-delete)
// for any Prisma model. Enforces tenant isolation and RBAC on every route.
//
// Usage:
//   createCrudRoutes({
//     model: 'customer',
//     prefix: 'customers',
//     searchFields: ['first_name', 'last_name', 'email'],
//     include: { contracts: true },
//   })
// ============================================================================

import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma.js';
import type { Role } from '../middleware/rbac.js';
import { requireTenant, tenantWhere } from '../middleware/tenant.js';
import { emitEntityEvent } from './socket.js';

// ---------------------------------------------------------------------------
// Constants — fields stripped from responses
// ---------------------------------------------------------------------------

const SENSITIVE_FIELDS = ['password_hash', 'reset_token_hash'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrudConfig {
  /** Prisma model delegate key (e.g., 'customer', 'contract') */
  model: keyof PrismaClient;

  /** Route prefix (e.g., 'customers' → /api/customers) */
  prefix: string;

  /** Searchable text fields for the ?search= parameter */
  searchFields?: string[];

  /** Fields allowed in ?sortBy= parameter */
  sortableFields?: string[];

  /** Default sort order */
  defaultSort?: { field: string; order: 'asc' | 'desc' };

  /** Allowed roles for each CRUD operation */
  permissions?: {
    list?: Role[];
    get?: Role[];
    create?: Role[];
    update?: Role[];
    delete?: Role[];
  };

  /** Additional Prisma include for relations */
  include?: Record<string, unknown>;

  /** Whether to exclude archived records from list/get */
  excludeArchived?: boolean;

  /** Custom validation before create */
  validateCreate?: (
    body: Record<string, unknown>,
    request: FastifyRequest,
  ) => Promise<{ error: string; status: number } | void>;

  /** Custom validation before update */
  validateUpdate?: (
    body: Record<string, unknown>,
    id: string,
    request: FastifyRequest,
  ) => Promise<{ error: string; status: number } | void>;
}

// ---------------------------------------------------------------------------
// Default role sets
// ---------------------------------------------------------------------------

const DEFAULT_LIST_ROLES: Role[] = [
  'admin',
  'management',
  'broker',
  'backoffice',
  'finance',
  'support',
  'compliance',
];

const DEFAULT_GET_ROLES: Role[] = [
  'admin',
  'management',
  'broker',
  'backoffice',
];

const DEFAULT_CREATE_ROLES: Role[] = ['admin', 'management', 'backoffice'];

const DEFAULT_UPDATE_ROLES: Role[] = [
  'admin',
  'management',
  'backoffice',
  'broker',
];

const DEFAULT_DELETE_ROLES: Role[] = ['admin'];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCrudRoutes(config: CrudConfig, options?: { skipCrud?: boolean }): FastifyPluginAsync {
  const {
    model,
    prefix,
    searchFields = [],
    sortableFields = ['created_at', 'updated_at', 'id'],
    defaultSort = { field: 'created_at', order: 'desc' },
    permissions = {},
    include,
    excludeArchived = true,
    validateCreate,
    validateUpdate,
  } = config;

  // Derive PascalCase entity name for socket events (e.g. 'customer' → 'Customer')
  const entityName = (model as string).charAt(0).toUpperCase() + (model as string).slice(1);

  return async (app) => {
    const basePath = `/api/${prefix}`;

    if (options?.skipCrud) {
      return;
    }

    // -----------------------------------------------------------------------
    // GET /api/:prefix — List with pagination, search, sort, filter
    // -----------------------------------------------------------------------
    app.get(
      basePath,
      {
        preHandler: [
          app.requireAuth,
          requireTenant,
          app.requireRole(permissions.list ?? DEFAULT_LIST_ROLES),
        ],
      },
      async (request, reply) => {
        const query = request.query as Record<string, string>;
        const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
        const limit = Math.min(
          100,
          Math.max(1, parseInt(query.limit ?? '20', 10) || 20),
        );
        const skip = (page - 1) * limit;
        const search = query.search ?? '';
        const sortBy = sortableFields.includes(query.sortBy ?? '')
          ? (query.sortBy as string)
          : defaultSort.field;
        const sortOrder: 'asc' | 'desc' =
          query.sortOrder === 'asc' ? 'asc' : 'desc';

        // Build the where clause with tenant isolation
        const where: Record<string, unknown> = {
          ...tenantWhere(request),
        };

        // Exclude archived by default
        if (excludeArchived) {
          where.archived = false;
        }

        // Text search across specified fields (case-insensitive contains)
        if (search && searchFields.length > 0) {
          where.OR = searchFields.map((field) => ({
            [field]: { contains: search, mode: 'insensitive' },
          }));
        }

        // Execute query
        const [data, total] = await Promise.all([
          (prisma as any)[model].findMany({
            where,
            include,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
          }),
          (prisma as any)[model].count({ where }),
        ]);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
    );

    // -----------------------------------------------------------------------
    // GET /api/:prefix/:id — Single record
    // -----------------------------------------------------------------------
    app.get(
      `${basePath}/:id`,
      {
        preHandler: [
          app.requireAuth,
          requireTenant,
          app.requireRole(permissions.get ?? permissions.list ?? DEFAULT_GET_ROLES),
        ],
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const where: Record<string, unknown> = {
          id,
          ...tenantWhere(request),
        };
        if (excludeArchived) {
          where.archived = false;
        }

        const record = await (prisma as any)[model].findFirst({
          where,
          include,
        });

        if (!record) {
          return reply
            .code(404)
            .send({ error: 'not_found', message: `${prefix} not found` });
        }

        return { data: record };
      },
    );

    // -----------------------------------------------------------------------
    // POST /api/:prefix — Create
    // -----------------------------------------------------------------------
    app.post(
      basePath,
      {
        preHandler: [
          app.requireAuth,
          requireTenant,
          app.requireRole(permissions.create ?? DEFAULT_CREATE_ROLES),
        ],
      },
      async (request, reply) => {
        const body = (request.body ?? {}) as Record<string, unknown>;

        // Custom validation
        if (validateCreate) {
          const validationError = await validateCreate(body, request);
          if (validationError) {
            return reply
              .code(validationError.status || 400)
              .send({ error: validationError.error });
          }
        }

        // Inject organization_id from tenant context
        body.organization_id =
          request.user?.organization_id ?? body.organization_id;

        const record = await (prisma as any)[model].create({ data: body });

        // Broadcast via Socket.io
        emitEntityEvent(
          entityName,
          'create',
          record as Record<string, unknown>,
          request.user?.organization_id ?? '',
          request.user?.id ?? '',
        );

        return reply.code(201).send({ data: record });
      },
    );

    // -----------------------------------------------------------------------
    // PATCH /api/:prefix/:id — Update
    // -----------------------------------------------------------------------
    app.patch(
      `${basePath}/:id`,
      {
        preHandler: [
          app.requireAuth,
          requireTenant,
          app.requireRole(permissions.update ?? DEFAULT_UPDATE_ROLES),
        ],
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = (request.body ?? {}) as Record<string, unknown>;

        // Check record exists and belongs to tenant
        const existing = await (prisma as any)[model].findFirst({
          where: { id, ...tenantWhere(request) },
        });

        if (!existing) {
          return reply.code(404).send({ error: 'not_found' });
        }

        // Custom validation
        if (validateUpdate) {
          const validationError = await validateUpdate(body, id, request);
          if (validationError) {
            return reply
              .code(validationError.status || 400)
              .send({ error: validationError.error });
          }
        }

        // Don't allow changing organization_id
        delete body.organization_id;

        const record = await (prisma as any)[model].update({
          where: { id },
          data: body,
        });

        // Broadcast via Socket.io
        emitEntityEvent(
          entityName,
          'update',
          record as Record<string, unknown>,
          request.user?.organization_id ?? '',
          request.user?.id ?? '',
        );

        return { data: record };
      },
    );

    // -----------------------------------------------------------------------
    // DELETE /api/:prefix/:id — Soft delete (archive)
    // -----------------------------------------------------------------------
    app.delete(
      `${basePath}/:id`,
      {
        preHandler: [
          app.requireAuth,
          requireTenant,
          app.requireRole(permissions.delete ?? DEFAULT_DELETE_ROLES),
        ],
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };

        const existing = await (prisma as any)[model].findFirst({
          where: { id, ...tenantWhere(request) },
        });

        if (!existing) {
          return reply.code(404).send({ error: 'not_found' });
        }

        const record = await (prisma as any)[model].update({
          where: { id },
          data: {
            archived: true,
            archived_at: new Date(),
            archived_by: request.user?.id,
          },
        });

        // Broadcast via Socket.io
        emitEntityEvent(
          entityName,
          'delete',
          record as Record<string, unknown>,
          request.user?.organization_id ?? '',
          request.user?.id ?? '',
        );

        return { data: record, message: `${prefix} archived` };
      },
    );
  };
}
