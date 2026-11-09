import type { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_helpers/proxyRequest";
import { ENDPOINTS } from "@/api/endpoints";

export async function POST(req: NextRequest) {
    return proxyRequest(req, { endpoint: ENDPOINTS.ADMIN.RECORDS });
}
