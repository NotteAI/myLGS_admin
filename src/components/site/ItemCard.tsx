"use client";

import Link from "next/link";
import { Heart, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, stockLabel, stockTone } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface InventoryItem {
  id: string;
  store_id: string;
  title: string;
  category: string | null;
  description: string | null;
  price_cents: number;
  price_unit: string | null;
  stock_count: number;
  stock_status: string;
  image_url: string | null;
}

interface Props {
  item: InventoryItem;
  storeName?: string;
  storeSlug?: string;
}

export function ItemCard({ item, storeName, storeSlug }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const tone = stockTone(item.stock_status);

  const wishlistQuery = useQuery({
    queryKey: ["wishlist-id", user?.id, item.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user!.id)
        .eq("item_id", item.id)
        .maybeSingle();
      return data?.id ?? null;
    },
  });

  const inWishlist = !!wishlistQuery.data;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-auth");
      if (inWishlist) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("id", wishlistQuery.data!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .insert({ user_id: user.id, item_id: item.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist-id", user?.id, item.id] });
      qc.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (e: Error) => {
      if (e.message === "not-auth") {
        toast.error("Sign in to save items", {
          action: { label: "Sign in", onClick: () => (window.location.href = "/auth") },
        });
      } else {
        toast.error("Couldn't update wishlist");
      }
    },
  });

  return (
    <div className="group relative bg-card p-6 flex flex-col">
      <div className="aspect-square w-full bg-muted outline outline-1 -outline-offset-1 outline-black/5 grid place-items-center mb-4 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="size-full object-cover" />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {item.category ?? "Item"}
          </span>
        )}
      </div>
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            {item.category ?? "Goods"}
          </p>
          <h3 className="mt-1 font-semibold leading-tight truncate">{item.title}</h3>
          {storeName && storeSlug && (
            <Link
              href={`/stores/${storeSlug}`}
              className="mt-1 inline-block font-mono text-[11px] text-brand hover:underline"
            >
              {storeName}
            </Link>
          )}
        </div>
        <p className="font-mono text-sm font-medium whitespace-nowrap">
          {formatPrice(item.price_cents, item.price_unit)}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium",
            tone === "success" && "text-success",
            tone === "brand" && "text-brand",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {stockLabel(item.stock_status, item.stock_count)}
        </span>
        <button
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "size-9 border flex items-center justify-center transition-all",
            inWishlist
              ? "bg-brand border-brand text-white"
              : "border-ink/15 hover:bg-ink hover:border-ink hover:text-white",
          )}
        >
          {inWishlist ? <Check className="size-4" /> : <Heart className="size-4" />}
        </button>
      </div>
    </div>
  );
}
