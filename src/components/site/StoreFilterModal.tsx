"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Search, ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";

interface FilterOptionRow {
  attribute_type: string;
  attribute_value: string;
}

type GroupedOptions = Record<string, string[]>;

export interface AppliedFilters {
  search: string;
  /** attribute_type → selected values (empty array = "all") */
  attributes: Record<string, string[]>;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
}

interface Props {
  storeId: number;
  onApply: (filters: AppliedFilters) => void;
  activeFilterCount: number;
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

export const EMPTY_FILTERS: AppliedFilters = {
  search: "",
  attributes: {},
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
};

export function countActiveFilters(f: AppliedFilters): number {
  const attrCount = Object.values(f.attributes).reduce((sum, vals) => sum + vals.length, 0);
  return attrCount + [f.search, f.minPrice, f.maxPrice, f.inStockOnly].filter(Boolean).length;
}

function AttributeSection({
  type,
  values,
  selected,
  onChange,
}: {
  type: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedCount = selected.length;

  function toggle(val: string) {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  }

  return (
    <div className="border border-input">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 h-12 text-left hover:bg-ink/5 transition-colors"
      >
        <span className="font-mono text-xs font-bold uppercase tracking-widest">
          {type}
          {selectedCount > 0 && (
            <span className="ml-2 font-normal normal-case tracking-normal text-brand">
              {selectedCount} selected
            </span>
          )}
        </span>
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
          {values.map((val) => {
            const active = selected.includes(val);
            // Shorten long labels to first word(s) for chip display
            const label = val.length > 16 ? val.split(" ")[0].toUpperCase() : val.toUpperCase();
            return (
              <button
                key={val}
                type="button"
                title={val}
                onClick={() => toggle(val)}
                className={`flex items-center gap-1.5 px-3 h-8 text-xs font-mono font-bold uppercase tracking-widest border transition-colors ${
                  active
                    ? "bg-brand border-brand text-white"
                    : "border-ink/30 hover:border-ink text-ink"
                }`}
              >
                {active && <Check className="size-3 shrink-0" />}
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StoreFilterModal({ storeId, onApply, activeFilterCount }: Props) {
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState<GroupedOptions>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [draft, setDraft] = useState<AppliedFilters>(EMPTY_FILTERS);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    rpcPost<FilterOptionRow[]>("get_filter_options", { p_store_id: storeId })
      .then((rows) => {
        const g: GroupedOptions = {};
        for (const row of rows) {
          if (!g[row.attribute_type]) g[row.attribute_type] = [];
          g[row.attribute_type].push(row.attribute_value);
        }
        setGrouped(g);
      })
      .catch(() => setGrouped({}))
      .finally(() => setLoadingOptions(false));
  }, [open, storeId]);

  function setAttrValues(type: string, vals: string[]) {
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [type]: vals } }));
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
    setOpen(false);
  }

  const attrTypes = Object.keys(grouped);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 border border-ink px-4 h-9 text-xs font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-white transition-colors">
          <SlidersHorizontal className="size-3.5" />
          Search This Shop
          {activeFilterCount > 0 && (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] text-white font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-widest">
            [ Filter Inventory ]
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Narrow this shop&apos;s inventory by keyword, category, brand, type, stock, and price.
          </p>
        </DialogHeader>

        {loadingOptions ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading options…</p>
        ) : (
          <div className="space-y-4 py-2">
            {/* Keyword */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-widest">Keyword</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 focus-visible:ring-brand"
                  placeholder="Title, description…"
                  value={draft.search}
                  onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                />
              </div>
            </div>

            {/* One accordion section per attribute type */}
            {attrTypes.map((type) => (
              <AttributeSection
                key={type}
                type={type}
                values={grouped[type]}
                selected={draft.attributes[type] ?? []}
                onChange={(vals) => setAttrValues(type, vals)}
              />
            ))}

            {/* Price range */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-widest">Min Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={draft.minPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-widest">Max Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="—"
                  value={draft.maxPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))}
                />
              </div>
            </div>

            {/* In stock */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="in-stock"
                checked={draft.inStockOnly}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, inStockOnly: !!v }))}
              />
              <Label htmlFor="in-stock" className="font-mono text-xs uppercase tracking-widest cursor-pointer">
                In Stock Only
              </Label>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            onClick={handleReset}
            className="h-12 border border-ink px-6 text-sm font-mono font-bold uppercase tracking-widest hover:bg-ink/5 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="h-12 bg-ink px-6 text-sm font-mono font-bold uppercase tracking-widest text-white hover:bg-brand transition-colors"
          >
            Apply Filters
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
