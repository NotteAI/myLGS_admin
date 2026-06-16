"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { ItemCard, type InventoryItem } from "@/components/site/ItemCard";
import { SpecialOrderDialog } from "@/components/site/SpecialOrderDialog";

interface Store {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  hours: string | null;
  category: string | null;
  distance_miles: number | null;
  cover_image: string | null;
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();

  const storeQuery = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Store | null;
    },
  });

  const store = storeQuery.data;

  const items = useQuery({
    queryKey: ["store-items", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  if (storeQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-6 py-12"><p className="text-sm text-muted-foreground">Loading…</p></main>;
  }

  if (!store) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">[ 404 ]</p>
        <h1 className="text-3xl font-bold">Shop not found</h1>
        <Link href="/stores" className="mt-6 inline-block font-mono text-sm underline">
          Back to all shops
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-sm bg-brand px-1.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
              Open Now
            </span>
            {store.distance_miles != null && (
              <span className="font-mono text-xs text-ink/50">{store.distance_miles} mi away</span>
            )}
            {store.category && (
              <span className="font-mono text-xs text-ink/50">· {store.category}</span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{store.name}</h1>
          {store.tagline && (
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{store.tagline}</p>
          )}
          {store.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{store.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-ink/60">
            {store.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {store.address}
              </span>
            )}
            {store.hours && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> {store.hours}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <SpecialOrderDialog storeId={store.id} storeName={store.name} />
        </div>
      </div>

      <div className="border-t border-ink pt-4 mb-6 flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
          In-Store Inventory ({items.data?.length ?? "—"})
        </h2>
      </div>

      {items.isLoading && <p className="text-sm text-muted-foreground">Loading inventory…</p>}
      {items.data && items.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No items listed yet.</p>
      )}

      <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4 border border-ink/10">
        {(items.data ?? []).map((i) => (
          <ItemCard key={i.id} item={i} />
        ))}
      </div>
    </main>
  );
}
