"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  locationLat: number | null;
  locationLng: number | null;
  locationRadiusM: number | null;
}

interface Attendance {
  id: string;
  participantId: string | null;
  name: string;
  email: string | null;
  checkedInAt: string;
  isRegistered: boolean;
  isManual: boolean;
}

interface QrData {
  qrDataUrl: string;
  attendUrl: string;
  secondsUntilRefresh: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type Tab = "qr" | "attendance";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("qr");
  const [event, setEvent] = useState<Event | null>(null);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrUrl, setShowQrUrl] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => { setEvent(data); setLoading(false); });
  }, [id]);

  const refreshQr = useCallback(() => {
    fetch(`/api/events/${id}/qr`)
      .then((r) => r.json())
      .then((data) => {
        setQrData(data);
        setCountdown(data.secondsUntilRefresh);
      });
  }, [id]);

  useEffect(() => {
    if (tab === "qr") refreshQr();
  }, [tab, refreshQr]);

  useEffect(() => {
    if (tab !== "qr") return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { refreshQr(); return 60; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tab, refreshQr]);

  useEffect(() => {
    if (tab === "attendance") {
      fetch(`/api/events/${id}/attendance`)
        .then((r) => r.json())
        .then(setAttendances);
    }
  }, [tab, id]);

  async function removeAttendance(attendanceId: string) {
    await fetch(`/api/events/${id}/attendance`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId }),
    });
    setAttendances((prev) => prev.filter((a) => a.id !== attendanceId));
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Yükleniyor...</div>;
  }

  if (!event) {
    return <div className="alert alert-danger">Etkinlik bulunamadı.</div>;
  }

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13 }}>
            ← Dashboard
          </Link>
          <h1 className="page-title" style={{ marginTop: 4 }}>{event.title}</h1>
          <p className="page-subtitle">
            📅 {formatDate(event.startsAt)} — {formatDate(event.endsAt)}
            {event.locationLat && (
              <span style={{ marginLeft: 12 }}>📍 Konum doğrulaması aktif ({event.locationRadiusM}m)</span>
            )}
          </p>
        </div>
        <a href={`/attend/${id}`} target="_blank" className="btn btn-secondary">
          🔗 Katılım Linki
        </a>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 4,
        marginBottom: 24,
        width: "fit-content",
      }}>
        {(["qr", "attendance"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn"
            style={{
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#fff" : "var(--text-secondary)",
              height: 36, fontSize: 13,
              boxShadow: tab === t ? "0 0 16px var(--accent-glow)" : "none",
            }}
          >
            {t === "qr" && "📲 QR Kod"}
            {t === "attendance" && `✅ Yoklama (${attendances.length})`}
          </button>
        ))}
      </div>

      {/* QR TAB */}
      {tab === "qr" && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="card" style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>QR Kod</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Her dakika otomatik yenilenir</p>
            </div>

            {qrData ? (
              <>
                <div className="qr-container" style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", top: -8, right: -8,
                    width: 40, height: 40,
                    background: "var(--bg-card)",
                    border: "2px solid var(--border)",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: countdown <= 10 ? "var(--danger)" : "var(--accent)",
                    zIndex: 10,
                  }}>
                    {countdown}s
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrData.qrDataUrl} alt="QR Kod" style={{ width: 280, height: 280 }} />
                </div>

                <div style={{ width: "100%", background: "var(--bg-elevated)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(countdown / 60) * 100}%`,
                    background: countdown <= 10 ? "var(--danger)" : "var(--accent)",
                    transition: "width 1s linear, background 0.3s",
                    borderRadius: 4,
                  }} />
                </div>

                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowQrUrl(!showQrUrl)}>
                    {showQrUrl ? "🔒 URL'i Gizle" : "🔗 Katılım URL'ini Göster"}
                  </button>
                  {showQrUrl && (
                    <div style={{
                      background: "var(--bg-elevated)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      wordBreak: "break-all",
                      border: "1px solid var(--border)",
                    }}>
                      {qrData.attendUrl}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>QR kod yükleniyor...</div>
            )}
          </div>

          <div className="card" style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Nasıl Çalışır?</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📱", title: "QR Okut", desc: "Katılımcılar telefon kamerasıyla bu QR kodu okutur" },
                { icon: "📍", title: "Konum Doğrula", desc: event.locationLat ? `Etkinlik alanında (${event.locationRadiusM}m) olması gerekiyor` : "Konum doğrulaması devre dışı" },
                { icon: "✅", title: "Otomatik Kayıt", desc: "Katılım bilgileri anında sisteme işlenir" },
                { icon: "🔄", title: "Her dakika yenilenir", desc: "Güvenlik için QR kod 60 saniyede bir değişir" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: "var(--bg-elevated)",
                    borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {tab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Toplam <strong style={{ color: "var(--text-primary)" }}>{attendances.length}</strong> katılım kaydı
              </span>
            </div>
            <a href={`/api/events/${id}/export`} className="btn btn-success btn-sm">
              📊 Excel İndir
            </a>
          </div>

          {attendances.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
              Henüz yoklama kaydı yok. Katılımcılar QR kodu okutunca burada görünür.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ad Soyad</th>
                    <th>E-posta</th>
                    <th>Katılım Zamanı</th>
                    <th>Tür</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a, i) => (
                    <tr key={a.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{a.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{a.email || "-"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{formatDate(a.checkedInAt)}</td>
                      <td>
                        {a.isManual
                          ? <span className="badge badge-warning">Manuel</span>
                          : a.isRegistered
                          ? <span className="badge badge-success">Kayıtlı</span>
                          : <span className="badge badge-info">Walk-in</span>
                        }
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => removeAttendance(a.id)}>
                          Kaldır
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
