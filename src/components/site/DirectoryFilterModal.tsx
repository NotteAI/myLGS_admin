"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export function DirectoryFilterModal() {
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState<GroupedOptions>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    supabase
      .from("store_attributes")
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
  }, [open]);

  function setAttrValues(type: string, vals: string[]) {
    setSelected((s) => ({ ...s, [type]: vals }));
  }

  const attrTypes = Object.keys(grouped);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 border border-ink px-4 h-9 text-xs font-mono font-bold uppercase tracking-widest hover:bg-ink hover:text-white transition-colors">
          <SlidersHorizontal className="size-3.5" />
          Filter Shops
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-widest">
            [ Filter Shops ]
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                selected={selected[type] ?? []}
                onChange={(vals) => setAttrValues(type, vals)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
