import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, upstreamApi } from "../../_helpers/upstream";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("ltraffic_refresh_token")?.value;

    let data: unknown = { success: true, data: { revoked: false } };
    if (refreshToken) {
        try {
            const response = await upstreamApi.post(`${API_BASE_URL}/auth/logout`, { refreshToken });
            data = response.data ?? data;
        } catch {
            data = { success: false, error: { message: "Unable to connect to the API server" } };
        }
    }

    cookieStore.delete("ltraffic_access_token");
    cookieStore.delete("ltraffic_refresh_token");
    cookieStore.delete("ltraffic_user_type");
    cookieStore.delete("ltraffic-demo-session");

    return NextResponse.json(data);
}
