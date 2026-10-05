"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Collapse, Nav, Navbar, NavbarToggler, NavItem } from "reactstrap";
import { FiArrowUpRight, FiChevronDown, FiPhone } from "react-icons/fi";
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

    const menuItems = [
        { label: "Home", href: "/" },
        {
            label: "Company",
            href: "/about",
            dropdown: [
                { label: "About Us", href: "/about" },
                { label: "Our People", href: "/team" },
            ],
        },
        {
            label: "Projects",
            href: "/services",
            dropdown: [
                { label: "Current Projects", href: "/services" },
                { label: "Completed Projects", href: "/services" },
            ],
        },
        {
            label: "Services",
            href: "/services",
            dropdown: [
                { label: "Services we provide", href: "/services" },
                { label: "Request a quote", href: "/contact" },
            ],
        },
        {
            label: "News",
            href: "/news",
            dropdown: [
                { label: "Latest News", href: "/news" },
                { label: "Social Media", href: "/news" },
            ],
        },
        { label: "Contact", href: "/contact" },
    ];

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
                            {menuItems.map((item) => (
                                item.dropdown ? (
                                    <NavItem key={item.label} className="has-dropdown">
                                        <Link className="nav-link" href={item.href || "#"}>
                                            <span>{item.label}</span>
                                            <FiChevronDown />
                                        </Link>
                                        <div className="dropdown-menu" aria-label={`${item.label} submenu`}>
                                            {item.dropdown.map((child) => (
                                                <Link key={child.label} href={child.href} className="dropdown-link">
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </NavItem>
                                ) : (
                                    <NavItem key={item.label}>
                                        <Link className="nav-link" href={item.href}>{item.label}</Link>
                                    </NavItem>
                                )
                            ))}
                        </Nav>

                        <div className="site-nav-actions">
                            <Link href="/login" className="nav-login">Login</Link>
                            <Link href="/contact" className="nav-cta">Start a conversation <FiArrowUpRight /></Link>
                        </div>
                    </Collapse>
                </div>
            </Navbar>
        </header>
    );
}
