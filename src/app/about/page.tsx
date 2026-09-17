import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight, FiCheck } from "react-icons/fi";
import { SectionHeading } from "@/components/section-heading";
import construction from "@/assets/images/construction.jpg";

export default function AboutPage() {
    return <main><section className="page-hero"><div className="container-fluid px-4 px-xxl-5"><span className="eyebrow">About LTraffic</span><h1>Infrastructure is built by people who care about the outcome.</h1><p>We combine specialist knowledge, practical delivery and a genuinely collaborative way of working.</p></div></section><section className="section-space"><div className="container-fluid px-4 px-xxl-5"><div className="row g-5 align-items-center"><div className="col-lg-6"><Image src={construction} alt="LTraffic construction team at work" className="about-image" /></div><div className="col-lg-5 offset-lg-1"><SectionHeading eyebrow="Our approach" title="Clear thinking. Solid delivery." copy="LTraffic is a UK-wide infrastructure specialist with the experience to manage complex work and the mindset to keep things simple. We listen, plan honestly and stay close to the detail." /><ul className="check-list check-list--dark"><li><FiCheck /> Experienced leadership</li><li><FiCheck /> Straightforward communication</li><li><FiCheck /> Safety in every decision</li></ul><Link className="button button--dark" href="/contact">Work with us <FiArrowUpRight /></Link></div></div></div></section></main>;
}
