import { notFound } from "next/navigation";
import Link from "next/link";
import { FiArrowUpRight, FiCheck } from "react-icons/fi";
import { services } from "@/constants/services";

export function generateStaticParams() { return services.map((service) => ({ slug: service.slug })); }

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const service = services.find((item) => item.slug === slug);
    if (!service) notFound();
    return <main><section className="page-hero page-hero--dark"><div className="container-fluid px-4 px-xxl-5"><span className="eyebrow eyebrow--light">Service  /  {service.shortTitle}</span><h1>{service.title} that keeps projects moving.</h1><p>{service.detail}</p></div></section><section className="section-space"><div className="container-fluid px-4 px-xxl-5"><div className="row g-5"><div className="col-lg-7"><span className="eyebrow">The detail</span><h2 className="content-title">Built around your programme, your people and your priorities.</h2><p className="large-copy">We bring experienced teams, practical planning and a calm approach to complex delivery. Whether the work is planned or responsive, we stay accountable from the first site visit to the final handover.</p><ul className="check-list check-list--dark"><li><FiCheck /> Experienced delivery teams</li><li><FiCheck /> Nationwide resource</li><li><FiCheck /> Safety-first planning</li></ul></div><div className="col-lg-4 offset-lg-1"><div className="enquiry-card"><span className="eyebrow">Let&apos;s talk</span><h3>Have a requirement in mind?</h3><p>Tell us what you are working on and we will bring the right people into the conversation.</p><Link className="button button--dark" href="/contact">Start a conversation <FiArrowUpRight /></Link></div></div></div></div></section></main>;
}
