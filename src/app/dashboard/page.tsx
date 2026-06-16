import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/app/home/UserMenu";

type StoreInfo = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  store_id: number;
  store_name: string;
  url_extension: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = user.user_metadata?.full_name ?? user.email ?? "User";

  const { data: stores, error } = await supabase
    .schema("public")
    .rpc("get_user_store_info", { user_id: user.id });

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
            store logo
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

      {/* Main content */}
      <main style={{ padding: "32px 40px" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 20 }}>
          My Stores
        </h2>

        {error && (
          <p style={{ color: "#ef4444", fontSize: 14 }}>
            Failed to load stores: {error.message}
          </p>
        )}

        {!error && (!stores || stores.length === 0) && (
          <p style={{ color: "#6b7280", fontSize: 14 }}>No stores found.</p>
        )}

        {!error && stores && stores.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {(stores as StoreInfo[]).map((store) => (
              <li key={store.store_id}>
                <Link
                  href={`/admin/${store.url_extension}`}
                  style={{ fontSize: 14, color: "#3b82f6", textDecoration: "none" }}
                >
                  {store.store_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
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
