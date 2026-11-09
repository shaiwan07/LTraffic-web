import api from "@/api/client";
import { API_ROUTES } from "@/api/endpoints";
import type { AdminRecord, ListAdminRecordsParams } from "./types";

export async function fetchAdminRecords(params: ListAdminRecordsParams): Promise<AdminRecord[]> {
    const { data } = await api.post(API_ROUTES.ADMIN_RESOURCE(params.workspace), params);
    return Array.isArray(data?.data) ? data.data : Array.isArray(data?.results) ? data.results : [];
}

export async function listAdminResource(resource: string, params?: Record<string, unknown>) {
    const { data } = await api.get(API_ROUTES.ADMIN_RESOURCE(resource), { params });
    return data;
}

export async function getAdminResource(resource: string, id: string | number) {
    const { data } = await api.get(API_ROUTES.ADMIN_RESOURCE(`${resource}/${encodeURIComponent(String(id))}`));
    return data?.data ?? data;
}

export async function createAdminResource(resource: string, payload: Record<string, unknown>) {
    const { data } = await api.post(API_ROUTES.ADMIN_RESOURCE(resource), payload);
    return data?.data ?? data;
}

export async function updateAdminResource(resource: string, id: string | number, payload: Record<string, unknown>) {
    const { data } = await api.put(API_ROUTES.ADMIN_RESOURCE(`${resource}/${encodeURIComponent(String(id))}`), payload);
    return data?.data ?? data;
}

export async function deleteAdminResource(resource: string, id: string | number) {
    const { data } = await api.delete(API_ROUTES.ADMIN_RESOURCE(`${resource}/${encodeURIComponent(String(id))}`));
    return data;
}
