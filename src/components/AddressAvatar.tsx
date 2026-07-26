"use client";

import Blocky from "react-blockies";

export default function AddressAvatar({
  address,
  size = 32,
  className = "",
}: {
  address: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Blocky seed={address.toLowerCase()} size={Math.ceil(size / 8)} />
    </div>
  );
}
