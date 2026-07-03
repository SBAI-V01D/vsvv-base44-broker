// src/routes/logs/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SystemLogService } from "$lib/prisma/service/system-log.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /logs - List with filters
export const GET: RequestHandler = async ({ url, locals }) => {
  const pageSize = Number(url.searchParams.get("pageSize")) || 20;
  const page = Number(url.searchParams.get("page")) || 1;
  const organizationId = url.searchParams.get("organizationId");
  const action = url.searchParams.get("action") || undefined;
  const severity = url.searchParams.get("severity") || undefined;
  const entityType = url.searchParams.get("entityType") || undefined;
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;

  const service = new SystemLogService(prisma);

  try {
    const result = await service.findByOrganization(
      organizationId ?? "",
      { action, severity, entityType, date_from: dateFrom ? new Date(dateFrom) : undefined, date_to: dateTo ? new Date(dateTo) : undefined },
      { page, limit: pageSize }
    );

    return json({ success: true, data: result });
  } catch (error) {
    console.error("GET /logs error:", error);
    return json(
      { success: false, error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
};

// GET /logs/errors - Error analytics
export const GET_ERRORS: RequestHandler = async ({ url }) => {
  const organizationId = url.searchParams.get("organizationId");
  const period = (url.searchParams.get("period") || "week") as "day" | "week" | "month";

  if (!organizationId) {
    return json(
      { success: false, error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const service = new SystemLogService(prisma);
    const count = await service.getErrorCount(organizationId, period);
    return json({ success: true, data: { count, period } });
  } catch (error) {
    console.error("GET /logs/errors error:", error);
    return json(
      { success: false, error: "Failed to fetch error count" },
      { status: 500 }
    );
  }
};

// GET /logs/stats - Action distribution analytics
export const GET_STATS: RequestHandler = async ({ url }) => {
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return json(
      { success: false, error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const service = new SystemLogService(prisma);
    const actions = await service.getActionCountByType(organizationId);
    return json({ success: true, data: actions });
  } catch (error) {
    console.error("GET /logs/stats error:", error);
    return json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
};
