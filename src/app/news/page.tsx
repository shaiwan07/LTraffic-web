import { FiArrowUpRight } from "react-icons/fi";
import Link from "next/link";

const stories = [{ date: "06.09.26", title: "The future of connected infrastructure", tag: "Insight" }, { date: "21.08.26", title: "Keeping city streets moving during live works", tag: "Projects" }, { date: "12.07.26", title: "Five ways to plan a safer site", tag: "People" }];

export default function NewsPage() { return <main><section className="page-hero page-hero--dark"><div className="container-fluid px-4 px-xxl-5"><span className="eyebrow eyebrow--light">News & insight</span><h1>Ideas, updates and lessons from the road ahead.</h1><p>A closer look at the projects, people and thinking shaping the way we work.</p></div></section><section className="section-space"><div className="container-fluid px-4 px-xxl-5"><div className="news-list">{stories.map((story) => <Link href="/contact" className="news-item" key={story.title}><span className="news-date">{story.date}<small>{story.tag}</small></span><h2>{story.title}</h2><FiArrowUpRight /></Link>)}</div></div></section></main>; }
