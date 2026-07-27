import { Metadata } from "next";
import { Suspense } from "react";
import BuilderProfileClient from "@/components/BuilderProfileClient";
import BuilderProfileSkeleton from "@/components/BuilderProfileSkeleton";
import builders from "@/lib/builders.json";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const builder = builders.builders.find(
    (b) => b.address.toLowerCase() === address.toLowerCase()
  );
  return {
    title: builder
      ? `${builder.name} — Robinhood Chain Builder`
      : "Builder Profile — Robinhood Chain",
    description: builder
      ? `${builder.name} is a developer on Robinhood Chain. View live on-chain stats, token deployments, and creator rewards on Chain ID 4663.`
      : "View live on-chain stats, token deployments, and creator rewards for this Robinhood Chain builder on Chain ID 4663.",
  };
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<BuilderProfileSkeleton />}>
      <BuilderProfileClient />
    </Suspense>
  );
}
