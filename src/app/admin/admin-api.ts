type ApiErrorEnvelope = {
    success?: unknown;
    error?: { message?: unknown };
} | null;

export async function fetchAdminApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);
    const payload = await response.clone().json().catch(() => null) as ApiErrorEnvelope;

    if (payload?.success === false && payload.error?.message === "Unauthorized" && typeof window !== "undefined") {
        window.dispatchEvent(new Event("ltraffic:unauthorized"));
    }

    return response;
}