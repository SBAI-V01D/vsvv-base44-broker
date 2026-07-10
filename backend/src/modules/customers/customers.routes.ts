// ============================================================================
// VSVV Backend — Customers Module Routes
//
// Uses the generic CRUD factory for standard operations and adds
// customer-specific custom routes (e.g., family members, statistics).
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { createCrudRoutes } from '../../lib/crud-factory.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from './customers.schema.js';

const customersRoutes: FastifyPluginAsync = async (app) => {
  // ---------------------------------------------------------------------------
  // Standard CRUD via generic factory
  // ---------------------------------------------------------------------------
  await app.register(
    createCrudRoutes({
      model: 'customer',
      prefix: 'customers',

      // Searchable fields for the ?search= parameter
      searchFields: [
        'first_name',
        'last_name',
        'email',
        'phone',
        'city',
        'policy_number',
      ],

      // Sortable fields
      sortableFields: [
        'createdAt',
        'updatedAt',
        'last_name',
        'first_name',
        'city',
        'status',
      ],

      defaultSort: { field: 'last_name', order: 'asc' },

      // RBAC — 7 roles mapped per operation
      permissions: {
        list: [
          'admin',
          'management',
          'broker',
          'backoffice',
          'finance',
          'support',
          'compliance',
        ],
        get: ['admin', 'management', 'broker', 'backoffice'],
        create: ['admin', 'management', 'backoffice'],
        update: ['admin', 'management', 'broker', 'backoffice'],
        delete: ['admin'],
      },

      // Include related records (limited to 5 most recent contracts)
      include: {
        contracts: {
          where: { archived: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },

      // Validation hooks using Zod schemas
      validateCreate: async (body, _request) => {
        try {
          createCustomerSchema.parse(body);
        } catch (err: unknown) {
          const zodErr = err as {
            errors?: Array<{ message: string }>;
          };
          return {
            error:
              zodErr.errors
                ?.map((e: { message: string }) => e.message)
                .join(', ') || 'Validation failed',
            status: 400,
          };
        }
      },

      validateUpdate: async (body, _id, _request) => {
        // Clean up empty strings that would pass Zod but fail Prisma
        // (Prisma enums / DateTime don't accept '')
        if (body.birthdate === '') body.birthdate = undefined;
        if (body.canton === '') body.canton = undefined;
        if (body.advisor_id === '') body.advisor_id = undefined;
        if (body.primary_customer_id === '') body.primary_customer_id = undefined;
        try {
          // Parse AND use the result to strip unknown fields
          // (frontend sends extra fields like contracts, id, created_at etc.
          //  that would cause Prisma to throw)
          const parsed = updateCustomerSchema.parse(body);
          Object.keys(body).forEach(key => {
            if (!(key in parsed)) delete (body as Record<string, unknown>)[key];
          });
        } catch (err: unknown) {
          const zodErr = err as {
            errors?: Array<{ message: string }>;
          };
          return {
            error:
              zodErr.errors
                ?.map((e: { message: string }) => e.message)
                .join(', ') || 'Validation failed',
            status: 400,
          };
        }
      },
    }),
  );

  // ---------------------------------------------------------------------------
  // Custom Customer Routes — add below here
  // ---------------------------------------------------------------------------
  //
  // Examples:
  //   GET  /api/customers/stats         — Customer statistics dashboard
  //   GET  /api/customers/:id/family    — Family members of a customer
  //   GET  /api/customers/:id/timeline  — Full interaction timeline
  //
};

export default customersRoutes;
