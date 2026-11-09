import axios from "axios";
import https from "node:https";

export const API_BASE_URL = process.env.API_BASE_URL || "https://api.ltraffic.co.uk/api/v1";
const isVercelApiCertificateFallback = process.env.VERCEL === "1"
    && API_BASE_URL.startsWith("https://api.ltraffic.co.uk/");
const rejectUnauthorized = process.env.API_TLS_REJECT_UNAUTHORIZED === "true"
    ? true
    : process.env.API_TLS_REJECT_UNAUTHORIZED === "false"
        ? false
        : !isVercelApiCertificateFallback;

if (isVercelApiCertificateFallback && process.env.API_TLS_REJECT_UNAUTHORIZED !== "true") {
    console.warn("API TLS certificate verification is temporarily disabled for api.ltraffic.co.uk on Vercel.");
}

export const upstreamApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    httpsAgent: new https.Agent({ rejectUnauthorized }),
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
});
