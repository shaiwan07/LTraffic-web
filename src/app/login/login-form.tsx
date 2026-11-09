"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FiArrowUpRight, FiLock, FiMail } from "react-icons/fi";
import { normalizeAdminRole, setStoredAdminRole } from "@/app/admin/admin-role";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

export function LoginForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string; remember?: boolean }>({ mode: "onBlur" });

    async function submit(values: { email: string; password: string; remember?: boolean }) {
        setServerError("");
        setLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: values.email.trim(),
                    password: values.password,
                    deviceId: typeof crypto !== "undefined" ? crypto.randomUUID?.() ?? "web-browser" : "web-browser",
                    platform: "android",
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success || !data?.data?.user) {
                const message = data?.error?.message || "Invalid email or password.";
                setServerError(message);
                toast.error(message);
                return;
            }

            const roleValue = [
                data.data.user.userType,
                data.data.user.role,
                ...(Array.isArray(data.data.user.roles) ? data.data.user.roles : []),
            ].filter(Boolean);
            const role = normalizeAdminRole(roleValue);
            setStoredAdminRole(role, Boolean(values.remember));
            if (values.remember) {
                localStorage.setItem("ltraffic-demo-session", "active");
            } else {
                sessionStorage.setItem("ltraffic-demo-session", "active");
            }
            const resolvedRole = String(
                data.data.user.userType ||
                data.data.user.role ||
                (Array.isArray(data.data.user.roles) ? data.data.user.roles[0] : "") ||
                "Account"
            );
            const resolvedName = String(data.data.user.name || data.data.user.fullName || data.data.user.username || "User");
            const profileStorage = Boolean(values.remember) ? localStorage : sessionStorage;
            profileStorage.setItem("ltraffic-user-name", resolvedName);
            profileStorage.setItem("ltraffic-user-role", resolvedRole);
            toast.success(`Welcome back, ${resolvedName}`);
            setRedirecting(true);
            window.setTimeout(() => {
                router.replace(role === "employees" ? "/admin/employees" : "/admin/super-admin");
                router.refresh();
            }, 450);
        } catch {
            setServerError("Unable to connect to the login service. Please try again.");
            toast.error("Unable to connect to the login service. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit(submit)} noValidate>
            <label htmlFor="email">Email address</label>
            <div className="login-input-wrap">
                <FiMail aria-hidden="true" />
                <input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email", {
                    required: "Email address is required.",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." },
                })} />
            </div>
            {errors.email && <p className="login-error">{errors.email.message}</p>}

            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
                <FiLock aria-hidden="true" />
                <input id="password" type="password" autoComplete="current-password" placeholder="Your password" {...register("password", {
                    required: "Password is required.",
                    minLength: { value: 1, message: "Password is required." },
                })} />
            </div>
            {errors.password && <p className="login-error">{errors.password.message}</p>}

            <div className="login-form-footer">
                <label className="remember-option">
                    <input type="checkbox" {...register("remember")} />
                    <span>Stay signed in</span>
                </label>
                <button className="button button--dark" type="submit" disabled={loading}>
                    {loading ? "Signing in…" : <>Sign in <FiArrowUpRight aria-hidden="true" /></>}
                </button>
            </div>
            {serverError && <p className="login-error" role="alert">{serverError}</p>}
        </form>
    );
}
