import { FiArrowUpRight } from "react-icons/fi";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { services } from "@/constants/services";

export default function ServicesPage() {
    return <main><section className="page-hero page-hero--dark"><div className="container-fluid px-4 px-xxl-5"><span className="eyebrow eyebrow--light">Our capabilities</span><h1>Specialist teams for the work that keeps the country moving.</h1><p>From utilities and civils to traffic signals and fibre networks, we bring dependable delivery to every project.</p></div></section><section className="section-space"><div className="container-fluid px-4 px-xxl-5"><SectionHeading eyebrow="Six areas of expertise" title="The right people for the job." /><div className="services-list mt-5">{services.map((service, index) => <Link href={`/services/${service.slug}`} className="service-list-item" key={service.slug}><span>0{index + 1}</span><h2>{service.title}</h2><p>{service.description}</p><FiArrowUpRight /></Link>)}</div></div></section></main>;
}
