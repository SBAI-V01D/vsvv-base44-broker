// src/lib/prisma/service/partnership-commission.service.ts
import type { PartnershipCommission } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export class PartnershipCommissionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ------------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------------
  async create(
    data: Prisma.ParnershipCommissionCreateInput
  ): Promise<PartnershipCommission> {
    return this.prisma.partnershipCommission.create({
      data,
    });
  }

  // ------------------------------------------------------------------
  // READ
  // ------------------------------------------------------------------
  async findById(id: string): Promise<PartnershipCommission | null> {
    return this.prisma.partnershipCommission.findUnique({ where: { id } });
  }

  async findAll(
    params: {
      partner_id?: string;
      organization_id?: string;
      type?: string;
      status?: string;
      rate_gte?: number;
    },
    pagination: { page: number; limit: number }
  ): Promise<{
    commissions: PartnershipCommission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { partner_id, organization_id, type, status, rate_gte } = params;
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const where: Prisma.ParnershipCommissionWhereInput = {
      archived: false,
      ...(partner_id && { partner_id }),
      ...(organization_id && { organization_id }),
      ...(type && { commission_type: type }),
      ...(status && { status }),
      ...(rate_gte !== undefined && { rate: { gte: rate_gte } }),
    };

    const [commissions, total] = await Promise.all([
      this.prisma.partnershipCommission.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          partner: { select: { id: true, name: true } },
          organization: { select: { id: true, name: true } },
        },
      }),
      this.prisma.partnershipCommission.count({ where }),
    ]);

    return { commissions, total, page: pagination.page, limit: pagination.limit };
  }

  async findActiveByPartner(partnerId: string): Promise<PartnershipCommission[]> {
    return this.prisma.partnershipCommission.findMany({
      where: {
        partner_id: partnerId,
        status: "active",
        archived: false,
      },
    });
  }

  // ------------------------------------------------------------------
  // UPDATE
  // ------------------------------------------------------------------
  async update(
    id: string,
    data: Prisma.ParnershipCommissionUpdateInput
  ): Promise<PartnershipCommission> {
    return this.prisma.partnershipCommission.update({ where: { id }, data });
  }

  // ------------------------------------------------------------------
  // DELETE (soft)
  // ------------------------------------------------------------------
  async archive(id: string, userId: string): Promise<PartnershipCommission> {
    return this.prisma.partnershipCommission.update({
      where: { id },
      data: {
        archived: true,
        archived_at: new Date(),
        archived_by: userId,
      },
    });
  }

  // ------------------------------------------------------------------
  // CALCULATION HELPERS
  // ------------------------------------------------------------------
  async calculateCommission(
    commissionId: string,
    baseAmount: number
  ): Promise<{ amount: number; rate: number; currency: string }> {
    const commission = await this.findById(commissionId);
    if (!commission) {
      throw new Error(`Commission ${commissionId} not found`);
    }

    let amount = 0;

    if (commission.commission_type === "percentage" && commission.rate) {
      amount = baseAmount * (commission.rate / 100);
    } else if (commission.commission_type === "fixed_rate" && commission.fixed_amount) {
      amount = commission.fixed_amount;
    } else if (commission.commission_type === "tiered" && commission.rate) {
      // Simple tier: flat rate for simplicity, can be extended
      amount = baseAmount * (commission.rate / 100);
    } else {
      throw new Error("Unable to calculate commission: missing rate or fixed_amount");
    }

    return {
      amount,
      rate: commission.rate ?? 0,
      currency: commission.currency ?? "CHF",
    };
  }
}
