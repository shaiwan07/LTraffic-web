type SectionHeadingProps = {
    eyebrow: string;
    title: string;
    copy?: string;
    light?: boolean;
};

export function SectionHeading({ eyebrow, title, copy, light = false }: SectionHeadingProps) {
    return (
        <div className={`section-heading${light ? " section-heading--light" : ""}`}>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            {copy ? <p>{copy}</p> : null}
        </div>
    );
}
