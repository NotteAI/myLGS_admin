"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import { stockLabel } from "@/lib/format";
import { toast } from "sonner";

interface Row {
  store_id: number;
  product_id: number;
  product_name: string;
  store_name: string;
  price: number;
  image_url: string | null;
  inventory_count: number;
}

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const wishlist = useQuery({
    queryKey: ["watchlist-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: watchRows, error: watchError } = await supabase
        .from("watchlist")
        .select("store_id, product_id")
        .eq("active", true);
      if (watchError) throw watchError;
      if (!watchRows || watchRows.length === 0) return [];

      const watchedSet = new Set(watchRows.map((r) => `${r.store_id}-${r.product_id}`));

      const { data: recent, error: recentError } = await supabase.rpc("get_recent_inventory", {});
      if (recentError) throw recentError;

      return (recent ?? [])
        .filter((i: { store_id: number; product_id: number }) =>
          watchedSet.has(`${i.store_id}-${i.product_id}`),
        ) as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async ({ store_id, product_id }: { store_id: number; product_id: number }) => {
      const { error } = await supabase
        .from("watchlist")
        .update({ active: false })
        .eq("store_id", store_id)
        .eq("product_id", product_id)
        .eq("active", true);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist-page", user?.id] });
      toast.success("Removed from watchlist");
    },
  });

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="text-muted-foreground">
          <Link href="/auth?redirect=/wishlist" className="underline hover:text-brand">
            Sign in
          </Link>{" "}
          to view your wishlist.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 border-b border-ink pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
          [ Your Saved Items ]
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Items you&apos;ve saved from shops across the network.
        </p>
      </div>

      {wishlist.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {wishlist.data && wishlist.data.length === 0 && (
        <div className="border border-dashed border-ink/20 py-16 text-center">
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Link
            href="/stores"
            className="mt-4 inline-block font-mono text-xs uppercase underline hover:text-brand"
          >
            Browse shops
          </Link>
        </div>
      )}

      <div className="border border-ink/10 divide-y divide-ink/10 bg-card">
        {(Array.isArray(wishlist.data) ? wishlist.data : []).map((row) => (
          <div
            key={`${row.store_id}-${row.product_id}`}
            className="p-5 flex items-center gap-5 group hover:bg-muted/40"
          >
            {row.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.image_url}
                alt={row.product_name}
                className="size-16 object-cover flex-shrink-0"
              />
            ) : (
              <div className="size-16 bg-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{row.product_name}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                At <span className="text-brand">{row.store_name}</span>{" "}
                · {stockLabel(row.inventory_count > 0 ? "in_stock" : "out_of_stock", row.inventory_count)}
              </p>
            </div>
            <p className="font-mono text-sm font-medium">
              ${row.price.toFixed(2)}
            </p>
            <button
              onClick={() => remove.mutate({ store_id: row.store_id, product_id: row.product_id })}
              aria-label="Remove"
              className="size-9 border border-ink/10 flex items-center justify-center hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
