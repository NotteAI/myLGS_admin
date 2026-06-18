"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { StoreCard, type StoreSummary } from "@/components/site/StoreCard";

interface RecentInventoryItem {
  product_id: number;
  product_name: string;
  store_id: number;
  store_name: string;
  logo_url: string | null;
  price: number;
  image_url: string | null;
  created_at: string;
  inventory_count: number;
}

function stockBadge(count: number) {
  if (count >= 10) return { label: `${count} In Stock`, className: "text-success" };
  if (count >= 1) return { label: "Low Stock", className: "text-brand" };
  return { label: "Out of Stock", className: "text-destructive" };
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const watchlistQuery = useQuery({
    queryKey: ["watchlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("store_id, product_id")
        .eq("active", true);
      if (error) throw error;
      return new Set((data ?? []).map((r) => `${r.store_id}-${r.product_id}`));
    },
  });

  const watchedSet = watchlistQuery.data ?? new Set<string>();

  const watchlistMutation = useMutation({
    mutationFn: async ({ store_id, product_id, currently_watched }: { store_id: number; product_id: number; currently_watched: boolean }) => {
      if (!user) throw new Error("not-auth");
      if (currently_watched) {
        const { error } = await supabase
          .from("watchlist")
          .update({ active: false })
          .eq("store_id", store_id)
          .eq("product_id", product_id)
          .eq("active", true);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert({ store_id, product_id, active: true, user_id: user.id });
        if (error) throw error;
      }
      return !currently_watched;
    },
    onSuccess: (nowActive) => {
      qc.invalidateQueries({ queryKey: ["watchlist", user?.id] });
      toast.success(nowActive ? "Added to watchlist" : "Removed from watchlist");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "not-auth") {
        toast.error("Sign in to save items", {
          action: { label: "Sign in", onClick: () => router.push("/login") },
        });
      } else {
        toast.error("Couldn't update watchlist");
      }
    },
  });

  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, city, state, logo_url, primary_color_hex, url_extension")
        .order("name");
      if (error) throw error;
      return data as StoreSummary[];
    },
  });

  const items = useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_recent_inventory", {});
      if (error) throw error;
      return data as RecentInventoryItem[];
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
          {(items.data ?? []).map((i) => {
            const stock = stockBadge(i.inventory_count);
            const watched = watchedSet.has(`${i.store_id}-${i.product_id}`);
            return (
              <div key={`${i.product_id}-${i.created_at}`} className="group relative bg-card p-6 flex flex-col">
                <div className="aspect-square w-full bg-muted outline outline-1 -outline-offset-1 outline-black/5 grid place-items-center mb-4 overflow-hidden">
                  {i.image_url ? (
                    <img src={i.image_url} alt={i.product_name} className="size-3/4 object-contain" />
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {i.store_name}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {i.logo_url && (
                        <img src={i.logo_url} alt={i.store_name} className="size-4 rounded object-cover shrink-0" />
                      )}
                      <p className="font-mono text-[11px] uppercase tracking-wider text-brand truncate">
                        {i.store_name}
                      </p>
                    </div>
                    <h3 className="font-semibold leading-tight truncate">{i.product_name}</h3>
                  </div>
                  <p className="font-mono text-sm font-medium whitespace-nowrap shrink-0">
                    ${i.price.toFixed(2)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-medium ${stock.className}`}>{stock.label}</span>
                  <button
                    onClick={() => watchlistMutation.mutate({ store_id: i.store_id, product_id: i.product_id, currently_watched: watched })}
                    disabled={watchlistMutation.isPending}
                    aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
                    className="size-9 border flex items-center justify-center transition-all border-ink/15 hover:bg-ink hover:border-ink hover:text-white"
                  >
                    <Heart className={`size-4 ${watched ? "fill-black stroke-black" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })}
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
