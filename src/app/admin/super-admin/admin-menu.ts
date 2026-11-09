import { adminNavigation } from "../admin-menu";

export const superAdminNavigation = adminNavigation.map((item) => ({
    ...item,
    href: `/admin/super-admin${item.href.replace("/admin", "")}`,
}));

export const superAdminModules = superAdminNavigation;
