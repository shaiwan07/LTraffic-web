"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical } from "react-icons/fi";

export type AdminTableAction =
    | {
        label: string;
        icon?: ReactNode;
        onClick: () => void;
        danger?: boolean;
        href?: never;
    }
    | {
        label: string;
        icon?: ReactNode;
        href: string;
        onClick?: () => void;
        danger?: boolean;
    };

export default function AdminTableActions({ label, actions }: { label: string; actions: AdminTableAction[] }) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    function closeMenu() {
        setOpen(false);
    }

    function updatePosition() {
        const trigger = triggerRef.current;
        const menu = menuRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const menuWidth = 180;
        const menuHeight = menu?.offsetHeight ?? 224;
        const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow >= menuHeight + 8
            ? rect.bottom + 6
            : Math.max(8, rect.top - menuHeight - 6);

        setPosition({ top, left });
    }

    function toggleMenu() {
        if (!open) updatePosition();
        setOpen((current) => !current);
    }

    useEffect(() => {
        if (!open) return;

        updatePosition();
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) closeMenu();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMenu();
        };
        const handleReposition = () => updatePosition();

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="admin-table-actions-trigger"
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={toggleMenu}
            >
                <FiMoreVertical aria-hidden="true" />
            </button>

            {open && typeof document !== "undefined" ? createPortal(
                <div
                    ref={menuRef}
                    className="admin-table-actions-dropdown"
                    role="menu"
                    style={{ position: "fixed", top: position.top, left: position.left }}
                >
                    {actions.map((action) => {
                        const className = action.danger ? "admin-table-action-delete" : undefined;
                        const content = <>{action.icon}{action.label}</>;

                        if ("href" in action && action.href) {
                            return (
                                <Link
                                    key={action.label}
                                    className={className}
                                    href={action.href}
                                    role="menuitem"
                                    onClick={() => {
                                        action.onClick?.();
                                        closeMenu();
                                    }}
                                >{content}</Link>
                            );
                        }

                        return (
                            <button
                                key={action.label}
                                type="button"
                                className={className}
                                role="menuitem"
                                onClick={() => {
                                    action.onClick?.();
                                    closeMenu();
                                }}
                            >{content}</button>
                        );
                    })}
                </div>,
                document.body
            ) : null}
        </>
    );
}
