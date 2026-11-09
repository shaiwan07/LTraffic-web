import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, upstreamApi } from "../../_helpers/upstream";

export const runtime = "nodejs";

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("ltraffic_refresh_token")?.value;
    if (!refreshToken) return NextResponse.json({ success: false, error: { message: "No refresh token" } }, { status: 401 });

    try {
        const response = await upstreamApi.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const data = response.data;
        if (response.status < 200 || response.status >= 300 || !data?.success) return NextResponse.json(data ?? { success: false }, { status: response.status });

        cookieStore.set("ltraffic_access_token", data.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60 });
        cookieStore.set("ltraffic_refresh_token", data.data.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 24 * 60 * 60 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ success: false, error: { message: "Unable to connect to the API server" } }, { status: 502 });
    }
}
