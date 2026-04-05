"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Attendance {
  id: string;
  eventName: string;
  checkedInAt: string;
  isManual: boolean;
}

export default function ParticipantDashboard() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{name: string} | null>(null);

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

  return (
    <div className="fade-in-up" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Image src="/Logo.png" alt="Logo" width={64} height={64} style={{ objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Hoş geldiniz, {user?.name || "Katılımcı"}!</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
            Yoklama ve katılım kayıtlarınız aşağıda listelenmektedir.
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Katıldığınız Etkinlikler</h2>
          
          {loading ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Yükleniyor...</div>
          ) : attendances.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40 }}>📭</div>
              <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Henüz hiçbir etkinliğe katılmadınız.</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Etkinlik alanındaki QR kodu okutarak yoklamanızı verebilirsiniz.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {attendances.map(a => (
                <div key={a.id} style={{
                  padding: 16, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{a.eventName}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                      {new Date(a.checkedInAt).toLocaleString("tr-TR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="badge badge-success">✓ Katıldı</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
