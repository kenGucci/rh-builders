"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import XProfileCard from "@/components/XProfileCard";

export default function XProfilePage() {
  const params = useParams<{ handle: string }>();
  const router = useRouter();
  const handle = (params.handle as string).replace(/^@/, "");

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold">X Profile</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Live profile details for <span className="text-[var(--accent)] font-mono">@{handle}</span>
        </p>
      </div>

      <XProfileCard handle={handle} />

      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
        <ExternalLink size={12} className="text-[var(--accent)]" />
        <span>
          All data is fetched live from X. See the full profile at{" "}
          <a
            href={`https://x.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            x.com/{handle}
          </a>
        </span>
      </div>
    </div>
  );
}
