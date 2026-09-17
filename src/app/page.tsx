"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowDownRight, FiArrowUpRight, FiCheck, FiMapPin } from "react-icons/fi";
import { FaHelmetSafety, FaRoad } from "react-icons/fa6";
import { GiTrafficLightsGreen } from "react-icons/gi";
import { MdElectricalServices, MdTraffic } from "react-icons/md";
import { TbAntennaBars5 } from "react-icons/tb";
import { SectionHeading } from "@/components/section-heading";
import { services } from "@/constants/services";
import heroRoad from "@/assets/images/hero-road.jpg";
import trafficSignals from "@/assets/images/traffic-signals.jpg";
import construction from "@/assets/images/construction.jpg";
import servicesCenter from "@/assets/images/services-center.jpg";

const serviceIcons = [MdElectricalServices, FaHelmetSafety, TbAntennaBars5, GiTrafficLightsGreen, MdTraffic, FaRoad];

export default function Home() {
    useEffect(() => {
        const elements = document.querySelectorAll("[data-reveal]");

        if (!elements.length) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.16 }
        );

        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    return (
        <main className="home-page">
            <section className="hero-section">
                <Image src={heroRoad} alt="LTraffic team delivering infrastructure works" fill priority className="hero-image" sizes="100vw" />
                <div className="hero-overlay" />
                <div className="container-fluid px-4 px-xxl-5 hero-content">
                    <div className="row hero-layout">
                        <div className="col-xl-7" data-reveal>
                            <span className="eyebrow eyebrow--light hero-eyebrow">Infrastructure in motion</span>
                            <h1>Building the connections that keep Britain moving.</h1>
                            <p className="hero-copy">Civil engineering, utilities and traffic infrastructure delivered with clarity, care and a nationwide reach.</p>
                            <div className="hero-actions">
                                <Link className="button button--accent" href="/services">Explore our capabilities <FiArrowUpRight /></Link>
                                <Link className="text-link text-link--light" href="/about">Why LTraffic <FiArrowDownRight /></Link>
                            </div>
                            <div className="hero-badges">
                                <span>Utilities</span>
                                <span>Traffic signals</span>
                                <span>Construction</span>
                            </div>
                        </div>
                        <div className="col-xl-5" data-reveal>
                            <div className="hero-surface">
                                <div className="hero-surface-header">
                                    <span className="eyebrow eyebrow--light">Trusted delivery</span>
                                    <span className="hero-pill">24/7 support</span>
                                </div>
                                <div className="hero-surface-body">
                                    <div className="mini-stat">
                                        <strong>20+</strong>
                                        <span>Years of hands-on experience</span>
                                    </div>
                                    <div className="mini-stat">
                                        <strong>UK-wide</strong>
                                        <span>Projects delivered across the country</span>
                                    </div>
                                    <div className="hero-surface-list">
                                        <div><FiCheck /> Safety-led delivery</div>
                                        <div><FiCheck /> Responsive coordination</div>
                                        <div><FiCheck /> Clear communication from start to finish</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hero-foot row align-items-end g-4">
                        <div className="col-md-7">
                            <span className="hero-location"><FiMapPin /> Working UK-wide, from city streets to national networks</span>
                        </div>
                        <div className="col-md-5 text-md-end">
                            <span className="hero-scroll">Scroll to explore <FiArrowDownRight /></span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="intro-section section-space">
                <div className="container-fluid px-4 px-xxl-5">
                    <div className="row g-5 align-items-end" data-reveal>
                        <div className="col-lg-7">
                            <SectionHeading eyebrow="The LTraffic difference" title="Practical expertise for infrastructure that matters." />
                        </div>
                        <div className="col-lg-4 offset-lg-1">
                            <p className="large-copy">We are a specialist infrastructure partner for the places people live, work and travel through. Our teams bring big-project capability with a hands-on, human approach.</p>
                            <Link className="text-link" href="/about">Meet LTraffic <FiArrowUpRight /></Link>
                        </div>
                    </div>
                    <div className="stats-row row g-0 mt-5" data-reveal>
                        <div className="col-6 col-lg-3 stat-item"><strong>20<span>+</span></strong><span>Years of industry experience</span></div>
                        <div className="col-6 col-lg-3 stat-item"><strong>24<span>/</span>7</strong><span>Teams ready to respond</span></div>
                        <div className="col-6 col-lg-3 stat-item"><strong>UK<span>-</span>wide</strong><span>Delivery across the country</span></div>
                        <div className="col-6 col-lg-3 stat-item"><strong>1<span>—</span>1</strong><span>Clear point of contact</span></div>
                    </div>
                </div>
            </section>

            <section className="services-section section-space section-dark">
                <div className="container-fluid px-4 px-xxl-5">
                    <div className="row align-items-end g-4 mb-5" data-reveal>
                        <div className="col-lg-7">
                            <SectionHeading light eyebrow="What we do" title="One team. Six ways to move a project forward." copy="From the first conversation to the final handover, our specialists work around your priorities." />
                        </div>
                        <div className="col-lg-5 text-lg-end">
                            <Link className="text-link text-link--light" href="/services">View all services <FiArrowUpRight /></Link>
                        </div>
                    </div>
                    <div className="services-grid" data-reveal>
                        {services.map((service, index) => { const Icon = serviceIcons[index]; return <Link className="service-tile" href={`/services/${service.slug}`} key={service.slug}><span className="service-index">0{index + 1}</span><Icon className="service-icon" /><h3>{service.title}</h3><p>{service.description}</p><span className="tile-arrow"><FiArrowUpRight /></span></Link>; })}
                    </div>
                </div>
            </section>

            <section className="split-section section-space">
                <div className="container-fluid px-4 px-xxl-5">
                    <div className="row g-0 align-items-stretch split-panel" data-reveal>
                        <div className="col-lg-6 image-panel">
                            <Image src={trafficSignals} alt="Traffic signals on a city street" fill className="cover-image" sizes="(max-width: 991px) 100vw, 50vw" />
                        </div>
                        <div className="col-lg-6 copy-panel">
                            <span className="eyebrow">Built for the real world</span>
                            <h2>Good infrastructure is felt, not just seen.</h2>
                            <p>Our work sits at the intersection of safety, reliability and everyday life. That is why we plan carefully, communicate early and take pride in the details others might miss.</p>
                            <ul className="check-list">
                                <li><FiCheck /> Safety-led delivery</li>
                                <li><FiCheck /> Skilled, accountable teams</li>
                                <li><FiCheck /> Less disruption, better outcomes</li>
                            </ul>
                            <Link className="button button--dark" href="/about">How we work <FiArrowUpRight /></Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="journey-section section-space">
                <div className="container-fluid px-4 px-xxl-5">
                    <div className="row align-items-end g-4 mb-5" data-reveal>
                        <div className="col-lg-7">
                            <SectionHeading eyebrow="How we work" title="A clear route from first conversation to final handover." copy="Every project benefits from a simple, structured approach that keeps teams aligned and clients informed." />
                        </div>
                        <div className="col-lg-5 text-lg-end">
                            <Link className="text-link" href="/contact">Start a project conversation <FiArrowUpRight /></Link>
                        </div>
                    </div>
                    <div className="journey-grid" data-reveal>
                        <article className="journey-card">
                            <span className="journey-step">01</span>
                            <h3>Plan clearly</h3>
                            <p>We map every risk, route and stakeholder before the first dig begins.</p>
                        </article>
                        <article className="journey-card">
                            <span className="journey-step">02</span>
                            <h3>Deliver confidently</h3>
                            <p>Our teams bring the right specialists, tools and discipline to keep work on track.</p>
                        </article>
                        <article className="journey-card">
                            <span className="journey-step">03</span>
                            <h3>Support always</h3>
                            <p>Responsive service, honest communication and a hands-on approach after completion.</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="feature-section section-space">
                <div className="container-fluid px-4 px-xxl-5">
                    <div className="row g-5 align-items-center" data-reveal>
                        <div className="col-lg-5">
                            <SectionHeading eyebrow="A partner, not a hand-off" title="From plan to pavement, we stay close to the work." copy="The strongest projects are built on trust. We bring responsive people, straightforward advice and the confidence to solve problems as they come." />
                            <Link className="text-link" href="/contact">Start a project conversation <FiArrowUpRight /></Link>
                        </div>
                        <div className="col-lg-7">
                            <div className="feature-image">
                                <Image src={construction} alt="Construction crew working on infrastructure" fill className="cover-image" sizes="(max-width: 991px) 100vw, 58vw" />
                                <span className="image-note">01 <span>Delivery that holds up</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="quote-section">
                <div className="container-fluid px-4 px-xxl-5">
                    <div className="row align-items-center g-5" data-reveal>
                        <div className="col-lg-4">
                            <Image src={servicesCenter} alt="LTraffic service team" width={600} height={600} className="quote-image" />
                        </div>
                        <div className="col-lg-7 offset-lg-1">
                            <span className="quote-mark">“</span>
                            <blockquote>We have worked with LTraffic for 9+ years and are always impressed by the level of service provided. A great company to work with.</blockquote>
                            <div className="quote-person">
                                <strong>Shilpa Vekaria</strong>
                                <span>TSM Contract Support Manager, Telent Technology Services</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
