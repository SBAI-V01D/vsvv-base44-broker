// ============================================================================
// avaai Backend — Generic CRUD Route Factory
//
// Generates standard CRUD routes (list, get, create, update, soft-delete)
// for any Prisma model. Enforces tenant isolation and RBAC on every route.
//
// Features:
//   - Type-safe Prisma delegate access
//   - Mass assignment protection
//   - Prisma error → proper HTTP error transformation
//   - Pagination, search, sort, tenant isolation
//   - Socket.io event emission
// ============================================================================

import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma.js';
import type { Role } from '../middleware/rbac.js';
import { requireTenant, tenantWhere } from '../middleware/tenant.js';
import { emitEntityEvent } from './socket.js';

// ---------------------------------------------------------------------------
// Type-Safe Prisma Delegate Access
// ---------------------------------------------------------------------------

/**
 * Keys of PrismaClient that are model delegates (have findMany, create, etc.)
 */
type PrismaModelKey = {
  [K in keyof PrismaClient]: PrismaClient[K] extends {
    findMany: (...args: any[]) => any;
  }
    ? K
    : never;
}[keyof PrismaClient];

/**
 * Type-safe model delegate extractor.
 * Returns the typed delegate for a given model name or throws at runtime.
 */
function getModelDelegate<K extends PrismaModelKey>(modelName: K): PrismaClient[K] {
  const delegate = (prisma as PrismaClient)[modelName];
  if (!delegate || typeof (delegate as any).findMany !== 'function') {
    throw new Error(`Invalid Prisma model: '${String(modelName)}'`);
  }
  return delegate;
}

/**
 * Strips sensitive fields from a data object (mass assignment protection).
 */
function stripSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...data };
  const STRIP_FIELDS = [
    'password_hash',
    'reset_token_hash',
    'role',
    'is_active',
    'organization_id',
  ] as const;
  for (const field of STRIP_FIELDS) {
    delete cleaned[field];
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Prisma Error Handler — transforms raw Prisma errors into proper HTTP errors
// ---------------------------------------------------------------------------

/**
 * Catches known Prisma errors and sends structured HTTP responses.
 * Falls through (throws) for unrecognised errors so Fastify returns 500.
 */
function sendPrismaError(
  reply: any,
  error: any,
  entityName: string,
): void {
  const msg: string = error?.message || '';
  const code: string = error?.code || '';

  // P2012 + P2025 — Missing required argument
  const missingMatch = msg.match(/Argument\s+`(\w+)`\s+is\s+missing/);
  if (missingMatch) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: `Field '${missingMatch[1]}' is required`,
      code: 'MISSING_REQUIRED_FIELD',
    });
  }

  // Invalid enum value — extract allowed values from the error message
  const enumMatch = msg.match(
    /Argument\s+`(\w+)`.*?Invalid enum value.*?Expected:\s*`([^`]+)/,
  );
  if (enumMatch) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: `Invalid value for '${enumMatch[1]}'. Allowed: ${enumMatch[2]}`,
      code: 'INVALID_ENUM_VALUE',
    });
  }

  // Unknown argument (field not in schema)
  const unknownMatch = msg.match(/Unknown argument\s+`(\w+)`/);
  if (unknownMatch) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: `Unknown field '${unknownMatch[1]}' on ${entityName}`,
      code: 'UNKNOWN_FIELD',
    });
  }

  // P2003 — Foreign key constraint
  if (code === 'P2003') {
    const fkMatch = msg.match(/constraint:\s*`\w+_(\w+)_fkey`/);
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: fkMatch
        ? `Referenced '${fkMatch[1]}' does not exist`
        : 'Referenced record not found (foreign key constraint)',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  // P2002 — Unique constraint violation
  if (code === 'P2002') {
    const targetMatch = msg.match(/fields:\s*\(`([^`]+)`\)/);
    return reply.code(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: targetMatch
        ? `A record with this ${targetMatch[1]} already exists`
        : 'A record with this value already exists',
      code: 'UNIQUE_CONSTRAINT',
    });
  }

  // P2025 — Record not found
  if (code === 'P2025') {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  // Value too long (P2000)
  if (code === 'P2000') {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Value too long for a field',
      code: 'VALUE_TOO_LONG',
    });
  }

  // PrismaClientValidationError — bad request from client (missing/invalid args)
  if (error?.name === 'PrismaClientValidationError') {
    const msgLines = (error.message || '').split('\n').filter((l: string) => l.trim());
    // Extract the most useful part: "Argument `xxx` is missing" or "Unknown argument `xxx`"
    const detailLine = msgLines.find(
      (l: string) =>
        l.includes('Argument') &&
        (l.includes('is missing') || l.includes('Unknown argument')),
    );
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: detailLine
        ? detailLine.trim()
        : 'Invalid request body for ' + entityName,
      code: 'VALIDATION_ERROR',
    });
  }

  // Unrecognised Prisma error — re-throw so Fastify returns 500
  throw error;
}

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

  /** Skip tenant filter (organization_id) for models that don't have it */
  skipTenantFilter?: boolean;

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
  'admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance',
];

const DEFAULT_GET_ROLES: Role[] = [
  'admin', 'management', 'broker', 'backoffice',
];

const DEFAULT_CREATE_ROLES: Role[] = ['admin', 'management', 'backoffice'];

const DEFAULT_UPDATE_ROLES: Role[] = [
  'admin', 'management', 'backoffice', 'broker',
];

const DEFAULT_DELETE_ROLES: Role[] = ['admin'];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCrudRoutes(config: CrudConfig): FastifyPluginAsync {
  const {
    model,
    prefix,
    searchFields = [],
    sortableFields = ['created_at', 'updated_at', 'id'],
    defaultSort = { field: 'created_at', order: 'desc' },
    permissions = {},
    include,
    excludeArchived = true,
    skipTenantFilter = false,
    validateCreate,
    validateUpdate,
  } = config;

  // Derive PascalCase entity name for socket events
  const entityName = (model as string).charAt(0).toUpperCase() + (model as string).slice(1);

  return async (app) => {
    const basePath = `/api/${prefix}`;

    // -------------------------------------------------------------------------
    // GET /api/:prefix — List with pagination, search, sort, filter
    // -------------------------------------------------------------------------
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
        try {
          const query = request.query as Record<string, string>;
          const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
          const limit = Math.min(500, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
          const skip = (page - 1) * limit;
          const search = query.search ?? '';
          const sortBy = sortableFields.includes(query.sortBy ?? '')
            ? (query.sortBy as string)
            : defaultSort.field;
          const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

          const where: Record<string, unknown> = {
            ...(skipTenantFilter ? {} : tenantWhere(request)),
          };

          if (excludeArchived) {
            where.archived = false;
          }

          // Pass arbitrary query params as field-level filters
          const KNOWN_PARAMS = new Set(['page', 'limit', 'search', 'sortBy', 'sortOrder']);
          for (const [key, value] of Object.entries(query)) {
            if (KNOWN_PARAMS.has(key) || !value) continue;
            // Coerce basic types
            if (value === 'true') where[key] = true;
            else if (value === 'false') where[key] = false;
            else if (value === 'null') where[key] = null;
            else if (/^\d+$/.test(value)) where[key] = parseInt(value, 10);
            else if (/^\d+\.\d+$/.test(value)) where[key] = parseFloat(value);
            else where[key] = value;
          }

          if (search && searchFields.length > 0) {
            where.OR = searchFields.map((field) => ({
              [field]: { contains: search, mode: 'insensitive' },
            }));
          }

          const delegate = getModelDelegate(model as PrismaModelKey);

          const [data, total] = await Promise.all([
            (delegate as any).findMany({ where, include, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
            (delegate as any).count({ where }),
          ]);

          return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          };
        } catch (error: any) {
          sendPrismaError(reply, error, entityName);
        }
      },
    );

    // -------------------------------------------------------------------------
    // GET /api/:prefix/:id — Single record
    // -------------------------------------------------------------------------
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
        try {
          const { id } = request.params as { id: string };
          const where: Record<string, unknown> = {
            id,
            ...(skipTenantFilter ? {} : tenantWhere(request)),
          };
          if (excludeArchived) {
            where.archived = false;
          }

          const delegate = getModelDelegate(model as PrismaModelKey);
          const record = await (delegate as any).findFirst({ where, include });

          if (!record) {
            return reply.code(404).send({ error: 'not_found', message: `${prefix} not found` });
          }

          return { data: record };
        } catch (error: any) {
          sendPrismaError(reply, error, entityName);
        }
      },
    );

    // -------------------------------------------------------------------------
    // POST /api/:prefix — Create
    // -------------------------------------------------------------------------
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
        try {
          let body = (request.body ?? {}) as Record<string, unknown>;

          // Mass assignment protection
          body = stripSensitiveFields(body);

          // Custom validation
          if (validateCreate) {
            const validationError = await validateCreate(body, request);
            if (validationError) {
              return reply.code(validationError.status || 400).send({ error: validationError.error });
            }
          }

          // Inject organization_id from tenant context (skip for tenant models like Organization)
          if (!skipTenantFilter) {
            body.organization_id = request.user?.organization_id;
          } else {
            // IMPORTANT: For tenant models (Organisation), strip any injected org id
            delete body.organization_id;
          }

          const delegate = getModelDelegate(model as PrismaModelKey);
          const record = await (delegate as any).create({ data: body });

          // Socket.io broadcast
          emitEntityEvent(
            entityName,
            'create',
            record as Record<string, unknown>,
            request.user?.organization_id ?? '',
            request.user?.id ?? '',
          );

          return reply.code(201).send({ data: record });
        } catch (error: any) {
          sendPrismaError(reply, error, entityName);
        }
      },
    );

    // -------------------------------------------------------------------------
    // PATCH /api/:prefix/:id — Update
    // -------------------------------------------------------------------------
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
        try {
          const { id } = request.params as { id: string };
          let body = (request.body ?? {}) as Record<string, unknown>;

          // Mass assignment protection
          body = stripSensitiveFields(body);

          const delegate = getModelDelegate(model as PrismaModelKey);

          // Check record exists and belongs to tenant
          const existing = await (delegate as any).findFirst({
            where: { id, ...(skipTenantFilter ? {} : tenantWhere(request)) },
          });

          if (!existing) {
            return reply.code(404).send({ error: 'not_found' });
          }

          // Custom validation
          if (validateUpdate) {
            const validationError = await validateUpdate(body, id, request);
            if (validationError) {
              return reply.code(validationError.status || 400).send({ error: validationError.error });
            }
          }

          const record = await (delegate as any).update({ where: { id }, data: body });

          // Socket.io broadcast
          emitEntityEvent(
            entityName,
            'update',
            record as Record<string, unknown>,
            request.user?.organization_id ?? '',
            request.user?.id ?? '',
          );

          return { data: record };
        } catch (error: any) {
          sendPrismaError(reply, error, entityName);
        }
      },
    );

    // -------------------------------------------------------------------------
    // DELETE /api/:prefix/:id — Soft delete (archive)
    // -------------------------------------------------------------------------
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
        try {
          const { id } = request.params as { id: string };

          const delegate = getModelDelegate(model as PrismaModelKey);

          const existing = await (delegate as any).findFirst({
            where: { id, ...(skipTenantFilter ? {} : tenantWhere(request)) },
          });

          if (!existing) {
            return reply.code(404).send({ error: 'not_found' });
          }

          const record = await (delegate as any).update({
            where: { id },
            data: {
              archived: true,
              archived_at: new Date(),
              archived_by: request.user?.id,
            },
          });

          // Socket.io broadcast
          emitEntityEvent(
            entityName,
            'delete',
            record as Record<string, unknown>,
            request.user?.organization_id ?? '',
            request.user?.id ?? '',
          );

          return { data: record, message: `${prefix} archived` };
        } catch (error: any) {
          sendPrismaError(reply, error, entityName);
        }
      },
    );
  };
}
