"use client";

import "@/assets/scss/index.scss";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiBriefcase, FiChevronRight, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { superAdminNavigation } from "./super-admin/admin-menu";
import { employeesNavigation } from "./employees/admin-menu";
import { AdminRoleContext, normalizeAdminRole, type AdminRole } from "./admin-role";

function isNavigationItemActive(pathname: string, href: string) {
    return href === "/admin/employees" ? pathname === href : pathname.startsWith(href);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<AdminRole>("super-admin");
    const isEmployeesArea = pathname.startsWith("/admin/employees") || role === "employees";
    const navigation = role === "employees" ? employeesNavigation : superAdminNavigation;
    const activePage = navigation.find((item) => isNavigationItemActive(pathname, item.href));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [storageError, setStorageError] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userName, setUserName] = useState("User");
    const [displayRole, setDisplayRole] = useState("Account");
    const signOutStarted = useRef(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const cachedName = localStorage.getItem("ltraffic-user-name") || sessionStorage.getItem("ltraffic-user-name");
                const cachedRole = localStorage.getItem("ltraffic-user-role") || sessionStorage.getItem("ltraffic-user-role");
                if (cachedName) setUserName(cachedName);
                if (cachedRole) setDisplayRole(cachedRole.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));

                const response = await fetch("/api/auth/me", { cache: "no-store" });
                if (!response.ok) {
                    router.replace("/login");
                    return;
                }
                const data = await response.json();
                const profile = data?.data?.user ?? data?.data ?? {};
                const roleValue = [
                    profile.userType,
                    profile.role,
                    ...(Array.isArray(profile.roles) ? profile.roles : []),
                ].filter(Boolean);
                setRole(normalizeAdminRole(roleValue));
                const resolvedName = String(profile.name || profile.fullName || profile.username || "User");
                const resolvedRole = String(
                    profile.userType ||
                    profile.role ||
                    (Array.isArray(profile.roles) ? profile.roles[0] : "") ||
                    "Account"
                );
                setUserName(resolvedName);
                setDisplayRole(resolvedRole.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
                setIsAuthenticated(true);
            } catch {
                setStorageError(true);
            } finally {
                setIsChecking(false);
            }
        };
        void checkSession();
    }, [router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (role === "employees" && pathname.startsWith("/admin/super-admin")) {
            router.replace("/admin/employees");
        }
        if (role === "super-admin" && pathname.startsWith("/admin/employees")) {
            router.replace("/admin/super-admin");
        }
    }, [isAuthenticated, pathname, role, router]);

    const handleSignOut = useCallback(async () => {
        if (signOutStarted.current) return;
        signOutStarted.current = true;
        try {
            await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        } catch {
            // Session cookies are also cleared by the logout route where possible.
        }
        localStorage.removeItem("ltraffic-demo-session");
        sessionStorage.removeItem("ltraffic-demo-session");
        localStorage.removeItem("ltraffic-user-type");
        sessionStorage.removeItem("ltraffic-user-type");
        localStorage.removeItem("ltraffic-user-name");
        sessionStorage.removeItem("ltraffic-user-name");
        localStorage.removeItem("ltraffic-user-role");
        sessionStorage.removeItem("ltraffic-user-role");
        router.replace("/login");
        router.refresh();
    }, [router]);

    useEffect(() => {
        const handleUnauthorized = () => { void handleSignOut(); };
        window.addEventListener("ltraffic:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("ltraffic:unauthorized", handleUnauthorized);
    }, [handleSignOut]);

    if (isChecking) {
        return <main className="admin-loading" aria-live="polite">Loading admin panel…</main>;
    }

    if (storageError) {
        return (
            <main className="admin-loading" role="alert">
                Browser storage is unavailable. Enable it to use the demo admin panel.
            </main>
        );
    }

    if (!isAuthenticated) {
        return <main className="admin-loading" aria-live="polite">Redirecting to sign in…</main>;
    }

    return (
        <div className="admin-shell">
            {isSidebarOpen && (
                <button
                    type="button"
                    className="admin-sidebar-backdrop"
                    aria-label="Close navigation menu"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`admin-sidebar${isSidebarOpen ? " is-open" : ""}`}>
                <Link className="admin-brand" href="/admin" onClick={() => setIsSidebarOpen(false)}>
                    <span className="admin-brand-mark"><FiBriefcase aria-hidden="true" /></span>
                    <span><strong>LTraffic</strong><small>{displayRole}</small></span>
                </Link>

                <div className="admin-nav-label">Workspace modules</div>
                <nav className="admin-navigation" aria-label="Admin navigation">
                    {navigation.map(({ label, href, icon: Icon }) => {
                        const isActive = isNavigationItemActive(pathname, href);

                        return (
                            <Link
                                key={href}
                                className={`admin-nav-link${isActive ? " is-active" : ""}`}
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <Icon aria-hidden="true" />
                                <span className="admin-nav-copy">{label}</span>
                                <FiChevronRight className="admin-nav-chevron" aria-hidden="true" />
                            </Link>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-footer">
                    <span className="admin-avatar">{userName.trim().charAt(0).toUpperCase()}</span>
                    <span className="admin-user-copy"><strong>{userName}</strong><small>{displayRole}</small></span>
                    <button className="admin-signout-icon" type="button" onClick={handleSignOut} aria-label="Sign out">
                        <FiLogOut aria-hidden="true" />
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <button
                        type="button"
                        className="admin-menu-toggle"
                        aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={isSidebarOpen}
                        onClick={() => setIsSidebarOpen((open) => !open)}
                    >
                        {isSidebarOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
                    </button>
                    <div className="admin-topbar-heading">
                        <div className="admin-breadcrumb">
                            <span>LTraffic</span><FiChevronRight aria-hidden="true" />
                            <strong>{activePage?.label ?? (isEmployeesArea ? "Employees Area" : "Admin Area")}</strong>
                        </div>
                    </div>
                    <button className="admin-signout" type="button" onClick={handleSignOut}>
                        <FiLogOut aria-hidden="true" /><span>Sign out</span>
                    </button>
                </header>
                <AdminRoleContext.Provider value={role}>
                    <main className="admin-content">{children}</main>
                </AdminRoleContext.Provider>
            </div>
        </div>
    );
}
