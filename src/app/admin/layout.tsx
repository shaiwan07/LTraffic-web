"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    FiBriefcase,
    FiChevronRight,
    FiGrid,
    FiLogOut,
    FiMenu,
    FiX,
} from "react-icons/fi";
import { adminNavigation } from "./admin-menu";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isEmployeesArea = pathname.startsWith("/admin/employeesarea");
    const activePage = adminNavigation.find((item) => pathname.startsWith(item.href));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [storageError, setStorageError] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkSession = () => {
            try {
                const hasSession =
                    localStorage.getItem("ltraffic-demo-session") === "active" ||
                    sessionStorage.getItem("ltraffic-demo-session") === "active";

                if (hasSession) {
                    setIsAuthenticated(true);
                } else {
                    router.replace("/login");
                }
            } catch {
                setStorageError(true);
            } finally {
                setIsChecking(false);
            }
        };
        const timeoutId = window.setTimeout(checkSession, 0);

        return () => window.clearTimeout(timeoutId);
    }, [router]);

    function handleSignOut() {
        try {
            localStorage.removeItem("ltraffic-demo-session");
            sessionStorage.removeItem("ltraffic-demo-session");
            router.replace("/login");
        } catch {
            setStorageError(true);
        }
    }

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
                    <span><strong>LTraffic</strong><small>Operations workspace</small></span>
                </Link>

                <div className="admin-nav-label">Workspace modules</div>
                <nav className="admin-navigation" aria-label="Admin navigation">
                    {adminNavigation.map(({ label, href, icon: Icon }) => {
                        const isActive = pathname.startsWith(href);

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
                    <span className="admin-avatar">A</span>
                    <span className="admin-user-copy"><strong>Administrator</strong><small>Demo account</small></span>
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
                        <nav className="admin-area-switch" aria-label="Switch workspace">
                            <Link
                                className={`admin-area-option${!isEmployeesArea ? " is-current" : ""}`}
                                href="/admin"
                                aria-current={!isEmployeesArea ? "page" : undefined}
                            >
                                <FiGrid aria-hidden="true" /><span>Admin Area</span>
                            </Link>
                            <Link
                                className={`admin-area-option${isEmployeesArea ? " is-current" : ""}`}
                                href="/admin/employeesarea"
                                aria-current={isEmployeesArea ? "page" : undefined}
                            >
                                <FiBriefcase aria-hidden="true" /><span>Employees Area</span>
                            </Link>
                        </nav>
                    </div>
                    <button className="admin-signout" type="button" onClick={handleSignOut}>
                        <FiLogOut aria-hidden="true" /><span>Sign out</span>
                    </button>
                </header>
                <main className="admin-content">{children}</main>
            </div>
        </div>
    );
}
