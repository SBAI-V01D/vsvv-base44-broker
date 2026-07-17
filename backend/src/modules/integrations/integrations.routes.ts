import type { FastifyPluginAsync } from 'fastify';
import { addJob, QueueName } from '../../lib/queue.js';

const integrationsRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/integrations/email/send — Queue an email for delivery
  app.post(
    '/api/integrations/email/send',
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { to, subject, body, html } = (request.body ?? {}) as {
        to?: string;
        subject?: string;
        body?: string;
        html?: string;
      };

      if (!to || !subject) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'to and subject are required',
        });
      }

      await addJob(QueueName.EMAIL, 'send-email', {
        to,
        subject,
        body: body || '',
        html: html || undefined,
        organization_id: request.user?.organization_id,
        triggered_by: request.user?.id,
      });

      return { success: true, message: 'Email queued for delivery' };
    },
  );
};

export default integrationsRoutes;
