"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DirectoryFilterModal() {
  const [open, setOpen] = useState(false);

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
      </DialogContent>
    </Dialog>
  );
}
