// src/routes/partner-documents/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PartnerDocumentService } from "$lib/prisma/service/partner-document.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /partner-documents - List with pagination & filters
export const GET: RequestHandler = async ({ url, locals }) => {
  const pageSize = Number(url.searchParams.get("pageSize")) || 20;
  const page = Number(url.searchParams.get("page")) || 1;
  const partnerId = url.searchParams.get("partnerId");
  const search = url.searchParams.get("search");
  const type = url.searchParams.get("type") || undefined;
  const status = url.searchParams.get("status") || undefined;

  try {
    const service = new PartnerDocumentService(prisma);
    const result = await service.findAll(
      { partner_id: partnerId ?? undefined, search, type, status },
      { page, limit: pageSize }
    );

    return json({ success: true, data: result });
  } catch (error) {
    console.error("GET /partner-documents error:", error);
    return json(
      { success: false, error: "Failed to fetch partner documents" },
      { status: 500 }
    );
  }
};

// POST /partner-documents - Create new document
export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const { name, type, partner_id, organization_id, description, upload_url } = body;

  if (!name || !type) {
    return json(
      { success: false, error: "name and type are required" },
      { status: 400 }
    );
  }

  try {
    const service = new PartnerDocumentService(prisma);
    const user = locals.user; // SvelteKit auth middleware assigns this
    const userId = user?.id ?? "system";

    const document = await service.create(
      { name, type, partner_id, organization_id, description, upload_url },
      userId
    );

    return json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("POST /partner-documents error:", error);
    return json(
      { success: false, error: "Failed to create partner document" },
      { status: 500 }
    );
  }
};
