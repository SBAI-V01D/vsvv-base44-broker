// src/routes/commissions/[id]/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PartnershipCommissionService } from "$lib/prisma/service/partnership-commission.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  try {
    const service = new PartnershipCommissionService(prisma);
    const commission = await service.findById(id);

    if (!commission) {
      return json(
        { success: false, error: "Commission not found" },
        { status: 404 }
      );
    }

    return json({ success: true, data: commission });
  } catch (error) {
    console.error("GET /commissions/[id] error:", error);
    return json(
      { success: false, error: "Failed to fetch commission" },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const body = await request.json();

  try {
    const service = new PartnershipCommissionService(prisma);
    const commission = await service.update(id, body);
    return json({ success: true, data: commission });
  } catch (error) {
    console.error("PUT /commissions/[id] error:", error);
    return json(
      { success: false, error: "Failed to update commission" },
      { status: 500 }
    );
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const body = await request.json();
  const userId = body.userId ?? "system";

  try {
    const service = new PartnershipCommissionService(prisma);
    const commission = await service.archive(id, userId);
    return json({ success: true, data: commission });
  } catch (error) {
    console.error("PATCH /commissions/[id]/archive error:", error);
    return json(
      { success: false, error: "Failed to archive commission" },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const body = await request.json();
  const baseAmount = Number(body.baseAmount);

  if (!baseAmount || baseAmount <= 0) {
    return json(
      { success: false, error: "baseAmount must be positive" },
      { status: 400 }
    );
  }

  try {
    const service = new PartnershipCommissionService(prisma);
    const calculation = await service.calculateCommission(id, baseAmount);
    return json({ success: true, data: calculation });
  } catch (error) {
    console.error("POST /commissions/[id]/calculate error:", error);
    return json(
      { success: false, error: "Failed to calculate commission" },
      { status: 500 }
    );
  }
};
