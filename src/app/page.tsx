"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { ItemCard, type InventoryItem } from "@/components/site/ItemCard";
import { StoreCard, type StoreSummary } from "@/components/site/StoreCard";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");

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

  const items = useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, stores!inner(name, slug)")
        .in("stock_status", ["in_stock", "low_stock"])
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as (InventoryItem & { stores: { name: string; slug: string } })[];
    },
  });

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-ink/10 bg-cement/30">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-6">
            [ Local · In-Store · Real Stock ]
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl text-balance">
            What are you looking for?
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            See what local FFLs, training, and events are in your area
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
            className="mt-10 flex max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Search tools, plants, books, coffee gear…"
                className="h-14 w-full border-2 border-ink bg-card pl-12 pr-4 text-base placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              className="h-14 bg-ink px-8 text-sm font-semibold text-white hover:bg-brand transition-colors -ml-px border-2 border-ink"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono text-ink/50">
            <span>Trending:</span>
            {["brass pull", "monstera", "olive oil", "tape measure"].map((t) => (
              <button
                key={t}
                onClick={() => router.push(`/search?q=${encodeURIComponent(t)}`)}
                className="hover:text-brand underline decoration-ink/20 hover:decoration-brand"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stores */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8 border-b border-ink pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
              [ 01 / The Directory ]
            </p>
            <h2 className="text-3xl font-bold">Shops in your local network</h2>
          </div>
          <Link
            href="/stores"
            className="font-mono text-xs uppercase tracking-wider hover:text-brand flex items-center gap-1"
          >
            All shops <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stores.data ?? []).map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </section>

      {/* Recent inventory */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex items-end justify-between mb-8 border-b border-ink pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
              [ 02 / Fresh Stock ]
            </p>
            <h2 className="text-3xl font-bold">Recently added across the network</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4 border border-ink/10">
          {(items.data ?? []).map((i) => (
            <ItemCard key={i.id} item={i} storeName={i.stores.name} storeSlug={i.stores.slug} />
          ))}
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-ink text-white/60">
        <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <svg width="120" viewBox="0 0 680 250" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="my LGS">
              <circle cx="155" cy="122" r="64" strokeWidth="1.5" fill="none" stroke="#555555" />
              <path d="M142,75 L144.8,89 L144.8,99 L146.5,111 L146.5,164 L147.5,164 L147.5,168 L136.5,168 L136.5,164 L137.5,164 L137.5,111 L139.2,99 L139.2,89 Z" fill="#b89030" />
              <path d="M155,75 L157.8,89 L157.8,99 L159.5,111 L159.5,164 L160.5,164 L160.5,168 L149.5,168 L149.5,164 L150.5,164 L150.5,111 L152.2,99 L152.2,89 Z" fill="#b89030" />
              <path d="M168,75 L170.8,89 L170.8,99 L172.5,111 L172.5,164 L173.5,164 L173.5,168 L162.5,168 L162.5,164 L163.5,164 L163.5,111 L165.2,99 L165.2,89 Z" fill="#b89030" />
              <line x1="252" y1="62" x2="252" y2="185" strokeWidth="1" stroke="#666666" />
              <text x="278" y="97" fontSize="15" fontWeight="300" fontFamily="var(--font-sans,Arial,sans-serif)" fill="#888888">my</text>
              <line x1="278" y1="109" x2="448" y2="109" strokeWidth="1" stroke="#b89030" />
              <text x="271" y="186" fontSize="90" fontWeight="700" fontFamily="var(--font-sans,Arial,sans-serif)" fill="#444444">LGS</text>
            </svg>
            <p className="mt-2 text-sm max-w-md">
              Your local stores and FFLs near you
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest self-end">
            Edition 2026 · Local
          </p>
        </div>
      </footer>
    </main>
  );
}
