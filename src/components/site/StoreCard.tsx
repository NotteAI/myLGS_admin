import Link from "next/link";

export interface StoreSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  category: string | null;
  distance_miles: number | null;
}

export function StoreCard({ store }: { store: StoreSummary }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="block bg-card border border-ink/10 p-5 hover:border-brand transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
          {store.category ?? "Local Shop"}
        </span>
        {store.distance_miles != null && (
          <span className="font-mono text-[10px] text-ink/40">{store.distance_miles} mi</span>
        )}
      </div>
      <h3 className="font-bold text-lg leading-tight group-hover:text-brand transition-colors">
        {store.name}
      </h3>
      {store.tagline && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{store.tagline}</p>
      )}
    </Link>
  );
}
