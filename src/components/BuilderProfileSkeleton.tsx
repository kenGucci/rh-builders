export default function BuilderProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-16 rounded animate-shimmer" style={{ background: "var(--surface)" }} />
      <div className="h-32 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />
      <div className="h-12 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />
    </div>
  );
}
