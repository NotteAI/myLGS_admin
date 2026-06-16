import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UserMenu from "./UserMenu";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName = user ? (user.user_metadata?.full_name ?? user.email ?? "User") : null;
  const storeName = user?.user_metadata?.store_name as string | undefined;

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
        {/* Logos */}
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
            {storeName ? storeName : "store logo"}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right-side controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/settings" style={{ color: "#374151", lineHeight: 0 }}>
            <GearIcon />
          </Link>
          <UserMenu displayName={displayName} />
        </div>
      </header>

      {/* Main content */}
      <main style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 90px)",
      }}>
        <Link href="/dashboard" style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "0.1em", color: "#111827", textDecoration: "none" }}>
          DASHBOARD
        </Link>
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
