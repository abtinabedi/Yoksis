"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function deleteEvent(id: string) {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const now = new Date();
  const activeEvents = events.filter((e) => new Date(e.endsAt) >= now);
  const pastEvents = events.filter((e) => new Date(e.endsAt) < now);

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tüm etkinlikleri yönetin</p>
        </div>
        <Link href="/events/new">
          <button className="btn btn-primary">
            <span>+</span> Yeni Etkinlik
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value gradient-text">{events.length}</div>
          <div className="stat-label">Toplam Etkinlik</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--success)" }}>{activeEvents.length}</div>
          <div className="stat-label">Aktif Etkinlik</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--text-secondary)" }}>{pastEvents.length}</div>
          <div className="stat-label">Geçmiş Etkinlik</div>
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 60 }}>
          Yükleniyor...
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
            Henüz etkinlik oluşturulmadı.
          </p>
          <Link href="/events/new">
            <button className="btn btn-primary">İlk Etkinliği Oluştur</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((event) => {
            const isActive = new Date(event.endsAt) >= now && new Date(event.startsAt) <= now;
            const isUpcoming = new Date(event.startsAt) > now;
            const isPast = new Date(event.endsAt) < now;
            return (
              <div key={event.id} className="card" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 16, flexWrap: "wrap",
                borderLeft: isActive ? "3px solid var(--success)" : isPast ? "3px solid var(--text-muted)" : "3px solid var(--accent)",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{event.title}</h3>
                    {isActive && <span className="badge badge-success">🟢 Aktif</span>}
                    {isUpcoming && <span className="badge badge-info">🔵 Yaklaşan</span>}
                    {isPast && <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>Bitti</span>}
                  </div>
                  {event.description && (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                      {event.description}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    📅 {formatDate(event.startsAt)} → {formatDate(event.endsAt)}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Link href={`/events/${event.id}`}>
                    <button className="btn btn-secondary btn-sm">Yönet</button>
                  </Link>
                  <Link href={`/events/${event.id}`} target="_blank">
                    <button className="btn btn-secondary btn-sm" title="QR Ekranı">📲</button>
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteEvent(event.id)}
                    title="Sil"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
