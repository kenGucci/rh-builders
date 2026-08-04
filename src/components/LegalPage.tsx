import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

interface Section {
  heading: string;
  paragraphs: string[];
}

const legalNav = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
];

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Settings
      </Link>

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Last updated: {updated}</p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{intro}</p>

      {sections.map((s, i) => (
        <section key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-base font-bold mb-3">{s.heading}</h2>
          {s.paragraphs.map((p, j) => (
            <p key={j} className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2 last:mb-0">
              {p}
            </p>
          ))}
        </section>
      ))}

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 border-t border-[var(--border-subtle)]" aria-label="Legal pages">
        {legalNav.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="text-center text-[10px] text-[var(--text-muted)] pb-4">
        <p>THE WALL · Robinhood Chain (Chain ID 4663)</p>
      </div>
    </div>
  );
}
