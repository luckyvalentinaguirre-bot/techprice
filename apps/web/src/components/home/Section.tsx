import Link from "next/link";
import { Icon } from "./Icon";

/** Section wrapper with a consistent title / subtitle / optional "see all" link. */
export function Section({
  title,
  subtitle,
  link,
  children,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h2 className="section__title">{title}</h2>
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </div>
        {link && (
          <Link href={link.href} className="section__link">
            {link.label} <Icon name="arrowRight" size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
