import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
    title: "Login | LTraffic",
    description: "Sign in to the LTraffic Limited employee area.",
};

export default function LoginPage() {
    return (
        <main className="login-page">

            <section className="login-section">
                <div className="login-card">
                    <span className="eyebrow">Employee area</span>
                    <h2>Login to your account</h2>
                    <p className="login-description">Enter your details to log in.</p>
                    <LoginForm />
                    <p className="login-demo-note">Demo portal: any non-empty username and password will continue.</p>

                    <Link className="login-home-link" href="/">
                        Back to LTraffic <FiArrowUpRight aria-hidden="true" />
                    </Link>
                </div>
            </section>
        </main>
    );
}
