"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase/browser";
import { ItemCard, type InventoryItem } from "@/components/site/ItemCard";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const term = (searchParams.get("q") ?? "").trim();

  const results = useQuery({
    queryKey: ["search", term],
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select("*, stores!inner(name, slug)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (term) {
        const escaped = term.replace(/[%_]/g, "\\$&");
        query = query.or(
          `title.ilike.%${escaped}%,description.ilike.%${escaped}%,category.ilike.%${escaped}%`,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as (InventoryItem & { stores: { name: string; slug: string } })[];
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 border-b border-ink pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
          [ Search Results ]
        </p>
        <h1 className="text-3xl font-bold">
          {term ? <>Results for &ldquo;{term}&rdquo;</> : "Browse all inventory"}
        </h1>
        <p className="mt-2 font-mono text-xs text-ink/50">
          {results.data ? `${results.data.length} item(s)` : "Loading…"}
        </p>
      </div>

      {results.data && results.data.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p>Nothing matches &ldquo;{term}&rdquo; yet.</p>
          <p className="text-xs mt-2 font-mono">Try a shop&apos;s special order form.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4 border border-ink/10">
        {(results.data ?? []).map((i) => (
          <ItemCard key={i.id} item={i} storeName={i.stores.name} storeSlug={i.stores.slug} />
        ))}
      </div>
    </main>
  );
}
