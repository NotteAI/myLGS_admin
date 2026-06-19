"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, stockLabel, stockTone } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  storeLogo?: string | null;
  /** Numeric store_id + product_id from the watchlist-compatible data model. When absent, the watchlist button is hidden. */
  storeId?: number;
  productId?: number;
}

export function ItemCard({ item, storeName, storeSlug, storeLogo, storeId, productId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const tone = stockTone(item.stock_status);
  const canWatch = storeId != null && productId != null;

  const watchQuery = useQuery({
    queryKey: ["watchlist-item", user?.id, storeId, productId],
    enabled: !!user && canWatch,
    queryFn: async () => {
      const { data } = await supabase
        .from("watchlist")
        .select("active")
        .eq("store_id", storeId!)
        .eq("product_id", productId!)
        .eq("active", true)
        .maybeSingle();
      return !!data;
    },
  });

  const isWatched = watchQuery.data ?? false;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-auth");
      if (isWatched) {
        const { error } = await supabase
          .from("watchlist")
          .update({ active: false })
          .eq("store_id", storeId!)
          .eq("product_id", productId!)
          .eq("active", true);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert({ store_id: storeId!, product_id: productId!, active: true, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist-item", user?.id, storeId, productId] });
      qc.invalidateQueries({ queryKey: ["watchlist", user?.id] });
      toast.success(isWatched ? "Removed from watchlist" : "Added to watchlist");
    },
    onError: (e: Error) => {
      if (e.message === "not-auth") {
        toast.error("Sign in to save items", {
          action: { label: "Sign in", onClick: () => router.push("/auth") },
        });
      } else {
        toast.error("Couldn't update watchlist");
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
          {storeName && (
            <div className="mt-1 flex items-center gap-1.5">
              {storeLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogo} alt={storeName} className="size-4 rounded object-cover shrink-0" />
              )}
              {storeSlug ? (
                <Link
                  href={`/stores/${storeSlug}`}
                  className="font-mono text-[11px] text-brand hover:underline truncate"
                >
                  {storeName}
                </Link>
              ) : (
                <span className="font-mono text-[11px] text-brand truncate">{storeName}</span>
              )}
            </div>
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
        {canWatch && (
          <button
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
            className="size-9 border flex items-center justify-center transition-all border-ink/15 hover:bg-ink hover:border-ink hover:text-white"
          >
            <Heart className={`size-4 ${isWatched ? "fill-black stroke-black" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
