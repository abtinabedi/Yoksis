"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Attendance {
  id: string;
  eventName: string;
  checkedInAt: string;
  isManual: boolean;
}

export default function ParticipantDashboard() {
  const router = useRouter();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if(data.user) setUser(data.user);
      });

    fetch("/api/my-attendances")
      .then(r => r.json())
      .then(data => {
        if(Array.isArray(data)) setAttendances(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10, 10, 12, 0.8)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "16px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/Logo.png" alt="Logo" width={40} height={40} style={{ objectFit: "contain" }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }} className="gradient-text">QR Yoklama</h1>
          </div>
          
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,60,60,0.1)", color: "var(--danger)", border: "none" }}
          >
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="fade-in-up" style={{ padding: "40px 20px", flex: 1 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          
          {/* Welcome Banner */}
          <div className="card" style={{ 
            position: "relative", overflow: "hidden", 
            background: "linear-gradient(135deg, rgba(79,122,255,0.15) 0%, rgba(10,10,12,0) 100%)",
            border: "1px solid rgba(79,122,255,0.2)",
            marginBottom: 32, padding: "32px 40px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative", zIndex: 2 }}>
              <div style={{
                width: 72, height: 72, background: "var(--bg-elevated)", color: "var(--accent)",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", border: "1px solid var(--border)"
              }}>👤</div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                  Hoş geldiniz, <span style={{ color: "var(--text-primary)" }}>{user?.name || "Katılımcı"}</span>
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>
                  {user?.email || "Hesap bilgileri yükleniyor..."}
                </p>
              </div>
            </div>
            
            {/* Decorative background circle */}
            <div style={{
              position: "absolute", top: -50, right: -50, width: 200, height: 200,
              background: "var(--accent)", opacity: 0.1, filter: "blur(50px)", borderRadius: "50%"
            }}/>
          </div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            
            {/* Left Column: Stats */}
            <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="stat-card" style={{ margin: 0, padding: 24 }}>
                <div className="stat-value gradient-text" style={{ fontSize: 40 }}>{attendances.length}</div>
                <div className="stat-label" style={{ fontSize: 14 }}>Toplam Katıldığınız Etkinlik</div>
              </div>
              
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>Nasıl Yoklama Verilir?</h3>
                <ul style={{ paddingLeft: 20, margin: 0, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li>Eğitmeninizin paylaştığı <strong>QR Kodu</strong> telefonunuzun kamerasıyla okutun.</li>
                  <li>Tarayıcıdaki <strong>Konum İznini</strong> onaylayın (etkinlik alanında olduğunuzu doğrulamak için gereklidir).</li>
                  <li>Oturumunuz zaten açık olduğu için <strong>tek tıkla</strong> yoklamanızı verebilirsiniz.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Timeline / List */}
            <div className="card" style={{ flex: "2 1 500px", padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Katılım Geçmişiniz</h2>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg)", padding: "6px 12px", borderRadius: 20 }}>
                  En son kayıtlar
                </div>
              </div>
              
              {loading ? (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>Geçmişiniz yükleniyor...</div>
              ) : attendances.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg)", borderRadius: "var(--radius)", border: "1px dashed var(--border)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Henüz hiçbir kaydınız yok</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 300, margin: "0 auto" }}>
                    Bir etkinliğe katıldığınızda ve QR kodu okuttuğunuzda kayıtlarınız burada görünecektir.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {attendances.map((a, i) => (
                    <div key={a.id} style={{
                      padding: 20, background: "var(--bg)", border: "1px solid rgba(255,255,255,0.03)", 
                      borderRadius: "var(--radius)", display: "flex", gap: 20, alignItems: "center",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: "transform 0.2s, background 0.2s",
                      cursor: "default"
                    }} className="hover-lift">
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: "rgba(16,185,129,0.1)", color: "var(--success)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                      }}>
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.01em" }}>{a.eventName}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, display: "flex", gap: 12, alignItems: "center" }}>
                          <span>📅 {new Date(a.checkedInAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Istanbul" })}</span>
                          <span>🕒 {new Date(a.checkedInAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })}</span>
                        </p>
                      </div>
                      {i === 0 && (
                        <div style={{ 
                          fontSize: 11, fontWeight: 700, padding: "4px 8px", 
                          background: "var(--accent-dim)", color: "var(--accent)", borderRadius: 8,
                          letterSpacing: "0.05em", textTransform: "uppercase"
                        }}>En Yeni</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Basic Footer */}
      <footer style={{ padding: "24px", textAlign: "center", borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13 }}>
        <p>QR Yoklama Sistemi v1.0 • Katılımcı Paneli</p>
      </footer>
    </div>
  );
}
