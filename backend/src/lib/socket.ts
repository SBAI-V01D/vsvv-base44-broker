// ============================================================================
// VSVV Backend — Socket.io Server
//
// Provides real-time event broadcasting for entity CRUD operations.
// Integrates with Fastify's underlying Node.js HTTP server.
// Enforces JWT authentication and multi-tenant room isolation.
// ============================================================================

import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const { verify } = jwt;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EntityEvent {
  type: 'create' | 'update' | 'delete';
  entity: string;
  id: string;
  data: Record<string, unknown>;
  organization_id: string;
  changed_by: string;
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Socket.io Server Singleton
// ---------------------------------------------------------------------------

let io: SocketIOServer | null = null;

/**
 * Initialize the Socket.io server on top of Fastify's HTTP server.
 * Must be called AFTER Fastify has started listening (so `fastify.server` exists).
 */
export function initSocketServer(app: FastifyInstance): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(app.server, {
    cors: {
      origin: env.CORS_ORIGIN ?? '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Only allow authenticated connections
    allowRequest: (_req, callback) => {
      callback(null, true); // actual auth is in middleware below
    },
  });

  // -----------------------------------------------------------------------
  // JWT Authentication Middleware
  // -----------------------------------------------------------------------
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verify(token, env.JWT_SECRET) as JwtPayload;
      // Attach user data to socket for downstream usage
      (socket as any).user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        organization_id: decoded.organization_id,
      };
      next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  // -----------------------------------------------------------------------
  // Connection Handler
  // -----------------------------------------------------------------------
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    const orgId = user.organization_id;

    // Auto-join the organization room for tenant-scoped broadcasts
    socket.join(`org:${orgId}`);

    app.log.info(
      `[Socket] User ${user.id} connected — org:${orgId} — socket:${socket.id}`,
    );

    // -------------------------------------------------------------------
    // Subscribe to entity changes
    // -------------------------------------------------------------------
    socket.on('subscribe:entity', (entityName: string) => {
      if (typeof entityName !== 'string' || !entityName) return;

      const room = `entity:${entityName}:${orgId}`;
      socket.join(room);

      app.log.debug(
        `[Socket] ${user.id} subscribed to ${room}`,
      );
    });

    // -------------------------------------------------------------------
    // Unsubscribe from entity changes
    // -------------------------------------------------------------------
    socket.on('unsubscribe:entity', (entityName: string) => {
      if (typeof entityName !== 'string' || !entityName) return;

      const room = `entity:${entityName}:${orgId}`;
      socket.leave(room);

      app.log.debug(
        `[Socket] ${user.id} unsubscribed from ${room}`,
      );
    });

    // -------------------------------------------------------------------
    // Disconnect
    // -------------------------------------------------------------------
    socket.on('disconnect', (reason) => {
      app.log.info(
        `[Socket] User ${user.id} disconnected — reason: ${reason}`,
      );
    });
  });

  app.log.info('[Socket] Socket.io server initialized');
  return io;
}

/**
 * Get the Socket.io server instance.
 * Returns null if not yet initialized.
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit an entity change event to all subscribers in the entity's org room.
 *
 * @param entityName - PascalCase entity name, e.g. "Customer"
 * @param type       - Event type: "create" | "update" | "delete"
 * @param data       - The record data (or a subset)
 * @param orgId      - Organization ID for tenant isolation
 * @param changedBy  - User ID who made the change
 */
export function emitEntityEvent(
  entityName: string,
  type: EntityEvent['type'],
  data: Record<string, unknown>,
  orgId: string,
  changedBy: string,
): void {
  if (!io) return;

  const eventName = `entity:${entityName}:changed`;
  const room = `entity:${entityName}:${orgId}`;

  const payload: EntityEvent = {
    type,
    entity: entityName,
    id: (data.id as string) ?? '',
    data,
    organization_id: orgId,
    changed_by: changedBy,
  };

  io.to(room).emit(eventName, payload);
}

/**
 * Emit an event to all members of an organization.
 *
 * @param event          - The event name (e.g. "extraction:complete")
 * @param data           - The payload to send
 * @param organizationId - Organization ID for tenant-scoped broadcast
 */
export function emitToOrganization(
  event: string,
  data: Record<string, unknown>,
  organizationId: string,
): void {
  if (!io) return;
  io.to(`org:${organizationId}`).emit(event, data);
}

/**
 * Gracefully shut down the Socket.io server.
 */
export async function closeSocketServer(): Promise<void> {
  if (io) {
    await io.close();
    io = null;
  }
}
