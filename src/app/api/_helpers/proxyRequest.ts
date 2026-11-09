import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upstreamApi } from "./upstream";

export async function proxyRequest(req: NextRequest, options: { endpoint: string; timeout?: number }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_id")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json({ error: "API_BASE_URL is not configured" }, { status: 500 });
    }

    try {
        const body = req.method === "GET" ? undefined : await req.json().catch(() => undefined);
        const response = await upstreamApi.request({
            url: `${baseUrl}${options.endpoint}`,
            method: req.method,
            headers: { "Content-Type": "application/json", Token: token },
            data: body,
            timeout: options.timeout ?? 30000,
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
        const timedOut = error instanceof Error && error.name === "AxiosError";
        return NextResponse.json(
            { error: timedOut ? "Request timed out" : "Failed to connect to API server" },
            { status: timedOut ? 504 : 502 }
        );
    }
}
