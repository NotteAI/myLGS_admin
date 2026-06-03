"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const baseInputStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 14,
  width: 220,
  backgroundColor: "white",
  outline: "none",
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return { ...baseInputStyle, border: `1px solid ${hasError ? "#ef4444" : "#6b7280"}` };
}

export default function RegisterPage() {
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [rePassword, setRePassword] = useState("");

  // Store typeahead
  const [stores, setStores]               = useState<{ id: number; name: string }[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storeInput, setStoreInput]       = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const storeWrapperRef = useRef<HTMLDivElement>(null);

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  // Fetch stores
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("stores")
          .select("id, name")
          .order("name");
        setStores(data ?? []);
      } catch {
        // Fetch failed — user can still type freely
      } finally {
        setStoresLoading(false);
      }
    })();
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (storeWrapperRef.current && !storeWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered suggestions based on current input
  const suggestions = storeInput.trim()
    ? stores.filter((s) => s.name.toLowerCase().includes(storeInput.toLowerCase()))
    : stores;

  function clearError(field: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: false }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const storeName = storeInput.trim();

    const errors: Record<string, boolean> = {
      firstName:  !firstName.trim(),
      lastName:   !lastName.trim(),
      email:      !email.trim(),
      storeName:  !storeName || selectedStoreId === null,
      password:   !password.trim(),
      rePassword: !rePassword.trim(),
    };

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    if (password !== rePassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://yourdomain.com/auth/callback',
        data: {
          first_name: firstName,
          last_name:  lastName,
          store_id:   selectedStoreId,
        },
      },
    });

    if (error) {
      setSubmitError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ border: "1px solid #9ca3af", padding: "2.5rem 3rem", backgroundColor: "#e5e7eb", textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>Check your email</h2>
          <p style={{ fontSize: 14, color: "#374151", marginBottom: "1.5rem" }}>
            We sent a confirmation link to <strong>{email}</strong>. Please verify your email before logging in.
          </p>
          <button
            onClick={() => router.push("/login")}
            style={{ backgroundColor: "#3b82f6", color: "white", border: "none", padding: "8px 24px", borderRadius: 4, fontSize: 14, cursor: "pointer" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ border: "1px solid #9ca3af", padding: "2rem 3rem 2.5rem", backgroundColor: "#e5e7eb", width: 560 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1.75rem" }}>
          <div style={{ flex: 1 }}>
            <Link
              href="/login"
              style={{ display: "flex", alignItems: "center", gap: 2, color: "#374151", fontSize: 14, textDecoration: "none" }}
            >
              <ChevronLeftIcon />
              Back
            </Link>
          </div>
          <h1 style={{ flex: 0, fontSize: "1.875rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap" }}>New User</h1>
          <div style={{ flex: 1 }} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* First Name */}
            <FormRow label="First Name" required hasError={fieldErrors.firstName}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                disabled={loading}
                style={inputStyle(!!fieldErrors.firstName)}
              />
            </FormRow>

            {/* Last Name */}
            <FormRow label="Last Name" required hasError={fieldErrors.lastName}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                disabled={loading}
                style={inputStyle(!!fieldErrors.lastName)}
              />
            </FormRow>

            {/* Email */}
            <FormRow label="Email" required hasError={fieldErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                disabled={loading}
                autoComplete="email"
                style={inputStyle(!!fieldErrors.email)}
              />
            </FormRow>

            {/* Store Name — typeahead */}
            <FormRow
              label="Store Name"
              required
              tooltip="The name of your registered store on your FFL 07"
              hasError={fieldErrors.storeName}
            >
              <div ref={storeWrapperRef} style={{ position: "relative", width: 220 }}>
                <input
                  type="text"
                  value={storeInput}
                  onChange={(e) => {
                    setStoreInput(e.target.value);
                    setSelectedStoreId(null);
                    setShowSuggestions(true);
                    clearError("storeName");
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  disabled={loading || storesLoading}
                  placeholder={storesLoading ? "Loading..." : "Search stores…"}
                  style={{ ...inputStyle(!!fieldErrors.storeName), width: "100%", boxSizing: "border-box" }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    backgroundColor: "white",
                    border: "1px solid #9ca3af",
                    borderTop: "none",
                    zIndex: 20,
                    maxHeight: 180,
                    overflowY: "auto",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                  }}>
                    {suggestions.map((s) => (
                      <div
                        key={s.id}
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep input focused until selection
                          setStoreInput(s.name);
                          setSelectedStoreId(s.id);
                          setShowSuggestions(false);
                          clearError("storeName");
                        }}
                        style={{ padding: "6px 10px", fontSize: 14, cursor: "pointer", backgroundColor: "white" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}

                {showSuggestions && storeInput.trim() && suggestions.length === 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    backgroundColor: "white",
                    border: "1px solid #9ca3af",
                    borderTop: "none",
                    padding: "6px 10px",
                    fontSize: 13,
                    color: "#6b7280",
                  }}>
                    No matching stores
                  </div>
                )}
              </div>
            </FormRow>

            {/* Password */}
            <FormRow label="Password" required hasError={fieldErrors.password}>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError("password"); setSubmitError(""); }}
                disabled={loading}
                autoComplete="new-password"
                style={inputStyle(!!fieldErrors.password)}
              />
            </FormRow>

            {/* Re-Enter Password */}
            <FormRow label="Re-Enter Password" required hasError={fieldErrors.rePassword}>
              <input
                type="password"
                value={rePassword}
                onChange={(e) => { setRePassword(e.target.value); clearError("rePassword"); setSubmitError(""); }}
                disabled={loading}
                autoComplete="new-password"
                style={inputStyle(!!fieldErrors.rePassword)}
              />
            </FormRow>

          </div>

          {submitError && (
            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{submitError}</p>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                padding: "8px 32px",
                borderRadius: 4,
                fontSize: 15,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit!"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FormRow({
  label,
  required,
  tooltip,
  hasError,
  children,
}: {
  label: string;
  required?: boolean;
  tooltip?: string;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 180, justifyContent: "flex-end", paddingTop: 5 }}>
        <span style={{ fontSize: 14, color: hasError ? "#ef4444" : "#111827" }}>
          {label}
          {required && <span style={{ color: "#ef4444", marginLeft: 1 }}>*</span>}
        </span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
        {hasError && (
          <span style={{ color: "#ef4444", fontSize: 12 }}>Field missing input</span>
        )}
      </div>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex" }} className="tooltip-anchor">
      <style>{`
        .tooltip-anchor .tooltip-bubble { display: none; }
        .tooltip-anchor:hover .tooltip-bubble { display: block; }
      `}</style>
      <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid #6b7280", backgroundColor: "transparent", cursor: "help", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#6b7280", flexShrink: 0, userSelect: "none" }}>
        ?
      </span>
      <span className="tooltip-bubble" style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", backgroundColor: "white", border: "1px solid #d1d5db", padding: "8px 10px", borderRadius: 4, width: 160, fontSize: 12, color: "#374151", zIndex: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.1)", pointerEvents: "none", whiteSpace: "normal" }}>
        {text}
      </span>
    </span>
  );
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
