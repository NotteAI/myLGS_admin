"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { RangeCard, type RangeSummary } from "@/components/site/RangeCard";
import {
  DirectoryFilterModal,
  EMPTY_DIRECTORY_FILTERS,
  countActiveDirectoryFilters,
  type DirectoryFilters,
} from "@/components/site/DirectoryFilterModal";

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

interface RangeAttributeRow {
  range_id: number;
  attribute_type: string;
  attribute_value: string;
}

export default function RangesPage() {
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_DIRECTORY_FILTERS);

  // Full range rows, needed for display fields get_ranges_filtered doesn't return
  // (logo, brand color).
  const allRanges = useQuery({
    queryKey: ["ranges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranges")
        .select("id, name, city, state, logo_url, primary_color_hex, url_extension")
        .order("name");
      if (error) throw error;
      return data as RangeSummary[];
    },
  });

  // range_id → attributes, needed for client-side filtering (see below).
  const attributesMap = useQuery({
    queryKey: ["range-attributes-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("range_attributes")
        .select("range_id, attribute_type, attribute_value");
      if (error) throw error;
      const map = new Map<number, Record<string, Set<string>>>();
      for (const row of data as RangeAttributeRow[]) {
        if (!map.has(row.range_id)) map.set(row.range_id, {});
        const byType = map.get(row.range_id)!;
        if (!byType[row.attribute_type]) byType[row.attribute_type] = new Set();
        byType[row.attribute_type].add(row.attribute_value);
      }
      return map;
    },
  });

  const filteredRanges = useQuery({
    queryKey: ["ranges-filtered", filters.search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_ranges_filtered",
        filters.search ? { p_search: filters.search } : {}
      );
      if (error) throw error;
      return (data as RpcRangesFilteredResponse).data;
    },
  });

  const isLoading = allRanges.isLoading || filteredRanges.isLoading || attributesMap.isLoading;
  const isError = allRanges.isError || filteredRanges.isError || attributesMap.isError;

  let ranges: RangeSummary[] = [];
  if (allRanges.data && filteredRanges.data) {
    const byId = new Map(allRanges.data.map((r) => [r.id, r]));
    ranges = filteredRanges.data
      .map((r) => byId.get(r.id))
      .filter((r): r is RangeSummary => r != null);

    // Client-side attribute filtering
    if (attributesMap.data) {
      for (const [type, values] of Object.entries(filters.attributes)) {
        if (!values.length) continue;
        ranges = ranges.filter((r) => {
          const byType = attributesMap.data.get(r.id);
          const rangeValues = byType?.[type];
          return rangeValues != null && values.some((v) => rangeValues.has(v));
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
          <h1 className="text-4xl font-bold tracking-tight">All Ranges</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Every range in the network. Find one that fits what you want to shoot.
          </p>
        </div>
        <DirectoryFilterModal
          onApply={setFilters}
          activeFilterCount={countActiveDirectoryFilters(filters)}
          attributesTable="range_attributes"
          entityLabel="Ranges"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="text-sm text-destructive font-mono text-xs">Failed to load ranges.</p>
      )}
      {!isLoading && !isError && ranges.length === 0 && (
        <p className="text-sm text-muted-foreground">No ranges match those filters.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranges.map((r) => (
          <RangeCard key={r.id} range={r} />
        ))}
      </div>
    </main>
  );
}
