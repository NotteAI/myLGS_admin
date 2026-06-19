"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Phone, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { ItemCard, type InventoryItem } from "@/components/site/ItemCard";
import { SpecialOrderDialog } from "@/components/site/SpecialOrderDialog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";

/** Shape returned by my_lgs_dev.get_store_header(store_id) */
interface StoreHeader {
  store_id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  store_description: string | null;
  address: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  store_website: string | null;
  logo_url: string | null;
  cover_image: string | null;
  category: string | null;
  distance_miles: number | null;
  is_open: boolean | null;
  city: string | null;
  state: string | null;
  primary_color_hex: string | null;
  training_name: string | null;
  training_extension: string | null;
  range_name: string | null;
  range_extension: string | null;
}

/** Minimal row from my_lgs_dev.stores */
interface StoreRow {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  primary_color_hex: string | null;
}

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

interface RpcInventoryResponse {
  data: RpcItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface MappedItem extends InventoryItem {
  store_id_num: number;
  product_id: number;
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
  };
}

async function rpcPost<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
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
    throw new Error(`${fn} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();

  // Step 1: resolve url_extension → store row (numeric id + basic fields)
  const storeQuery = useQuery({
    queryKey: ["store-row", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, city, state, logo_url, primary_color_hex")
        .eq("url_extension", slug)
        .maybeSingle();
      if (error) throw error;
      return data as StoreRow | null;
    },
  });

  const store = storeQuery.data;
  const storeId = store?.id ?? null;

  // Step 2: call get_store_header(store_id) — may not exist yet; errors are suppressed
  const headerQuery = useQuery({
    queryKey: ["store-header", storeId],
    enabled: storeId != null,
    retry: false,
    queryFn: async () => {
      const raw = await rpcPost<StoreHeader | StoreHeader[]>("get_store_header", {
        store_id: storeId,
      });
      return (Array.isArray(raw) ? (raw[0] ?? null) : raw) as StoreHeader | null;
    },
  });

  // Merge: prefer RPC data when available, fall back to stores table
  const header: Partial<StoreHeader> | null = headerQuery.data ?? (store
    ? {
        store_id: store.id,
        name: store.name,
        city: store.city,
        state: store.state,
        logo_url: store.logo_url,
        primary_color_hex: store.primary_color_hex,
        tagline: null,
        description: null,
        store_description: null,
        address: null,
        hours: null,
        phone: null,
        website: null,
        store_website: null,
        cover_image: null,
        category: null,
        distance_miles: null,
        is_open: null,
        training_name: null,
        training_extension: null,
        range_name: null,
        range_extension: null,
      }
    : null);

  // Step 3: call get_inventory_filtered(p_store_id)
  const inventoryQuery = useQuery({
    queryKey: ["store-inventory", storeId],
    enabled: storeId != null,
    queryFn: async () => {
      const raw = await rpcPost<RpcInventoryResponse>("get_inventory_filtered", {
        p_store_id: storeId,
        p_page_num: 1,
        p_page_size: 100,
        p_in_stock_only: false,
        p_search: null,
        p_filters: [],
      });
      return raw.data.map(mapItem);
    },
  });

  if (storeQuery.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (storeQuery.isError || !store) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">[ 404 ]</p>
        <h1 className="text-3xl font-bold">Shop not found</h1>
        {storeQuery.isError && (
          <p className="mt-4 font-mono text-xs text-destructive">
            {(storeQuery.error as Error).message}
          </p>
        )}
        <Link href="/stores" className="mt-6 inline-block font-mono text-sm underline">
          Back to all shops
        </Link>
      </main>
    );
  }

  const storeName = header?.name ?? store.name;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      {/* Cover image */}
      {header?.cover_image && (
        <div className="mb-8 w-full h-48 overflow-hidden border border-ink/10">
          <img src={header.cover_image} alt={storeName} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Store header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-4 items-start">
          {header?.logo_url ? (
            <img
              src={header.logo_url}
              alt={storeName}
              className="size-16 rounded object-cover border border-ink/10 shrink-0"
            />
          ) : store.primary_color_hex && (
            <div
              className="size-16 rounded shrink-0 flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: store.primary_color_hex }}
            >
              {storeName[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {header?.is_open != null && (
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase ${
                    header.is_open ? "bg-brand" : "bg-ink/40"
                  }`}
                >
                  {header.is_open ? "Open Now" : "Closed"}
                </span>
              )}
              {header?.distance_miles != null && (
                <span className="font-mono text-xs text-ink/50">{header.distance_miles} mi away</span>
              )}
              {header?.category && (
                <span className="font-mono text-xs text-ink/50">· {header.category}</span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{storeName}</h1>
            {(header?.city || header?.state) && (
              <p className="mt-1 font-mono text-xs text-ink/50 uppercase tracking-wider">
                {[header.city, header.state].filter(Boolean).join(", ")}
              </p>
            )}
            {(header?.store_website || header?.website) && (
              <a
                href={(header.store_website ?? header.website)!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-mono text-xs text-brand hover:underline truncate max-w-xs"
              >
                {header.store_website ?? header.website}
              </a>
            )}
            {(header?.store_description || header?.description) && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                {header.store_description ?? header.description}
              </p>
            )}
            {header?.training_name && header?.training_extension && (
              <p className="mt-2 text-sm text-muted-foreground">
                This store also offers training:{" "}
                <Link href={`/training/${header.training_extension}`} className="text-brand hover:underline">
                  {header.training_name}
                </Link>
              </p>
            )}
            {header?.range_name && header?.range_extension && (
              <p className="mt-1 text-sm text-muted-foreground">
                This store also operates a range:{" "}
                <Link href={`/ranges/${header.range_extension}`} className="text-brand hover:underline">
                  {header.range_name}
                </Link>
              </p>
            )}
            {header?.tagline && (
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{header.tagline}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-ink/60">
              {header?.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {header.address}
                </span>
              )}
              {header?.hours && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" /> {header.hours}
                </span>
              )}
              {header?.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {header.phone}
                </span>
              )}
              {header?.website && (
                <a
                  href={header.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-brand"
                >
                  <Globe className="size-3.5" /> {header.website}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <SpecialOrderDialog storeId={String(storeId ?? "")} storeName={storeName} />
        </div>
      </div>

      {/* Inventory section */}
      <div className="border-t border-ink pt-4 mb-6 flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
          In-Store Inventory ({inventoryQuery.data?.length ?? "—"})
        </h2>
      </div>

      {inventoryQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading inventory…</p>
      )}
      {inventoryQuery.isError && (
        <p className="text-sm text-destructive font-mono text-xs">
          {(inventoryQuery.error as Error).message}
        </p>
      )}
      {inventoryQuery.data && inventoryQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No items listed yet.</p>
      )}

      <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4 border border-ink/10">
        {(inventoryQuery.data ?? []).map((i) => (
          <ItemCard
            key={i.id}
            item={i}
            storeId={i.store_id_num}
            productId={i.product_id}
          />
        ))}
      </div>
    </main>
  );
}
