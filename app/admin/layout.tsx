"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "" },
  { href: "/admin/events/new", label: "Yeni Etkinlik", icon: "" },
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
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Image src="/Logo.png" alt="Logo" width={56} height={56} style={{ objectFit: "contain" }} />
            </div>
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
             Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile Nav */}
        <div className="mobile-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/Logo.png" alt="Logo" width={32} height={32} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>QR Yoklama</span>
          </div>
          <div className="mobile-nav-menu">
            <Link href="/admin/dashboard" className="btn btn-secondary btn-sm" style={{ padding: "0 10px" }}>Dashboard</Link>
            <Link href="/admin/events/new" className="btn btn-primary btn-sm" style={{ padding: "0 10px" }}>Yeni</Link>
            <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ padding: "0 10px" }}>Çıkış</button>
          </div>
        </div>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
