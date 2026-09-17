"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Collapse, Nav, Navbar, NavbarToggler, NavItem } from "reactstrap";
import { FiArrowUpRight, FiPhone } from "react-icons/fi";
import logo from "@/assets/images/logo.png";

export function SiteHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 18);

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
            <div className="header-strip">
                <div className="container-fluid px-4 px-xxl-5 header-strip-inner">
                    <span>Nationwide delivery · 24/7 response</span>
                    <a href="tel:08002229871"><FiPhone /> 0800 222 9871</a>
                </div>
            </div>

            <Navbar expand="lg" container="xxl" className="site-nav">
                <div className="site-nav-inner">
                    <Link href="/" className="brand-mark" aria-label="LTraffic home">
                        <Image src={logo} alt="LTraffic - Innovating the future" className="site-logo" priority />
                    </Link>

                    <NavbarToggler onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation">
                        <span className="menu-icon" />
                    </NavbarToggler>

                    <Collapse isOpen={isOpen} navbar className="site-collapse">
                        <Nav navbar className="site-nav-links">
                            <NavItem><Link className="nav-link" href="/">Home</Link></NavItem>
                            <NavItem><Link className="nav-link" href="/about">About</Link></NavItem>
                            <NavItem><Link className="nav-link" href="/services">Services</Link></NavItem>
                            <NavItem><Link className="nav-link" href="/team">Our people</Link></NavItem>
                            <NavItem><Link className="nav-link" href="/news">News</Link></NavItem>
                        </Nav>

                        <div className="site-nav-actions">
                            <Link className="nav-login" href="/contact">Login</Link>
                            <Link className="nav-cta" href="/contact"><FiArrowUpRight /> Start a conversation</Link>
                        </div>
                    </Collapse>
                </div>
            </Navbar>
        </header>
    );
}
