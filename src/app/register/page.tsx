"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  border: "1px solid #6b7280",
  padding: "4px 8px",
  fontSize: 14,
  width: 220,
  backgroundColor: "white",
  outline: "none",
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  // Store dropdown state
  const [stores, setStores] = useState<{ id: number; name: string }[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [dropdownValue, setDropdownValue] = useState(""); // store name | "other" | ""
  const [customStoreName, setCustomStoreName] = useState("");

  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .schema(process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public")
      .from("stores")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        setStores(data ?? []);
        setStoresLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== rePassword) {
      setError("Passwords do not match.");
      return;
    }
    const storeName = dropdownValue === "other" ? customStoreName : dropdownValue;
    if (!storeName) {
      setError("Please select or enter a store name.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          store_name: storeName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ border: "1px solid #9ca3af", padding: "2rem 3rem 2.5rem", backgroundColor: "#e5e7eb", width: 560 }}>

        {/* Header — 3-column so Back and title don't overlap */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1.75rem" }}>
          <div style={{ flex: 1 }}>
            <button
              type="button"
              onClick={() => router.push("/login")}
              style={{ display: "flex", alignItems: "center", gap: 2, color: "#374151", fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <ChevronLeftIcon />
              Back
            </button>
          </div>
          <h1 style={{ flex: 0, fontSize: "1.875rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap" }}>New User</h1>
          <div style={{ flex: 1 }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <FormRow label="First Name" required>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </FormRow>

            <FormRow label="Last Name" required>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </FormRow>

            <FormRow label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                style={inputStyle}
              />
            </FormRow>

            <FormRow
              label="Store Name"
              required
              tooltip="The name of your registered store on your FFL 07"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <select
                  value={dropdownValue}
                  onChange={(e) => {
                    setDropdownValue(e.target.value);
                    setCustomStoreName("");
                  }}
                  required
                  disabled={loading || storesLoading}
                  style={{ ...inputStyle, width: 220, cursor: "pointer" }}
                >
                  <option value="">
                    {storesLoading ? "Loading..." : "Select a store"}
                  </option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>

                {dropdownValue === "other" && (
                  <input
                    type="text"
                    placeholder="Enter store name"
                    value={customStoreName}
                    onChange={(e) => setCustomStoreName(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                    style={inputStyle}
                  />
                )}
              </div>
            </FormRow>

            <FormRow label="Password" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                style={inputStyle}
              />
            </FormRow>

            <FormRow label="Re-Enter Password" required>
              <input
                type="password"
                value={rePassword}
                onChange={(e) => setRePassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                style={inputStyle}
              />
            </FormRow>

          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{error}</p>
          )}

          {/* Submit */}
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

// ---- Sub-components ----

function FormRow({
  label,
  required,
  tooltip,
  children,
}: {
  label: string;
  required?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Label side */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 180, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 14, color: "#111827" }}>
          {label}
          {required && <span style={{ color: "#ef4444", marginLeft: 1 }}>*</span>}
        </span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {/* Input side */}
      {children}
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
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1px solid #6b7280",
          backgroundColor: "transparent",
          cursor: "help",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "#6b7280",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        ?
      </span>
      <span
        className="tooltip-bubble"
        style={{
          position: "absolute",
          left: 24,
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: "white",
          border: "1px solid #d1d5db",
          padding: "8px 10px",
          borderRadius: 4,
          width: 160,
          fontSize: 12,
          color: "#374151",
          zIndex: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          pointerEvents: "none",
          whiteSpace: "normal",
        }}
      >
        {text}
      </span>
    </span>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
