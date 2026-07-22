"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { StoreCard, type StoreSummary } from "@/components/site/StoreCard";
import {
  DirectoryFilterModal,
  EMPTY_DIRECTORY_FILTERS,
  countActiveDirectoryFilters,
  type DirectoryFilters,
} from "@/components/site/DirectoryFilterModal";

interface RpcStoreRow {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
}

interface StoreAttributeRow {
  store_id: number;
  attribute_type: string;
  attribute_value: string;
}

export default function StoresPage() {
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_DIRECTORY_FILTERS);

  // Full store rows, needed for display fields get_stores_filtered doesn't return
  // (logo, brand color, url_extension).
  const allStores = useQuery({
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

  // store_id → attributes, needed for client-side filtering (see below).
  const attributesMap = useQuery({
    queryKey: ["store-attributes-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_attributes")
        .select("store_id, attribute_type, attribute_value");
      if (error) throw error;
      const map = new Map<number, Record<string, Set<string>>>();
      for (const row of data as StoreAttributeRow[]) {
        if (!map.has(row.store_id)) map.set(row.store_id, {});
        const byType = map.get(row.store_id)!;
        if (!byType[row.attribute_type]) byType[row.attribute_type] = new Set();
        byType[row.attribute_type].add(row.attribute_value);
      }
      return map;
    },
  });

  const filteredStores = useQuery({
    queryKey: ["stores-filtered", filters.search],
    queryFn: async () => {
      // p_filters has the same server-side SQL bug as get_inventory_filtered for
      // non-empty arrays; attribute filtering is applied client-side below.
      const { data, error } = await supabase.rpc("get_stores_filtered", {
        p_filters: [],
        p_search: filters.search || null,
      });
      if (error) throw error;
      return data as RpcStoreRow[];
    },
  });

  const isLoading = allStores.isLoading || filteredStores.isLoading || attributesMap.isLoading;
  const isError = allStores.isError || filteredStores.isError || attributesMap.isError;

  let stores: StoreSummary[] = [];
  if (allStores.data && filteredStores.data) {
    const byId = new Map(allStores.data.map((s) => [s.id, s]));
    stores = filteredStores.data
      .map((r) => byId.get(r.id))
      .filter((s): s is StoreSummary => s != null);

    // Client-side attribute filtering
    if (attributesMap.data) {
      for (const [type, values] of Object.entries(filters.attributes)) {
        if (!values.length) continue;
        stores = stores.filter((s) => {
          const byType = attributesMap.data.get(s.id);
          const storeValues = byType?.[type];
          return storeValues != null && values.some((v) => storeValues.has(v));
        });
      }
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 border-b border-ink pb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
            [ The Directory ]
          </p>
          <h1 className="text-4xl font-bold tracking-tight">All Shops</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Every brick-and-mortar in the network. Tap one to see what&apos;s on its shelves right now.
          </p>
        </div>
        <DirectoryFilterModal
          onApply={setFilters}
          activeFilterCount={countActiveDirectoryFilters(filters)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="text-sm text-destructive font-mono text-xs">Failed to load shops.</p>
      )}
      {!isLoading && !isError && stores.length === 0 && (
        <p className="text-sm text-muted-foreground">No shops match those filters.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </div>
    </main>
  );
}
