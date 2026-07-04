// ============================================================================
// avaai Backend — Verkaufschancen Module Routes
//
// CRUD for sales opportunities (Verkaufschancen) using the generic factory.
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { createCrudRoutes } from '../../lib/crud-factory.js';

const verkaufschancenRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'verkaufschance',
      prefix: 'verkaufschancen',

      searchFields: [
        'title',
        'customer_name',
        'sparte',
        'notes',
      ],

      sortableFields: [
        'created_at',
        'updated_at',
        'title',
        'status',
        'priority',
        'estimated_value',
        'expected_close_date',
      ],

      defaultSort: { field: 'created_at', order: 'desc' },

      permissions: {
        list: ['admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance'],
        get: ['admin', 'management', 'broker', 'backoffice'],
        create: ['admin', 'management', 'broker', 'backoffice'],
        update: ['admin', 'management', 'broker', 'backoffice'],
        delete: ['admin'],
      },

      include: {
        customer: true,
      },
    }),
  );
};

export default verkaufschancenRoutes;
