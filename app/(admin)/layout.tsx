"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/events/new", label: "Yeni Etkinlik", icon: "➕" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36,
              background: "var(--accent-dim)",
              border: "1px solid rgba(79,122,255,0.3)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>📋</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                QR Yoklama
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Admin Panel</div>
            </div>
          </div>
          <div className="divider" />
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${pathname === item.href ? "active" : ""}`}>
                <span>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div>
          <div className="divider" style={{ marginBottom: 8 }} />
          <button className="nav-item" onClick={handleLogout} style={{ color: "var(--danger)" }}>
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">{children}</main>
    </div>
  );
}
