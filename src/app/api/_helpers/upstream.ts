import axios from "axios";
import https from "node:https";

const rejectUnauthorized = process.env.API_TLS_REJECT_UNAUTHORIZED !== "false";

export const API_BASE_URL = process.env.API_BASE_URL || "https://api.ltraffic.co.uk/api/v1";

export const upstreamApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    httpsAgent: new https.Agent({ rejectUnauthorized }),
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
});
