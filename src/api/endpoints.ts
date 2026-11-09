export const ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        ME: "/auth/me",
        CHANGE_PASSWORD: "/auth/change-password",
    },
    ADMIN: {
        INCIDENTS: "/admin/incidents",
        CONTACTS: "/admin/contacts",
        USERS: "/admin/users",
        USER_LEVELS: "/admin/users/levels",
        TIMESHEETS: "/admin/timesheets",
        BULLETINS: "/admin/bulletins",
        HR: "/admin/hr",
        EQUIPMENT: "/admin/equipment-register",
        VEHICLE_REGISTER: "/admin/vehicle-register",
        PLANT_REGISTER: "/admin/plant-register",
        VEHICLE_CHECKS: "/admin/vehicle-checks",
        VEHICLE_INSPECTIONS: "/admin/vehicle-inspections",
        SITE_INSPECTIONS: "/admin/site-inspections",
        DOCUMENTS: "/admin/documents",
        RECORDS: "/admin/records",
    },
    ACCOUNT: {
        PAGE: "/account/pages",
    },
} as const;

export const API_ROUTES = {
    AUTH: {
        LOGIN: "/api/auth/login",
        LOGOUT: "/api/auth/logout",
        REFRESH: "/api/auth/refresh",
        ME: "/api/auth/me",
    },
    ADMIN_RESOURCE: (resource: string) => `/api/admin/${resource}`,
    ACCOUNT_PAGE: (slug: string) => `/api/account/pages/${slug}`,
} as const;
