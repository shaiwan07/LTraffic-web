import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, upstreamApi } from "../../_helpers/upstream";

export const runtime = "nodejs";

export async function GET() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("ltraffic_access_token")?.value;
    if (!accessToken) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });

    try {
        const response = await upstreamApi.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(response.data ?? { success: false }, { status: response.status });
    } catch {
        return NextResponse.json({ success: false, error: { message: "Unable to connect to the API server" } }, { status: 502 });
    }
}
