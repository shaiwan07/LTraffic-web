import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, upstreamApi } from "../../_helpers/upstream";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
        const response = await upstreamApi.post(`${API_BASE_URL}/auth/login`, body, {
            headers: { "Content-Type": "application/json" },
        });
        const data = response.data;
        if (response.status < 200 || response.status >= 300 || !data?.success || !data?.data) {
            return NextResponse.json(data ?? { success: false, error: { message: "Login failed" } }, { status: response.status || 401 });
        }

        const cookieStore = await cookies();
        const payload = data.data;
        cookieStore.set("ltraffic_access_token", payload.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60 });
        cookieStore.set("ltraffic_refresh_token", payload.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 24 * 60 * 60 });
        cookieStore.set("ltraffic_user_type", payload.user.userType, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 60 * 24 * 60 * 60 });

        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            { success: false, error: { message: "Unable to connect to the API server" } },
            { status: 502 },
        );
    }
}
