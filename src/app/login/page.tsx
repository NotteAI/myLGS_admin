"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Logo — pinned top-left, outside the centered flow */}
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <div style={{ width: 112, height: 80, backgroundColor: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12 }}>
          myLGS Logo
        </div>
      </div>

      {/* Login modal — centered */}
      <div style={{ border: "1px solid #9ca3af", padding: "2rem 2.5rem", width: 320, backgroundColor: "#e5e7eb" }}>
          {/* Title */}
          <h1 style={{ fontSize: "1.875rem", textAlign: "center", marginBottom: "1.5rem", letterSpacing: "0.025em" }}>MyLGS</h1>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email / username */}
            <div className="border border-gray-400 flex items-center px-3 py-2 gap-2">
              <PersonIcon />
              <input
                type="email"
                placeholder="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="flex-1 text-sm outline-none placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="border border-gray-400 flex items-center px-3 py-2 gap-2">
              <LockIcon />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="flex-1 text-sm outline-none placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}

            {/* Remember username toggle */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={rememberUsername}
                onClick={() => setRememberUsername((v) => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none ${
                  rememberUsername ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    rememberUsername ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-blue-500 text-sm">remember username</span>
            </div>

            {/* Forgot link */}
            <div className="pt-1">
              <button
                type="button"
                className="text-blue-500 text-sm flex items-center gap-1 hover:underline"
                onClick={() => undefined}
              >
                Forgot username/password?
                <ChevronRightIcon />
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
