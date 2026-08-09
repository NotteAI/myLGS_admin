"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
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
import { AttributeSection } from "@/components/site/StoreFilterModal";
import { supabase } from "@/lib/supabase/browser";

interface StoreAttributeRow {
  attribute_type: string;
  attribute_value: string;
}

type GroupedOptions = Record<string, string[]>;

export interface DirectoryFilters {
  search: string;
  /** attribute_type → selected values (empty array = "all") */
  attributes: Record<string, string[]>;
}

interface Props {
  onApply: (filters: DirectoryFilters) => void;
  activeFilterCount: number;
  /** Table to pull attribute_type/attribute_value options from. */
  attributesTable?: string;
  /** Plural noun used in the trigger button and dialog title, e.g. "Shops" or "Ranges". */
  entityLabel?: string;
}

export const EMPTY_DIRECTORY_FILTERS: DirectoryFilters = {
  search: "",
  attributes: {},
};

export function countActiveDirectoryFilters(f: DirectoryFilters): number {
  const attrCount = Object.values(f.attributes).reduce((sum, vals) => sum + vals.length, 0);
  return attrCount + (f.search ? 1 : 0);
}

export function DirectoryFilterModal({
  onApply,
  activeFilterCount,
  attributesTable = "store_attributes",
  entityLabel = "Shops",
}: Props) {
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState<GroupedOptions>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [draft, setDraft] = useState<DirectoryFilters>(EMPTY_DIRECTORY_FILTERS);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    supabase
      .from(attributesTable)
      .select("attribute_type, attribute_value")
      .then(({ data, error }: { data: StoreAttributeRow[] | null; error: unknown }) => {
        if (error || !data) {
          setGrouped({});
          return;
        }
        const g: GroupedOptions = {};
        for (const row of data) {
          if (!g[row.attribute_type]) g[row.attribute_type] = [];
          if (!g[row.attribute_type].includes(row.attribute_value)) {
            g[row.attribute_type].push(row.attribute_value);
          }
        }
        setGrouped(g);
      })
      .finally(() => setLoadingOptions(false));
  }, [open, attributesTable]);

  function setAttrValues(type: string, vals: string[]) {
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [type]: vals } }));
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  function handleReset() {
    setDraft(EMPTY_DIRECTORY_FILTERS);
    onApply(EMPTY_DIRECTORY_FILTERS);
    setOpen(false);
  }

  const attrTypes = Object.keys(grouped);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 border border-ink px-4 h-9 text-xs font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-white transition-colors">
          <SlidersHorizontal className="size-3.5" />
          Filter {entityLabel}
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
            [ Filter {entityLabel} ]
          </DialogTitle>
        </DialogHeader>

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

          {loadingOptions ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading options…</p>
          ) : attrTypes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No attributes found.</p>
          ) : (
            attrTypes.map((type) => (
              <AttributeSection
                key={type}
                type={type}
                values={grouped[type]}
                selected={draft.attributes[type] ?? []}
                onChange={(vals) => setAttrValues(type, vals)}
              />
            ))
          )}
        </div>

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
