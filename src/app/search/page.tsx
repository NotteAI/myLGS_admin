"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ItemCard, type InventoryItem } from "@/components/site/ItemCard";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";

interface RpcItem {
  product_id: number;
  store_id: number;
  store_name: string;
  logo_url: string | null;
  name: string;
  price: number;
  inventory_count: number;
  image_url: string | null;
  manufacturer: string | null;
  model: string | null;
  ffl_required: boolean;
}

interface RpcResponse {
  data: RpcItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface MappedItem extends InventoryItem {
  store_id_num: number;
  product_id: number;
  store_name: string;
  logo_url: string | null;
}

function stockStatus(count: number): string {
  if (count >= 10) return "in_stock";
  if (count >= 1) return "low_stock";
  return "out_of_stock";
}

function mapItem(r: RpcItem): MappedItem {
  return {
    id: `${r.store_id}-${r.product_id}`,
    store_id: String(r.store_id),
    title: r.name,
    category: r.manufacturer ?? null,
    description: null,
    price_cents: Math.round(r.price * 100),
    price_unit: null,
    stock_count: r.inventory_count,
    stock_status: stockStatus(r.inventory_count),
    image_url: r.image_url,
    store_id_num: r.store_id,
    product_id: r.product_id,
    store_name: r.store_name,
    logo_url: r.logo_url,
  };
}

interface MappedResponse {
  data: MappedItem[];
  total: number;
}

async function fetchInventoryFiltered(search: string): Promise<MappedResponse> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_inventory_filtered`;
  const body = {
    p_store_id: null,
    p_page_num: 1,
    p_page_size: 60,
    p_in_stock_only: false,
    p_search: search || null,
    p_filters: [],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Profile": SUPABASE_SCHEMA,
      "Accept-Profile": SUPABASE_SCHEMA,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`get_inventory_filtered failed (${res.status}): ${text}`);
  }

  const raw: RpcResponse = await res.json();
  return { data: raw.data.map(mapItem), total: raw.total };
}

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
    queryFn: () => fetchInventoryFiltered(term),
  });

  const items: MappedItem[] = results.data?.data ?? [];

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
          {results.data ? `${results.data.total} item(s)` : "Loading…"}
        </p>
      </div>

      {results.isError && (
        <div className="py-16 text-center text-destructive font-mono text-xs">
          {(results.error as Error).message}
        </div>
      )}

      {results.data && items.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p>Nothing matches &ldquo;{term}&rdquo; yet.</p>
          <p className="text-xs mt-2 font-mono">Try a shop&apos;s special order form.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4 border border-ink/10">
        {items.map((i) => (
          <ItemCard
            key={i.id}
            item={i}
            storeName={i.store_name}
            storeLogo={i.logo_url}
            storeId={i.store_id_num}
            productId={i.product_id}
          />
        ))}
      </div>
    </main>
  );
}
