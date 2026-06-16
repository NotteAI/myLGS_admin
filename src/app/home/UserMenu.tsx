"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ displayName }: { displayName: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (!displayName) {
    return (
      <Link
        href="/login"
        style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151", fontSize: 14, textDecoration: "none" }}
      >
        <PersonIcon />
        <span>Log in</span>
      </Link>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "#374151", fontSize: 14, background: "none",
          border: "none", cursor: "pointer", padding: "4px 6px",
          borderRadius: 6,
        }}
      >
        <PersonIcon />
        <span>{displayName}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          backgroundColor: "white", border: "1px solid #d1d5db",
          borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          minWidth: 120, zIndex: 50,
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", textAlign: "left", padding: "8px 14px",
              fontSize: 14, color: "#374151", background: "none",
              border: "none", cursor: "pointer", borderRadius: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function PersonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
