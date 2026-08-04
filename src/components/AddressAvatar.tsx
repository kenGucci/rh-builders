"use client";

import Blocky from "react-blockies";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const avatarCache = new Map<string, string | "failed">();

export default function AddressAvatar({
  address,
  size = 32,
  className = "",
  handle,
}: {
  address: string;
  size?: number;
  className?: string;
  handle?: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!handle) return;
    const key = handle.toLowerCase();
    const cached = avatarCache.get(key);
    if (cached === "failed") return;
    if (cached) { setAvatarUrl(cached); return; }

    let active = true;
    fetch(`/api/twitter?handle=${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const url = data?.avatarUrl as string | undefined;
        if (url && active) {
          avatarCache.set(key, url);
          setAvatarUrl(url);
        } else if (active) {
          avatarCache.set(key, "failed");
        }
      })
      .catch(() => {
        if (!active) return;
        avatarCache.set(key, "failed");
        const url = `https://unavatar.io/twitter/${handle}`;
        const img = new window.Image();
        img.onload = () => {
          if (!mountedRef.current) return;
          avatarCache.set(key, url);
          setAvatarUrl(url);
        };
        img.onerror = () => {
          avatarCache.set(key, "failed");
        };
        img.src = url;
      });
    return () => { active = false; };
  }, [handle]);

  return (
    <div
      className={`rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={handle || address.slice(0, 6)}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <Blocky seed={address.toLowerCase()} size={Math.ceil(size / 8)} />
      )}
    </div>
  );
}
