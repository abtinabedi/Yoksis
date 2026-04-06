"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    locationLat: "",
    locationLng: "",
    locationRadiusM: "200",
  });

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function getCurrentLocation() {
    setGettingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      set("locationLat", String(pos.coords.latitude));
      set("locationLng", String(pos.coords.longitude));
    } catch {
      setError("Konum alınamadı. Lütfen manuel giriniz.");
    } finally {
      setGettingLocation(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        locationRadiusM: parseInt(form.locationRadiusM),
      };

      if (useLocation && form.locationLat && form.locationLng) {
        body.locationLat = parseFloat(form.locationLat);
        body.locationLng = parseFloat(form.locationLng);
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Etkinlik oluşturulamadı.");
      } else {
        router.push(`/events/${data.id}`);
      }
    } catch {
      setError("Sunucu hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Yeni Etkinlik</h1>
          <p className="page-subtitle">Yoklama alınacak yeni bir etkinlik oluşturun</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-field">
            <label>Etkinlik Adı *</label>
            <input
              id="title"
              type="text"
              placeholder="ör. Yazılım Geliştirme Semineri"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Açıklama</label>
            <textarea
              id="description"
              rows={3}
              placeholder="Etkinlik hakkında kısa bir açıklama..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-field">
              <label>Başlangıç Tarihi & Saati *</label>
              <input
                id="startsAt"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Bitiş Tarihi & Saati *</label>
              <input
                id="endsAt"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location section */}
          <div style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius)",
            padding: 16,
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: useLocation ? 16 : 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>📍 Konum Doğrulaması</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Katılımcıların etkinlik alanında olup olmadığını doğrula
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={useLocation}
                  onChange={(e) => setUseLocation(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 13 }}>Aktif et</span>
              </label>
            </div>

            {useLocation && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  style={{ alignSelf: "flex-start" }}
                >
                  {gettingLocation ? "Konum alınıyor..." : "📍 Mevcut Konumumu Kullan"}
                </button>

                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-field">
                    <label>Enlem</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="ör. 41.0082"
                      value={form.locationLat}
                      onChange={(e) => set("locationLat", e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Boylam</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="ör. 28.9784"
                      value={form.locationLng}
                      onChange={(e) => set("locationLng", e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Yarıçap (metre)</label>
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      value={form.locationRadiusM}
                      onChange={(e) => set("locationRadiusM", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-danger">
              <span>⚠️</span> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              İptal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Etkinliği Oluştur →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
