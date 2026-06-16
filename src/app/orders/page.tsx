"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";

interface OrderRow {
  id: string;
  item_name: string;
  details: string | null;
  status: string;
  created_at: string;
  stores: { name: string; slug: string };
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-cement text-ink",
  accepted: "bg-brand text-white",
  fulfilled: "bg-success text-white",
  declined: "bg-destructive text-white",
};

export default function OrdersPage() {
  const { user, loading } = useAuth();

  const orders = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("special_orders")
        .select("id, item_name, details, status, created_at, stores!inner(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="text-muted-foreground">
          <Link href="/auth?redirect=/orders" className="underline hover:text-brand">
            Sign in
          </Link>{" "}
          to view your orders.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 border-b border-ink pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
          [ Special Orders ]
        </p>
        <h1 className="text-4xl font-bold tracking-tight">My Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Requests you&apos;ve sent to local shops, with their current status.
        </p>
      </div>

      {orders.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {orders.data && orders.data.length === 0 && (
        <div className="border border-dashed border-ink/20 py-16 text-center">
          <p className="text-muted-foreground">You haven&apos;t submitted any special orders yet.</p>
          <Link
            href="/stores"
            className="mt-4 inline-block font-mono text-xs uppercase underline hover:text-brand"
          >
            Find a shop
          </Link>
        </div>
      )}

      <div className="border border-ink/10 divide-y divide-ink/10 bg-card">
        {(orders.data ?? []).map((o) => (
          <div key={o.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                  {new Date(o.created_at).toLocaleDateString()} · at{" "}
                  <Link
                    href={`/stores/${o.stores.slug}`}
                    className="text-brand hover:underline"
                  >
                    {o.stores.name}
                  </Link>
                </p>
                <h3 className="mt-1 font-semibold">{o.item_name}</h3>
                {o.details && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{o.details}</p>
                )}
              </div>
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${
                  STATUS_TONE[o.status] ?? "bg-cement text-ink"
                }`}
              >
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
