"use client";

import { useState } from "react";

type WatcherRow = {
  product_name: string;
  active_watcher_count: number;
  total_watcher_count: number;
};

type NavItem = {
  key: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "wish-lists",     label: "Wish lists" },
  { key: "special-orders", label: "Special orders" },
  { key: "logs",           label: "Logs" },
  { key: "sales",          label: "Sales" },
];

export default function StoreAdminClient({
  watcherRows,
}: {
  watcherRows: WatcherRow[];
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <div style={{
      margin: "24px",
      border: "1px solid #d1d5db",
      display: "flex",
      minHeight: "calc(100vh - 120px)",
    }}>
      {/* Sidebar */}
      <nav style={{
        width: 180,
        borderRight: "1px solid #d1d5db",
        padding: "20px 0",
        flexShrink: 0,
      }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => setActiveKey(item.key)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 20px",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#111827" : "#6b7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Content area */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeKey === "wish-lists" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "#e5e7eb" }}>
                <th style={thStyle}>Product Name</th>
                <th style={thStyle}>Active Watcher Count</th>
                <th style={thStyle}>Total Watcher Count</th>
              </tr>
            </thead>
            <tbody>
              {watcherRows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "12px 16px", color: "#6b7280", textAlign: "center" }}>
                    No data found.
                  </td>
                </tr>
              ) : (
                watcherRows.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f3f4f6" }}>
                    <td style={tdStyle}>{row.product_name}</td>
                    <td style={tdStyle}>{row.active_watcher_count}</td>
                    <td style={tdStyle}>{row.total_watcher_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeKey === "special-orders" && (
          <div style={{ padding: 24, color: "#6b7280", fontSize: 14 }}>Special orders — coming soon.</div>
        )}
        {activeKey === "logs" && (
          <div style={{ padding: 24, color: "#6b7280", fontSize: 14 }}>Logs — coming soon.</div>
        )}
        {activeKey === "sales" && (
          <div style={{ padding: 24, color: "#6b7280", fontSize: 14 }}>Sales — coming soon.</div>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: "1px solid #d1d5db",
  borderRight: "1px solid #d1d5db",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRight: "1px solid #d1d5db",
};
