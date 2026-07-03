// src/lib/prisma/service/system-log.service.ts
import type { SystemLog } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export class SystemLogService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ------------------------------------------------------------------
  // CREATE (fire-and-forget style)
  // ------------------------------------------------------------------
  async create(
    data: Prisma.SystemLogCreateInput,
    options?: { severity?: string }
  ): Promise<void> {
    await this.prisma.systemLog.create({
      data: {
        ...data,
        severity: options?.severity ?? "info",
      },
    });
  }

  async createMany(logs: Prisma.SystemLogCreateManyInput[]): Promise<void> {
    await this.prisma.systemLog.createMany({
      data: logs,
    });
  }

  // ------------------------------------------------------------------
  // READ
  // ------------------------------------------------------------------
  async findById(id: string): Promise<SystemLog | null> {
    return this.prisma.systemLog.findUnique({ where: { id } });
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<SystemLog[]> {
    return this.prisma.systemLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  async findByUser(
    userId: string,
    params: {
      action?: string;
      severity?: string;
    },
    pagination: { page: number; limit: number }
  ): Promise<{ logs: SystemLog[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const where: Prisma.SystemLogWhereInput = {
      user_id: userId,
      ...(params.action && { action: params.action }),
      ...(params.severity && { severity: params.severity }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { logs, total };
  }

  async findByOrganization(
    organizationId: string,
    params: {
      action?: string;
      entityType?: string;
      severity?: string;
      date_from?: Date;
      date_to?: Date;
    },
    pagination: { page: number; limit: number }
  ): Promise<{ logs: SystemLog[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const where: Prisma.SystemLogWhereInput = {
      organization_id: organizationId,
      ...(params.action && { action: params.action }),
      ...(params.entityType && { entity_type: params.entityType }),
      ...(params.severity && { severity: params.severity }),
      ...(params.date_from && { created_at: { gte: params.date_from } }),
      ...(params.date_to && { created_at: { lte: params.date_to } }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
        },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { logs, total };
  }

  // ------------------------------------------------------------------
  // ANALYTICS
  // ------------------------------------------------------------------
  async getErrorCount(
    organizationId: string,
    period: "day" | "week" | "month"
  ): Promise<number> {
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return this.prisma.systemLog.count({
      where: {
        organization_id: organizationId,
        severity: "error",
        created_at: { gte: startDate },
      },
    });
  }

  async getActionCountByType(
    organizationId: string,
    limit: number = 10
  ): Promise<
    Array<{ action: string; count: number }>
  > {
    const result = await this.prisma.systemLog.groupBy({
      by: ["action"],
      where: {
        organization_id: organizationId,
        severity: "critical",
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: limit,
    });

    return result.map((item) => ({
      action: item.action ?? "",
      count: item._count.action,
    }));
  }
}
