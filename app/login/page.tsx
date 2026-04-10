"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type Tab = "login" | "register";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUrl = searchParams.get("redirect");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş başarısız.");
      } else {
        const defaultRoute = data.role === "admin" ? "/dashboard" : "/participant";
        router.push(redirectUrl || defaultRoute);
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (regPassword !== regPasswordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.");
      } else {
        const defaultRoute = data.role === "admin" ? "/dashboard" : "/participant";
        router.push(redirectUrl || defaultRoute);
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
      <div style={{ width: "100%", maxWidth: "420px" }} className="fade-in-up">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Image src="/Logo.png" alt="Logo" width={128} height={128} style={{ objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }} className="gradient-text">
            QR Yoklama
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 14 }}>
            Yönetici paneli
          </p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)", padding: 0, overflow: "hidden" }}>
          {/* Tab switcher */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--border)",
          }}>
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                style={{
                  padding: "16px",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: tab === t ? "var(--accent-dim)" : "transparent",
                  color: tab === t ? "var(--accent)" : "var(--text-muted)",
                  borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          <div style={{ padding: "24px" }}>
            {/* LOGIN FORM */}
            {tab === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-field">
                  <label htmlFor="login-email">E-posta</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="admin@ornek.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="login-password">Şifre</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && <div className="alert alert-danger"><span>⚠️</span> {error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ height: 48, fontSize: 15, marginTop: 4 }}
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
                </button>

                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                  Hesabınız yok mu?{" "}
                  <span
                    style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => { setTab("register"); setError(""); }}
                  >
                    Kayıt olun
                  </span>
                </p>
              </form>
            )}

            {/* REGISTER FORM */}
            {tab === "register" && (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-field">
                  <label htmlFor="reg-name">Ad Soyad</label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="reg-email">E-posta</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="ahmet@ornek.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="reg-password">Şifre</label>
                  <input
                    id="reg-password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="reg-password-confirm">Şifre Tekrar</label>
                  <input
                    id="reg-password-confirm"
                    type="password"
                    placeholder="Şifrenizi tekrar girin"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && <div className="alert alert-danger"><span>⚠️</span> {error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ height: 48, fontSize: 15, marginTop: 4 }}
                >
                  {loading ? "Kayıt oluşturuluyor..." : "Hesap Oluştur →"}
                </button>

                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                  Zaten hesabınız var mı?{" "}
                  <span
                    style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => { setTab("login"); setError(""); }}
                  >
                    Giriş yapın
                  </span>
                </p>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, marginTop: 24 }}>
          QR Yoklama & Katılım Sistemi v1.0
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <LoginContent />
    </Suspense>
  );
}
