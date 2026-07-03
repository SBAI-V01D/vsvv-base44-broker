// src/lib/api/client.ts
import { browser } from "$app/environment";

const API_BASE = browser ? "/api" : `${process.env.API_URL ?? "http://localhost:5173"}/api`;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ------------------------------------------------------------------
// Generic fetch wrapper
// ------------------------------------------------------------------
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Attach auth token from cookie/localStorage if available
  if (browser) {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? "API request failed");
  }

  return body as ApiResponse<T>;
}

// ------------------------------------------------------------------
// Partner Documents
// ------------------------------------------------------------------
export const partnerDocumentsApi = {
  list: (params: {
    page?: number;
    pageSize?: number;
    partnerId?: string;
    search?: string;
    type?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.partnerId) qs.set("partnerId", params.partnerId);
    if (params.search) qs.set("search", params.search);
    if (params.type) qs.set("type", params.type);
    if (params.status) qs.set("status", params.status);

    return fetchApi<{
      documents: unknown[];
      total: number;
      page: number;
      limit: number;
    }>(`/partner-documents?${qs.toString()}`);
  },

  create: (data: Record<string, unknown>) =>
    fetchApi("/partner-documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    fetchApi(`/partner-documents/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/partner-documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  archive: (id: string, userId?: string) =>
    fetchApi(`/partner-documents/${id}/archive`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    }),
};

// ------------------------------------------------------------------
// Commissions
// ------------------------------------------------------------------
export const commissionsApi = {
  list: (params: {
    page?: number;
    pageSize?: number;
    partnerId?: string;
    type?: string;
    status?: string;
    rateGte?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.partnerId) qs.set("partnerId", params.partnerId);
    if (params.type) qs.set("type", params.type);
    if (params.status) qs.set("status", params.status);
    if (params.rateGte) qs.set("rateGte", String(params.rateGte));

    return fetchApi<{
      commissions: unknown[];
      total: number;
      page: number;
      limit: number;
    }>(`/commissions?${qs.toString()}`);
  },

  create: (data: Record<string, unknown>) =>
    fetchApi("/commissions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    fetchApi(`/commissions/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/commissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  calculate: (id: string, baseAmount: number) =>
    fetchApi<{ amount: number; rate: number; currency: string }>(
      `/commissions/${id}/calculate`,
      {
        method: "POST",
        body: JSON.stringify({ baseAmount }),
      }
    ),
};

// ------------------------------------------------------------------
// System Logs
// ------------------------------------------------------------------
export const logsApi = {
  list: (params: {
    organizationId: string;
    page?: number;
    pageSize?: number;
    action?: string;
    severity?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set("organizationId", params.organizationId);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.action) qs.set("action", params.action);
    if (params.severity) qs.set("severity", params.severity);
    if (params.entityType) qs.set("entityType", params.entityType);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);

    return fetchApi<{
      logs: unknown[];
      total: number;
    }>(`/logs?${qs.toString()}`);
  },

  getErrorCount: (
    organizationId: string,
    period: "day" | "week" | "month"
  ) =>
    fetchApi<{ count: number; period: string }>(
      `/logs/errors?organizationId=${organizationId}&period=${period}`,
      {
        method: "GET",
      }
    ),

  getStats: (organizationId: string) =>
    fetchApi<Array<{ action: string; count: number }>>(
      `/logs/stats?organizationId=${organizationId}`,
      {}
    ),
};
