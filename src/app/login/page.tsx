"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberUsername, setRememberUsername] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("rememberedUsername");
    if (saved) setEmail(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect username or password.");
      setLoading(false);
    } else {
      if (rememberUsername) {
        localStorage.setItem("rememberedUsername", email);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
      router.push("/home");
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>

      {/* Logo — pinned top-left */}
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <div style={{ width: 112, height: 80, backgroundColor: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12 }}>
          myLGS Logo
        </div>
      </div>

      {/* Login modal — centered */}
      <div style={{ border: "1px solid #9ca3af", padding: "2rem 2.5rem", width: 320, backgroundColor: "#e5e7eb" }}>

        {/* Title */}
        <h1 style={{ fontSize: "1.875rem", textAlign: "center", marginBottom: "1.5rem", letterSpacing: "0.025em", fontWeight: 600, margin: "0 0 1.5rem 0" }}>
          MyLGS
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Email / username */}
          <div style={{ border: "1px solid #9ca3af", display: "flex", alignItems: "center", padding: "6px 10px", gap: 8, backgroundColor: "white" }}>
            <PersonIcon />
            <input
              type="email"
              placeholder="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              style={{ flex: 1, fontSize: 14, outline: "none", border: "none", background: "transparent", opacity: loading ? 0.5 : 1 }}
            />
          </div>

          {/* Password */}
          <div style={{ border: "1px solid #9ca3af", display: "flex", alignItems: "center", padding: "6px 10px", gap: 8, backgroundColor: "white" }}>
            <LockIcon />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              style={{ flex: 1, fontSize: 14, outline: "none", border: "none", background: "transparent", opacity: loading ? 0.5 : 1 }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{error}</p>
          )}

          {/* Remember username toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              role="switch"
              aria-checked={rememberUsername}
              onClick={() => setRememberUsername((v) => !v)}
              style={{
                position: "relative",
                width: 40,
                height: 24,
                borderRadius: 12,
                border: "none",
                backgroundColor: rememberUsername ? "#3b82f6" : "#d1d5db",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                transition: "background-color 0.2s",
              }}
            >
              <span style={{
                position: "absolute",
                top: 2,
                left: rememberUsername ? 18 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }} />
            </button>
            <span style={{ color: "#3b82f6", fontSize: 14 }}>remember username</span>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "10px",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? "Logging in…" : "Log in!"}
          </button>

          {/* Forgot link */}
          <button
            type="button"
            onClick={() => undefined}
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#3b82f6", fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}
          >
            Forgot username/password?
            <ChevronRightIcon />
          </button>

          {/* Register link */}
          <Link
            href="/register"
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#3b82f6", fontSize: 14, textDecoration: "none" }}
          >
            Register Now!
            <ChevronRightIcon />
          </Link>

        </form>
      </div>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
