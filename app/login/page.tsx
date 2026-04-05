"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş başarısız.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 20% 50%, rgba(79,122,255,0.08) 0%, transparent 60%), var(--bg)",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }} className="fade-in-up">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: 56, height: 56,
            background: "var(--accent-dim)",
            border: "1px solid rgba(79,122,255,0.3)",
            borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 24,
          }}>
            📋
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }} className="gradient-text">
            QR Yoklama
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 14 }}>
            Yönetici paneline giriş yapın
          </p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-field">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                placeholder="admin@ornek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert alert-danger">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ height: 48, fontSize: 15, marginTop: 4 }}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, marginTop: 24 }}>
          QR Yoklama & Katılım Sistemi v1.0
        </p>
      </div>
    </div>
  );
}
