// src/routes/commissions/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PartnershipCommissionService } from "$lib/prisma/service/partnership-commission.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /commissions - List with pagination & filters
export const GET: RequestHandler = async ({ url, locals }) => {
  const pageSize = Number(url.searchParams.get("pageSize")) || 20;
  const page = Number(url.searchParams.get("page")) || 1;
  const partnerId = url.searchParams.get("partnerId");
  const type = url.searchParams.get("type") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const rateGte = Number(url.searchParams.get("rateGte")) || undefined;

  try {
    const service = new PartnershipCommissionService(prisma);
    const result = await service.findAll(
      { partner_id: partnerId ?? undefined, type, status, rate_gte: rateGte },
      { page, limit: pageSize }
    );

    return json({ success: true, data: result });
  } catch (error) {
    console.error("GET /commissions error:", error);
    return json(
      { success: false, error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
};

// POST /commissions - Create new commission
export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const { partner_id, organization_id, contract_id, commission_type, rate, fixed_amount, period, description, start_date } = body;

  if (!commission_type) {
    return json(
      { success: false, error: "commission_type is required" },
      { status: 400 }
    );
  }

  try {
    const service = new PartnershipCommissionService(prisma);
    const commission = await service.create({
      partner_id,
      organization_id,
      contract_id,
      commission_type,
      rate,
      fixed_amount,
      period,
      description,
      start_date,
    });

    return json({ success: true, data: commission }, { status: 201 });
  } catch (error) {
    console.error("POST /commissions error:", error);
    return json(
      { success: false, error: "Failed to create commission" },
      { status: 500 }
    );
  }
};
