import type { ReactNode } from "react";

type AdminPageHeadingProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
};

export default function AdminPageHeading({ title, description, actions }: AdminPageHeadingProps) {
    return (
        <header className="admin-page-heading">
            <div>
                <h1>{title}</h1>
                {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="admin-page-heading-actions">{actions}</div> : null}
        </header>
    );
}
