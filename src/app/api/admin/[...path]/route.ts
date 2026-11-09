import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, upstreamApi } from "../../_helpers/upstream";

export const runtime = "nodejs";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("ltraffic_access_token")?.value;

    const forward = async (token?: string) => {
        const url = new URL(request.url);
        const upstream = `${API_BASE_URL}/admin/${path.join("/")}${url.search}`;
        const contentType = request.headers.get("content-type") || "";
        const body = request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer();

        return upstreamApi.request({
            url: upstream,
            method: request.method,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(contentType ? { "Content-Type": contentType } : {}),
            },
            data: body ? Buffer.from(body) : undefined,
            responseType: "arraybuffer",
        });
    };

    try {
        let response = await forward(accessToken);
        if (response.status === 401) {
            const refreshToken = cookieStore.get("ltraffic_refresh_token")?.value;
            if (refreshToken) {
                const refreshResponse = await upstreamApi.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { responseType: "json" });
                const refreshData = refreshResponse.data;
                if (refreshResponse.status >= 200 && refreshResponse.status < 300 && refreshData?.success) {
                    accessToken = refreshData.data.accessToken;
                    if (accessToken) {
                        cookieStore.set("ltraffic_access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60 });
                        cookieStore.set("ltraffic_refresh_token", refreshData.data.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 24 * 60 * 60 });
                        response = await forward(accessToken);
                    }
                }
            }
        }

        const contentType = String(response.headers["content-type"] || "application/json");
        const isBinary = contentType.includes("application/pdf") || contentType.startsWith("image/") || contentType.includes("octet-stream") || contentType.includes("spreadsheet") || contentType.includes("zip");
        if (isBinary) {
            return new NextResponse(Buffer.from(response.data), { status: response.status, headers: { "Content-Type": contentType, "Content-Disposition": String(response.headers["content-disposition"] || "inline") } });
        }

        const text = Buffer.from(response.data).toString("utf8");
        let data: unknown;
        try { data = text ? JSON.parse(text) : null; } catch { data = { success: false, error: { message: "API response could not be parsed" } }; }
        return NextResponse.json(data ?? { success: false, error: { message: "API response could not be parsed" } }, { status: response.status });
    } catch {
        return NextResponse.json({ success: false, error: { message: "Unable to connect to the API server" } }, { status: 502 });
    }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
