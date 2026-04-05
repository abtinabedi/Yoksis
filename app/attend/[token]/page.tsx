"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// html5-qrcode client-only
const QrScanner = dynamic(() => import("@/components/attend/QrScanner"), {
  ssr: false,
  loading: () => (
    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
      Kamera yükleniyor...
    </div>
  ),
});

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

type Status = "idle" | "scanning" | "locating" | "form" | "submitting" | "success" | "error";

export default function AttendPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: eventId } = use(params);
  const searchParams = useSearchParams();
  const qrToken = searchParams.get("t") || "";

  const [event, setEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [successMsg, setSuccessMsg] = useState("");
  const [scannedToken, setScannedToken] = useState(qrToken);
  const [scannedEventId, setScannedEventId] = useState(eventId);
  const [submitting, setSubmitting] = useState(false);

  // Load event info
  useEffect(() => {
    if (eventId) {
      fetch(`/api/events/${eventId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.id) setEvent(data);
        })
        .catch(() => {});
    }
  }, [eventId]);

  // If QR token already in URL → go straight to locating
  useEffect(() => {
    if (qrToken && eventId) {
      startProcess(eventId, qrToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScan(result: string) {
    // Parse URL from QR scan
    try {
      const url = new URL(result);
      const pathParts = url.pathname.split("/");
      const scannedId = pathParts[pathParts.length - 1];
      const t = url.searchParams.get("t") || "";
      setScannedEventId(scannedId);
      setScannedToken(t);
      startProcess(scannedId, t);
    } catch {
      setErrorMsg("Geçersiz QR kod. Lütfen etkinliğe ait QR kodu okutun.");
      setStatus("error");
    }
  }

  async function startProcess(evId: string, token: string) {
    setStatus("locating");
    setErrorMsg("");

    // Get location
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          timeout: 15000,
          enableHighAccuracy: true,
        })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      setLocation({ lat, lng });
    } catch {
      // Konum alınamazsa sunucu kontrol edecek
    }

    // Check if registered (via email — show form first)
    setStatus("form");
    setScannedEventId(evId);
    setScannedToken(token);
    if (lat) setLocation({ lat: lat!, lng: lng! });
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: scannedEventId,
          token: scannedToken,
          lat: location?.lat,
          lng: location?.lng,
          name: form.name || null,
          email: form.email || null,
          phone: form.phone || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Katılımınız kaydedildi!");
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Bir hata oluştu.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStatus("scanning");
    setErrorMsg("");
    setForm({ name: "", email: "", phone: "" });
    setLocation(null);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, rgba(79,122,255,0.1) 0%, transparent 60%), var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {event?.title || "QR Yoklama"}
          </h1>
          {event && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {new Date(event.startsAt).toLocaleString("tr-TR", {
                day: "2-digit", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* IDLE — scan button */}
        {status === "idle" && !qrToken && (
          <div className="card fade-in-up" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: 14 }}>
              Etkinliğe katılmak için QR kodu okutun
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", height: 52, fontSize: 16 }}
              onClick={() => setStatus("scanning")}
            >
              📷 QR Kod Okut
            </button>
          </div>
        )}

        {/* SCANNING */}
        {status === "scanning" && (
          <div className="card fade-in-up">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
              Kamerayı QR Koda Tutun
            </h2>
            <QrScanner onScan={handleScan} />
            <button
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => setStatus("idle")}
            >
              İptal
            </button>
          </div>
        )}

        {/* LOCATING */}
        {status === "locating" && (
          <div className="card fade-in-up" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📍</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Konumunuz alınıyor...</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
              Lütfen bekleyin
            </p>
          </div>
        )}

        {/* FORM */}
        {status === "form" && (
          <div className="card fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Katılım Bilgileri</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Katılım kaydınızı oluşturmak için bilgilerinizi girin
            </p>

            {location && (
              <div className="alert alert-success" style={{ marginBottom: 16, fontSize: 13 }}>
                ✓ Konumunuz alındı
              </div>
            )}
            {!location && (
              <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: 13 }}>
                ⚠️ Konum alınamadı — etkinlikte konum doğrulaması aktifse katılım reddedilebilir
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-field">
                <label>Ad Soyad *</label>
                <input
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Katılımcı listesindeki adınızı tam olarak yazın
                </span>
              </div>

              <div className="form-field">
                <label>E-posta</label>
                <input
                  type="email"
                  placeholder="ahmet@ornek.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label>Telefon</label>
                <input
                  type="tel"
                  placeholder="05xx xxx xx xx"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: 52, fontSize: 15, marginTop: 4 }}
                disabled={submitting}
              >
                ✓ Katılımı Onayla
              </button>
            </form>
          </div>
        )}

        {/* SUBMITTING */}
        {status === "submitting" && (
          <div className="card fade-in-up" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Kaydediliyor...</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="card fade-in-up" style={{ textAlign: "center", padding: 40 }}>
            <div style={{
              width: 72, height: 72,
              background: "var(--success-dim)",
              border: "2px solid var(--success)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 20px",
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--success)", marginBottom: 8 }}>
              Katılımınız Kaydedildi!
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{successMsg}</p>
            {event && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16 }}>
                {event.title}
              </p>
            )}
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="card fade-in-up" style={{ textAlign: "center", padding: 40 }}>
            <div style={{
              width: 72, height: 72,
              background: "var(--danger-dim)",
              border: "2px solid var(--danger)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 20px",
            }}>
              ✗
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--danger)", marginBottom: 12 }}>
              Hata
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              {errorMsg}
            </p>
            <button className="btn btn-secondary" onClick={reset} style={{ width: "100%" }}>
              ← Tekrar Dene
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
