"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FiArrowUpRight, FiLock, FiMail } from "react-icons/fi";

export function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const formData = new FormData(event.currentTarget);
        const remember = formData.get("remember") === "on";

        try {
            if (remember) {
                localStorage.setItem("ltraffic-demo-session", "active");
                sessionStorage.removeItem("ltraffic-demo-session");
            } else {
                localStorage.removeItem("ltraffic-demo-session");
                sessionStorage.setItem("ltraffic-demo-session", "active");
            }

            router.push("/admin/employeesarea");
        } catch {
            setError("Your browser could not save this demo session. Please enable browser storage and try again.");
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <div className="login-input-wrap">
                <FiMail aria-hidden="true" />
                <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Your username"
                    required
                />
            </div>

            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
                <FiLock aria-hidden="true" />
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                />
            </div>

            <div className="login-form-footer">
                <label className="remember-option">
                    <input type="checkbox" name="remember" />
                    <span>Stay signed in</span>
                </label>
                <button className="button button--dark" type="submit">
                    Sign in <FiArrowUpRight aria-hidden="true" />
                </button>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
        </form>
    );
}
