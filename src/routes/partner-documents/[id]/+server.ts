// src/routes/partner-documents/[id]/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PartnerDocumentService } from "$lib/prisma/service/partner-document.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /partner-documents/[id] - Fetch single document
export const GET: RequestHandler = async ({ params, locals }) => {
  const { id } = params;

  try {
    const service = new PartnerDocumentService(prisma);
    const document = await service.findById(id);

    if (!document) {
      return json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return json({ success: true, data: document });
  } catch (error) {
    console.error("GET /partner-documents/[id] error:", error);
    return json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
};

// PUT /partner-documents/[id] - Update document
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const { id } = params;
  const body = await request.json();

  try {
    const service = new PartnerDocumentService(prisma);
    const document = await service.update(id, body);
    return json({ success: true, data: document });
  } catch (error) {
    console.error("PUT /partner-documents/[id] error:", error);
    return json(
      { success: false, error: "Failed to update document" },
      { status: 500 }
    );
  }
};

// PATCH /partner-documents/[id]/archive - Soft delete
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const { id } = params;
  const body = await request.json();
  const userId = body.userId ?? locals.user?.id ?? "system";

  try {
    const service = new PartnerDocumentService(prisma);
    const document = await service.archive(id, userId);
    return json({ success: true, data: document });
  } catch (error) {
    console.error("PATCH /partner-documents/[id]/archive error:", error);
    return json(
      { success: false, error: "Failed to archive document" },
      { status: 500 }
    );
  }
};

// DELETE /partner-documents/[id] - Hard delete
export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  try {
    await prisma.partnerDocument.delete({ where: { id } });
    return json({ success: true });
  } catch (error) {
    console.error("DELETE /partner-documents/[id] error:", error);
    return json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
};
