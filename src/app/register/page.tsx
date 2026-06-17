"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Logo = ({ dark }: { dark?: boolean }) => (
  <svg width={dark ? 120 : 100} viewBox="0 0 680 250" role="img" xmlns="http://www.w3.org/2000/svg">
    <circle cx="155" cy="122" r="64" strokeWidth="1.5" fill="none" stroke={dark ? "#555555" : "#cccccc"} />
    <path d="M142,75 L144.8,89 L144.8,99 L146.5,111 L146.5,164 L147.5,164 L147.5,168 L136.5,168 L136.5,164 L137.5,164 L137.5,111 L139.2,99 L139.2,89 Z" fill="#b89030" />
    <path d="M155,75 L157.8,89 L157.8,99 L159.5,111 L159.5,164 L160.5,164 L160.5,168 L149.5,168 L149.5,164 L150.5,164 L150.5,111 L152.2,99 L152.2,89 Z" fill="#b89030" />
    <path d="M168,75 L170.8,89 L170.8,99 L172.5,111 L172.5,164 L173.5,164 L173.5,168 L162.5,168 L162.5,164 L163.5,164 L163.5,111 L165.2,99 L165.2,89 Z" fill="#b89030" />
    <line x1="252" y1="62" x2="252" y2="185" strokeWidth="1" stroke={dark ? "#666666" : "#444444"} />
    <text x="278" y="97" fontSize="15" fontWeight="300" fontFamily="var(--font-sans,Arial,sans-serif)" fill="#888888">my</text>
    <line x1="278" y1="109" x2="448" y2="109" strokeWidth="1" stroke="#b89030" />
    <text x="271" y="186" fontSize="90" fontWeight="700" fontFamily="var(--font-sans,Arial,sans-serif)" fill={dark ? "#ffffff" : "#1a1a1a"}>LGS</text>
  </svg>
);

export default function RegisterPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Shared fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [rePassword, setRePassword] = useState("");

  const [loading, setLoading] = useState(false);
  const rePasswordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRePassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        router.push("/");
        router.refresh();
      } else {
        if (password !== rePassword) {
          rePasswordRef.current?.setCustomValidity("Passwords do not match.");
          rePasswordRef.current?.reportValidity();
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
        router.push("/");
      }
    } catch (err) {
      console.error("[register] auth error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const leftText = mode === "signin"
    ? "Sign in to place special orders, be notified of restocks, and customize your experience."
    : "Create an account to place special orders, be notified of restocks, and customize your experience.";

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12">
        <Link href="/" aria-label="my LGS home"><Logo dark /></Link>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-4">
            [ Local · In-Store · Real Stock ]
          </p>
          <h2 className="text-4xl font-bold leading-tight max-w-md">{leftText}</h2>
        </div>
        <p className="font-mono text-xs text-white/40">Edition 2026 · Independent retail</p>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block mb-12" aria-label="my LGS home">
            <Logo />
          </Link>

          <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
            [ {mode === "signin" ? "Returning" : "New Account"} ]
          </p>
          <h1 className="text-3xl font-bold mb-8">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="rePassword">Confirm Password</Label>
                <Input
                  id="rePassword"
                  type="password"
                  required
                  ref={rePasswordRef}
                  value={rePassword}
                  onChange={(e) => {
                    rePasswordRef.current?.setCustomValidity("");
                    setRePassword(e.target.value);
                  }}
                  placeholder="Re-enter your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-ink text-white font-semibold text-sm hover:bg-brand transition-colors disabled:opacity-50"
            >
              {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-ink underline hover:text-brand"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
