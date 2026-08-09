"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browser";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";

/** Shape returned by my_lgs_dev.get_range_header(p_range_id) */
interface RangeHeader {
  range_id: number;
  range_name: string;
  range_description: string | null;
  range_city: string | null;
  range_state: string | null;
  range_logo_url: string | null;
  range_website_url: string | null;
  org_id: number | null;
  org_name: string | null;
  training_id: number | null;
  training_name: string | null;
  training_url: string | null;
  training_extension: string | null;
  store_id: number | null;
  store_name: string | null;
  store_url: string | null;
  store_extension: string | null;
}

/** Shape returned by my_lgs_dev.get_range_attributes(p_range_id) */
interface RangeAttribute {
  range_id: number;
  range_name: string;
  attribute_type: string;
  attribute_value: string;
}

/** Minimal row from my_lgs_dev.ranges */
interface RangeRow {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  primary_color_hex: string | null;
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

export default function RangePage() {
  const { slug } = useParams<{ slug: string }>();

  // Step 1: resolve url_extension → range row (numeric id + basic fields)
  const rangeQuery = useQuery({
    queryKey: ["range-row", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranges")
        .select("id, name, city, state, logo_url, primary_color_hex")
        .eq("url_extension", slug)
        .maybeSingle();
      if (error) throw error;
      return data as RangeRow | null;
    },
  });

  const range = rangeQuery.data;
  const rangeId = range?.id ?? null;

  // Step 2: call get_range_header(p_range_id)
  const headerQuery = useQuery({
    queryKey: ["range-header", rangeId],
    enabled: rangeId != null,
    queryFn: async () => {
      const raw = await rpcPost<RangeHeader[]>("get_range_header", { p_range_id: rangeId });
      return raw[0] ?? null;
    },
  });

  // Step 3: call get_range_attributes(p_range_id)
  const attributesQuery = useQuery({
    queryKey: ["range-attributes", rangeId],
    enabled: rangeId != null,
    queryFn: async () => {
      return rpcPost<RangeAttribute[]>("get_range_attributes", { p_range_id: rangeId });
    },
  });

  if (rangeQuery.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (rangeQuery.isError || !range) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">[ 404 ]</p>
        <h1 className="text-3xl font-bold">Range not found</h1>
        {rangeQuery.isError && (
          <p className="mt-4 font-mono text-xs text-destructive">
            {(rangeQuery.error as Error).message}
          </p>
        )}
        <Link href="/ranges" className="mt-6 inline-block font-mono text-sm underline">
          Back to all ranges
        </Link>
      </main>
    );
  }

  const header = headerQuery.data;
  const rangeName = header?.range_name ?? range.name;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      {/* Range header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-4 items-start">
          {(header?.range_logo_url ?? range.logo_url) ? (
            <img
              src={header?.range_logo_url ?? range.logo_url ?? undefined}
              alt={rangeName}
              className="size-16 rounded object-cover border border-ink/10 shrink-0"
            />
          ) : (
            <div
              className="size-16 rounded shrink-0 flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: range.primary_color_hex ?? "#888" }}
            >
              {rangeName[0]}
            </div>
          )}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{rangeName}</h1>
            {((header?.range_city ?? range.city) || (header?.range_state ?? range.state)) && (
              <p className="mt-1 font-mono text-xs text-ink/50 uppercase tracking-wider">
                {[header?.range_city ?? range.city, header?.range_state ?? range.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {header?.range_website_url && (
              <a
                href={header.range_website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-mono text-xs text-brand hover:underline truncate max-w-xs"
              >
                {header.range_website_url}
              </a>
            )}
            {header?.range_description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                {header.range_description}
              </p>
            )}
            {header?.store_name && header?.store_extension && (
              <p className="mt-2 text-sm text-muted-foreground">
                This range is operated by:{" "}
                <Link href={`/stores/${header.store_extension}`} className="text-brand hover:underline">
                  {header.store_name}
                </Link>
              </p>
            )}
            {header?.training_name && header?.training_extension && (
              <p className="mt-1 text-sm text-muted-foreground">
                This range also offers training:{" "}
                <Link href={`/training/${header.training_extension}`} className="text-brand hover:underline">
                  {header.training_name}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="border-t border-ink pt-4 mb-6">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Attributes</h2>
      </div>

      {attributesQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading attributes…</p>
      )}
      {attributesQuery.isError && (
        <p className="text-sm text-destructive font-mono text-xs">
          {(attributesQuery.error as Error).message}
        </p>
      )}
      {attributesQuery.data && attributesQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No attributes listed yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {(attributesQuery.data ?? []).map((a, idx) => (
          <span
            key={`${a.attribute_type}-${a.attribute_value}-${idx}`}
            className="flex items-center gap-1.5 px-3 h-8 text-xs font-mono font-bold uppercase tracking-widest border border-ink/30 text-ink"
            title={`${a.attribute_type}: ${a.attribute_value}`}
          >
            {a.attribute_type}: {a.attribute_value}
          </span>
        ))}
      </div>
    </main>
  );
}
