"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "⊞" },
  { href: "/training", label: "Trénink", icon: "◈" },
  { href: "/food", label: "Jídlo", icon: "◉" },
  { href: "/settings", label: "Nastavení", icon: "◎" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(13,15,18,0.92)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-around",
        padding: "0.6rem 0 calc(0.6rem + env(safe-area-inset-bottom))",
        zIndex: 50,
      }}
    >
      {links.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
              textDecoration: "none",
              color: active ? "var(--accent)" : "var(--muted)",
              transition: "color 0.15s",
              minWidth: 60,
            }}
          >
            <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>{l.icon}</span>
            <span
              style={{
                fontSize: "0.68rem",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {l.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
