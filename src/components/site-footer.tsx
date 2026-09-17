import { FiArrowUpRight, FiLinkedin, FiPhone, FiTwitter } from "react-icons/fi";
import { FaFacebookF } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/images/logo.png";

export function SiteFooter() {
    return (
        <footer className="site-footer">
            <div className="container-fluid px-4 px-xxl-5">
                <div className="footer-cta">
                    <div className="footer-cta-copy">
                        <span className="eyebrow eyebrow--light">Let&apos;s get moving</span>
                        <h2>Have a project that needs a clear route forward?</h2>
                    </div>
                    <div className="footer-cta-actions">
                        <Link className="button button--light" href="/contact">Talk to our team <FiArrowUpRight /></Link>
                        <a className="footer-cta-phone" href="tel:08002229871"><FiPhone /> 0800 222 9871</a>
                    </div>
                </div>
                <div className="footer-grid row g-5">
                    <div className="col-lg-5">
                        <Link href="/" className="footer-brand"><Image src={logo} alt="LTraffic - Innovating the future" /></Link>
                        <p className="footer-intro">The people behind the infrastructure that keeps the UK connected, moving and ready for what comes next.</p>
                        <div className="social-links">
                            <a href="https://www.linkedin.com/company/ltraffic/posts/" aria-label="LinkedIn"><FiLinkedin /></a>
                            <a href="https://facebook.com/ltrafficltd" aria-label="Facebook"><FaFacebookF /></a>
                            <a href="https://twitter.com/ltraffic" aria-label="Twitter"><FiTwitter /></a>
                        </div>
                    </div>
                    <div className="col-6 col-lg-2">
                        <span className="footer-label">Explore</span>
                        <Link href="/about">About us</Link><Link href="/team">Our people</Link><Link href="/news">News & insight</Link><Link href="/contact">Contact</Link>
                    </div>
                    <div className="col-6 col-lg-2">
                        <span className="footer-label">Capabilities</span>
                        <Link href="/services/utilities">Utilities</Link><Link href="/services/construction">Construction</Link><Link href="/services/fibre-optics">Fibre optics</Link><Link href="/services/traffic-signals">Traffic signals</Link>
                    </div>
                    <div className="col-lg-3">
                        <span className="footer-label">Talk to us</span>
                        <a className="footer-contact" href="tel:08002229871">0800 222 9871</a>
                        <a href="mailto:hello@ltraffic.co.uk">hello@ltraffic.co.uk</a>
                        <p className="footer-hours">Available 24 hours a day,<br />365 days a year.</p>
                    </div>
                </div>
                <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between gap-2">
                    <span>© 2026 LTraffic Limited. All rights reserved.</span>
                    <span>Built for better connections.</span>
                </div>
            </div>
        </footer>
    );
}
