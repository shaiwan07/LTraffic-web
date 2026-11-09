import { createContext } from "react";

export type AdminRole = "super-admin" | "employees";

export const AdminRoleContext = createContext<AdminRole>("super-admin");

export const ADMIN_ROLE_STORAGE_KEY = "ltraffic-user-type";

export function normalizeAdminRole(value: unknown): AdminRole {
    const raw = Array.isArray(value)
        ? value.join(" ")
        : String(value ?? "");
    const normalized = raw.toLowerCase().replace(/[_\s]+/g, "-");

    if (normalized.includes("admin") || normalized.includes("super-admin")) return "super-admin";
    if (normalized.includes("employee") || normalized.includes("staff") || normalized.includes("user")) return "employees";
    return "super-admin";
}

export function getStoredAdminRole(): AdminRole {
    if (typeof window === "undefined") return "super-admin";
    return normalizeAdminRole(localStorage.getItem(ADMIN_ROLE_STORAGE_KEY));
}

export function setStoredAdminRole(role: AdminRole, remember: boolean) {
    if (remember) {
        localStorage.setItem(ADMIN_ROLE_STORAGE_KEY, role);
        sessionStorage.removeItem(ADMIN_ROLE_STORAGE_KEY);
    } else {
        sessionStorage.setItem(ADMIN_ROLE_STORAGE_KEY, role);
        localStorage.removeItem(ADMIN_ROLE_STORAGE_KEY);
    }
}
