import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/app/home/UserMenu";
import StoreAdminClient from "./StoreAdminClient";

type StoreInfo = {
  store_id: number;
  store_name: string;
  url_extension: string;
};

type WatcherRow = {
  product_name: string;
  active_watcher_count: number;
  total_watcher_count: number;
};

export default async function StoreAdminPage({
  params,
}: {
  params: Promise<{ url_extension: string }>;
}) {
  const { url_extension } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = user.user_metadata?.full_name ?? user.email ?? "User";

  // Get all stores for this user to find the store_id matching this url_extension
  const { data: stores } = await supabase
    .schema("public")
    .rpc("get_user_store_info", { user_id: user.id });

  const store = (stores as StoreInfo[] | null)?.find(
    (s) => s.url_extension === url_extension
  );

  // Fetch watcher counts in parallel using the store_id
  let watcherRows: WatcherRow[] = [];
  if (store) {
    const { data } = await supabase
      .schema("my_lgs_dev")
      .rpc("get_store_product_watcher_counts", { p_store_id: store.store_id });
    if (data) watcherRows = data as WatcherRow[];
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
      {/* Navbar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid #e5e7eb",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 90, height: 64, backgroundColor: "#6b7280",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 11, fontWeight: 500,
          }}>
            myLGS logo
          </div>
          <div style={{
            width: 90, height: 64, backgroundColor: "#9ca3af",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 11, fontWeight: 500,
          }}>
            {store?.store_name ?? "store logo"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/settings" style={{ color: "#374151", lineHeight: 0 }}>
            <GearIcon />
          </Link>
          <UserMenu displayName={displayName} />
        </div>
      </header>

      {/* Sidebar + content (client component handles tab state) */}
      <StoreAdminClient watcherRows={watcherRows} />
    </div>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
