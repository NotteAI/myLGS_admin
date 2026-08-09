"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { StoreCard, type StoreSummary } from "@/components/site/StoreCard";
import { RangeCard } from "@/components/site/RangeCard";

type DirectoryTab = "stores" | "ranges" | "classes";

const DIRECTORY_TABS: { key: DirectoryTab; label: string }[] = [
  { key: "stores", label: "Stores" },
  { key: "ranges", label: "Ranges" },
  { key: "classes", label: "Classes" },
];

const DIRECTORY_TITLES: Record<DirectoryTab, string> = {
  stores: "Shops in your local network",
  ranges: "Ranges in your local network",
  classes: "Classes in your local network",
};

interface RpcRangeRow {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
}

interface RpcRangesFilteredResponse {
  data: RpcRangeRow[];
  page: number;
  total: number;
  page_size: number;
  total_pages: number;
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DirectoryTab>("stores");
  const [q, setQ] = useState("");
  const [rangesSearch, setRangesSearch] = useState("");

  function selectTab(tab: DirectoryTab) {
    setActiveTab(tab);
    setQ("");
    setRangesSearch("");
  }

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

  const ranges = useQuery({
    queryKey: ["ranges-filtered", rangesSearch],
    enabled: activeTab === "ranges",
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_ranges_filtered",
        rangesSearch ? { p_search: rangesSearch } : {}
      );
      if (error) throw error;
      return (data as RpcRangesFilteredResponse).data;
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

          <div className="mt-10 inline-flex border-2 border-ink">
            {DIRECTORY_TABS.map((t, idx) => (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors ${
                  idx > 0 ? "border-l-2 border-ink" : ""
                } ${activeTab === t.key ? "bg-ink text-white" : "bg-card text-ink hover:bg-cement"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (activeTab === "classes") return;
              if (activeTab === "ranges") {
                setRangesSearch(q.trim());
                return;
              }
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
            className="mt-4 flex max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                disabled={activeTab === "classes"}
                placeholder={
                  activeTab === "classes"
                    ? "Coming soon!"
                    : activeTab === "ranges"
                    ? "Search ranges by name or location…"
                    : "Search tools, plants, books, coffee gear…"
                }
                className="h-14 w-full border-2 border-ink bg-card pl-12 pr-4 text-base placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={activeTab === "classes"}
              className="h-14 bg-ink px-8 text-sm font-semibold text-white hover:bg-brand transition-colors -ml-px border-2 border-ink disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-ink"
            >
              Search
            </button>
          </form>
          {activeTab === "stores" && (
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
          )}
        </div>
      </section>

      {/* Directory */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8 border-b border-ink pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
              [ 01 / The Directory ]
            </p>
            <h2 className="text-3xl font-bold">{DIRECTORY_TITLES[activeTab]}</h2>
          </div>
          {activeTab === "stores" && (
            <Link
              href="/stores"
              className="font-mono text-xs uppercase tracking-wider hover:text-brand flex items-center gap-1"
            >
              All shops <ArrowRight className="size-3" />
            </Link>
          )}
          {activeTab === "ranges" && (
            <Link
              href="/ranges"
              className="font-mono text-xs uppercase tracking-wider hover:text-brand flex items-center gap-1"
            >
              All ranges <ArrowRight className="size-3" />
            </Link>
          )}
        </div>

        {activeTab === "classes" && (
          <p className="text-sm text-muted-foreground">Coming soon!</p>
        )}

        {activeTab === "stores" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(stores.data ?? []).map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        )}

        {activeTab === "ranges" && (
          <>
            {ranges.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {ranges.isError && (
              <p className="text-sm text-destructive font-mono text-xs">Failed to load ranges.</p>
            )}
            {!ranges.isLoading && !ranges.isError && (ranges.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No ranges match.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(ranges.data ?? []).map((r) => (
                <RangeCard key={r.id} range={{ ...r, logo_url: null, primary_color_hex: null }} />
              ))}
            </div>
          </>
        )}
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
