"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, stockLabel } from "@/lib/format";
import { toast } from "sonner";

interface Row {
  id: string;
  item_id: string;
  inventory_items: {
    id: string;
    title: string;
    category: string | null;
    price_cents: number;
    price_unit: string | null;
    stock_status: string;
    stock_count: number;
    stores: { name: string; slug: string };
  };
}

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const wishlist = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(
          "id, item_id, inventory_items!inner(id, title, category, price_cents, price_unit, stock_status, stock_count, stores!inner(name, slug))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast.success("Removed");
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
        {(wishlist.data ?? []).map((row) => {
          const item = row.inventory_items;
          return (
            <div key={row.id} className="p-5 flex items-center gap-5 group hover:bg-muted/40">
              <div className="size-16 bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                  {item.category}
                </p>
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  At{" "}
                  <Link
                    href={`/stores/${item.stores.slug}`}
                    className="text-brand hover:underline"
                  >
                    {item.stores.name}
                  </Link>{" "}
                  · {stockLabel(item.stock_status, item.stock_count)}
                </p>
              </div>
              <p className="font-mono text-sm font-medium">
                {formatPrice(item.price_cents, item.price_unit)}
              </p>
              <button
                onClick={() => remove.mutate(row.id)}
                aria-label="Remove"
                className="size-9 border border-ink/10 flex items-center justify-center hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
