import type { CSSProperties, ReactNode } from "react";

export const card: CSSProperties = {
  border: "1px solid #e4e4e7",
  borderRadius: 10,
  padding: "1.25rem",
  background: "#fff",
};

export const btn: CSSProperties = {
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0.5rem 1rem",
  fontWeight: 600,
  cursor: "pointer",
};

export const ghostBtn: CSSProperties = {
  ...btn,
  background: "transparent",
  color: "#4f46e5",
  border: "1px solid #4f46e5",
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "amber" | "red" }) {
  const colors = {
    gray: ["#f4f4f5", "#3f3f46"],
    green: ["#dcfce7", "#166534"],
    amber: ["#fef3c7", "#92400e"],
    red: ["#fee2e2", "#991b1b"],
  }[tone];
  return (
    <span style={{ background: colors[0], color: colors[1], borderRadius: 999, padding: "0.15rem 0.6rem", fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

export function GateBanner({ title, detail, ctaHref, ctaLabel }: { title: string; detail: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div style={{ ...card, borderColor: "#f59e0b", background: "#fffbeb", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div>
        <strong>🔒 {title}</strong>
        <p style={{ margin: "0.25rem 0 0", color: "#92400e", fontSize: 14 }}>{detail}</p>
      </div>
      <a href={ctaHref} style={{ ...btn, textDecoration: "none", whiteSpace: "nowrap" }}>{ctaLabel}</a>
    </div>
  );
}
