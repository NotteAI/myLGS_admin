"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { StoreCard, type StoreSummary } from "@/components/site/StoreCard";

export default function StoresPage() {
  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, slug, name, tagline, category, distance_miles")
        .order("name");
      if (error) throw error;
      return data as StoreSummary[];
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 border-b border-ink pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
          [ The Directory ]
        </p>
        <h1 className="text-4xl font-bold tracking-tight">All Shops</h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Every brick-and-mortar in the network. Tap one to see what&apos;s on its shelves right now.
        </p>
      </div>

      {stores.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(stores.data ?? []).map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </div>
    </main>
  );
}
