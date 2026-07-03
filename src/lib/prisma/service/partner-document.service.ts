// src/lib/prisma/service/partner-document.service.ts
import type { PartnerDocument, PartnerDocumentType, DocumentStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export class PartnerDocumentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ------------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------------
  async create(
    data: Prisma.PartnerDocumentCreateInput,
    userId: string
  ): Promise<PartnerDocument> {
    return this.prisma.partnerDocument.create({
      data: {
        ...data,
        uploadedBy: userId,
      },
      include: {
        partner: true,
        organization: true,
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // ------------------------------------------------------------------
  // READ
  // ------------------------------------------------------------------
  async findById(id: string): Promise<PartnerDocument | null> {
    return this.prisma.partnerDocument.findUnique({
      where: { id },
      include: {
        partner: true,
        organization: true,
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(
    params: {
      partner_id?: string;
      organization_id?: string;
      type?: PartnerDocumentType;
      status?: DocumentStatus;
      search?: string;
    },
    pagination: { page: number; limit: number }
  ): Promise<{
    documents: PartnerDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { partner_id, organization_id, type, status, search } = params;
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const where: Prisma.PartnerDocumentWhereInput = {
      archived: false,
      ...(partner_id && { partner_id }),
      ...(organization_id && { organization_id }),
      ...(type && { type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { upload_url: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [documents, total] = await Promise.all([
      this.prisma.partnerDocument.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          partner: { select: { id: true, name: true } },
          organization: { select: { id: true, name: true } },
          uploader: { select: { id: true, name: true } },
        },
      }),
      this.prisma.partnerDocument.count({ where }),
    ]);

    return { documents, total, page: pagination.page, limit: pagination.limit };
  }

  async findByPartner(partnerId: string): Promise<PartnerDocument[]> {
    return this.prisma.partnerDocument.findMany({
      where: { partner_id: partnerId, archived: false },
      orderBy: { created_at: "desc" },
      include: {
        partner: true,
        organization: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // UPDATE
  // ------------------------------------------------------------------
  async update(
    id: string,
    data: Prisma.PartnerDocumentUpdateInput
  ): Promise<PartnerDocument> {
    return this.prisma.partnerDocument.update({
      where: { id },
      data,
      include: {
        partner: true,
        organization: true,
        uploader: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ------------------------------------------------------------------
  // DELETE (soft)
  // ------------------------------------------------------------------
  async archive(id: string, userId: string): Promise<PartnerDocument> {
    return this.prisma.partnerDocument.update({
      where: { id },
      data: {
        archived: true,
        archived_at: new Date(),
        archived_by: userId,
      },
    });
  }

  async restore(id: string): Promise<PartnerDocument> {
    return this.prisma.partnerDocument.update({
      where: { id },
      data: {
        archived: false,
        archived_at: null,
        archived_by: null,
      },
    });
  }
}
