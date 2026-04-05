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

type Status = "idle" | "scanning" | "locating" | "ready" | "submitting" | "success" | "error";

interface Session {
  userId: number;
  email: string;
  name: string;
  role: string;
}

export default function AttendPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: eventId } = use(params);
  const searchParams = useSearchParams();
  const qrToken = searchParams.get("t") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [event, setEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [scannedToken, setScannedToken] = useState(qrToken);
  const [scannedEventId, setScannedEventId] = useState(eventId);
  const [submitting, setSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  // Oturumu getir
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setSession(data.user);
      })
      .finally(() => setSessionLoading(false));
  }, []);

  // Cihaz ID'sini oluştur veya localStorage'dan al
  useEffect(() => {
    const KEY = "qr_device_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    setDeviceId(id);
  }, []);

  // Event bilgisini getir
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

  // QR token direkt URL'den geliyorsa ready durumuna geç
  useEffect(() => {
    if (qrToken && eventId && session) {
      setStatus("ready");
    }
  }, [qrToken, eventId, session]);

  function handleScan(result: string) {
    try {
      const url = new URL(result);
      const pathParts = url.pathname.split("/");
      const scannedId = pathParts[pathParts.length - 1];
      const t = url.searchParams.get("t") || "";
      setScannedEventId(scannedId);
      setScannedToken(t);
      setStatus("ready");
    } catch {
      setErrorMsg("Geçersiz QR kod. Lütfen etkinliğe ait QR kodu okutun.");
      setStatus("error");
    }
  }

  async function handleConfirmCheckIn() {
    if (!session) return;
    setStatus("locating");
    setSubmitting(true);
    setErrorMsg("");

    let lat: number | null = null;
    let lng: number | null = null;

    try {
      // Tarayıcı konum onayı isterse diye butona basınca konum istiyoruz
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
      // Konum alınamazsa izin verilmedi veya hata oluştu
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: scannedEventId,
          token: scannedToken,
          lat: lat,
          lng: lng,
          name: session.name,     // Hesaptaki ismi otomatik alıyoruz
          email: session.email,   // Hesaptaki maili otomatik alıyoruz
          phone: null,
          deviceId: deviceId || null,
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

  if (sessionLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }} className="fade-in-up">

        <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
          <div style={{
            width: 48, height: 48, background: "var(--accent-dim)", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 20,
          }}>📋</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Katılım Formu</h1>
          {event && (
            <p style={{ marginTop: 6, color: "var(--text-secondary)", fontSize: 14 }}>
              {event.title}
            </p>
          )}
        </div>

        {/* --- IDLE (Başlangıç veya Tarayıcı) --- */}
        {status === "idle" && (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 20 }}>
              Katılım kaydınızı oluşturmak için telefon kameranızla etkinlik QR kodunu okutun veya cihazınızın kamerasını açın.
            </p>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setStatus("scanning")}>
              📷 Kamerayı Aç
            </button>
          </div>
        )}

        {/* --- SCANNING --- */}
        {status === "scanning" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <QrScanner onResult={handleScan} />
            <div style={{ padding: 16 }}>
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setStatus("idle")}>
                İptal Et
              </button>
            </div>
          </div>
        )}

        {/* --- READY --- */}
        {(status === "ready" || status === "locating" || status === "submitting") && (
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, background: "rgba(16,185,129,0.1)", color: "var(--success)",
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 24
            }}>👤</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Hoş geldiniz, {session?.name}!
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              Hesabınızla eşleşme yapıldı.
              Katılımınızı onaylamak için aşağıdaki butona basın.
            </p>

            <button
              className="btn btn-primary"
              style={{ width: "100%", height: 48, fontSize: 15 }}
              onClick={handleConfirmCheckIn}
              disabled={submitting}
            >
              {status === "locating" ? "📍 Konum Doğrulanıyor..." :
               status === "submitting" ? "⏳ Kaydediliyor..." :
               "✓ Çek-in Yap"}
            </button>
          </div>
        )}

        {/* --- ERROR --- */}
        {status === "error" && (
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--danger)", marginBottom: 8 }}>
              İşlem Başarısız
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
              {errorMsg}
            </p>
            <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => {
              // Eğer kod URL'den geldiyse tekrar ready'ye dön, QR'dan geldiyse scanning'e dön
              if (scannedToken) setStatus("ready");
              else setStatus("scanning");
            }}>
              Tekrar Dene
            </button>
          </div>
        )}

        {/* --- SUCCESS --- */}
        {status === "success" && (
          <div className="card" style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.05)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--success)", marginBottom: 8 }}>
              Başarılı!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              {successMsg}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
