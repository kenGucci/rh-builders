"use client";

import { ArrowUpRight, Globe } from "lucide-react";
import { useState, useEffect } from "react";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  thumbnail: string | null;
}

export default function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news?query=crypto+robinhood+chain")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mb-20" aria-label="Latest news">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
            <Globe size={12} />
            News
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Latest headlines</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="mb-20 scroll-reveal" aria-label="Latest news">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
            <Globe size={12} />
            News
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Latest headlines</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">Crypto & Robinhood Chain from trusted sources</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.slice(0, 6).map((article, i) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 transition-all duration-300 hover:border-[var(--accent)]/15 hover:shadow-[0_4px_20px_rgba(0,200,5,0.04)] flex flex-col card-stagger"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-[var(--accent)]">{article.source}</span>
              {article.publishedAt && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <h3 className="text-[13px] font-semibold leading-snug group-hover:text-[var(--foreground)] transition-colors line-clamp-2 flex-1">
              {article.title}
            </h3>
            {article.description && (
              <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed">
                {article.description}
              </p>
            )}
            <div className="flex items-center gap-1 mt-4 text-[11px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Read more <ArrowUpRight size={10} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
