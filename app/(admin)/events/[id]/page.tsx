"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import Papa from "papaparse";

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

interface Participant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Attendance {
  id: string;
  participantId: string | null;
  name: string;
  email: string | null;
  checkedInAt: string;
  isRegistered: boolean;
  isManual: boolean;
  status: "present" | "absent";
  manualReason: string | null;
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
    timeZone: "Europe/Istanbul",
  });
}

type Tab = "qr" | "attendance";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("qr");
  const [event, setEvent] = useState<Event | null>(null);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrUrl, setShowQrUrl] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [showSheetInput, setShowSheetInput] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${id}`).then((r) => r.json()),
      fetch(`/api/events/${id}/participants`).then((r) => r.json()),
      fetch(`/api/events/${id}/attendance`).then((r) => r.json()),
    ]).then(([ev, parts, atts]) => {
      setEvent(ev);
      setParticipants(Array.isArray(parts) ? parts : []);
      setAttendances(Array.isArray(atts) ? atts : []);
      setLoading(false);
    });
  }, [id]);

  // Yoklama real-time yenile
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/events/${id}/attendance`).then((r) => r.json()).then(setAttendances);
    }, 2000);
    return () => clearInterval(interval);
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
      setNowTs(Date.now());
      setCountdown((prev) => {
        if (prev <= 1) { refreshQr(); return 60; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tab, refreshQr]);

  async function toggleStatus(participantId: string, currentStatus: "present" | "absent" | "none") {
    const action = currentStatus === "present" ? "Yok" : "Var";
    const reason = prompt(`Bu kişiyi neden '${action}' olarak işaretlemek istiyorsunuz? (Neden belirtmek zorunludur)`);
    
    if (!reason || !reason.trim()) {
      alert("İşlemi tamamlamak için bir neden belirtmelisiniz.");
      return;
    }

    const newStatus = action === "Var" ? "present" : "absent";

    const res = await fetch(`/api/events/${id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        status: newStatus,
        reason: reason.trim()
      }),
    });

    if (res.ok) {
      const updatedRecord = await res.json();
      setAttendances((prev) => {
        const index = prev.findIndex(a => a.participantId === participantId);
        if (index !== -1) {
          const next = [...prev];
          next[index] = updatedRecord;
          return next;
        }
        return [...prev, updatedRecord];
      });
    } else {
      alert("Güncelleme sırasında bir hata oluştu.");
    }
  }

  async function removeAttendance(attendanceId: string) {
    await fetch(`/api/events/${id}/attendance`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId }),
    });
    setAttendances((prev) => prev.filter((a) => a.id !== attendanceId));
  }

  async function uploadParsedCsv(results: Papa.ParseResult<unknown>) {
    const rows = results.data as Record<string, string>[];
    const items = rows
      .map((row) => {
        const getVal = (possibleKeys: string[]) => {
          const key = Object.keys(row).find(k => possibleKeys.some(pK => k.toLowerCase().includes(pK.toLowerCase())));
          return key ? row[key] : null;
        }
        return {
          name: getVal(["ad soyad", "adınız", "isim", "name"]) || "",
          email: getVal(["email", "e-posta", "eposta", "e posta"]) || null,
          phone: getVal(["telefon", "phone", "tel"]) || null,
        }
      })
      .filter((r) => r.name.trim().length > 0);

    if (items.length === 0) {
      setCsvError("Geçerli kayıt bulunamadı. Lütfen listede 'Ad Soyad' sütunu olduğundan emin olun.");
      setCsvLoading(false);
      return;
    }

    const res = await fetch(`/api/events/${id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    const data = await res.json();
    if (res.ok) {
      setParticipants((prev) => [...prev, ...data]);
      setCsvError("");
    } else {
      setCsvError(data.error || "Liste yüklenemedi.");
    }
    setCsvLoading(false);
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    setCsvLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: uploadParsedCsv,
      error: () => {
        setCsvError("CSV dosyası okunamadı.");
        setCsvLoading(false);
      },
    });
    e.target.value = "";
  }

  async function handleSheetImport() {
    if (!sheetUrl) return;
    setCsvError("");
    setCsvLoading(true);
    
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setCsvError("Geçersiz Google Sheets URL'i.");
      setCsvLoading(false);
      return;
    }
    
    const sheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    try {
      const res = await fetch(exportUrl);
      if (!res.ok) throw new Error("Dosya okunamadı. Bağlantı Ayarlarından 'Bağlantıya sahip olan herkes görüntüleyebilir/okuyabilir' izni verildiğinden emin olun.");
      const csvText = await res.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: uploadParsedCsv,
        error: () => { setCsvError("Veri parse edilemedi."); setCsvLoading(false); }
      });
      setShowSheetInput(false);
      setSheetUrl("");
    } catch (e: any) {
      setCsvError(e.message || "Google Sheets ile bağlantı kurulamadı.");
      setCsvLoading(false);
    }
  }

  async function handleManualImport() {
    if (!manualName.trim()) {
      setCsvError("Lütfen Ad Soyad giriniz.");
      return;
    }
    setCsvError("");
    setCsvLoading(true);

    const items = [
      {
        name: manualName.trim(),
        email: manualEmail.trim() || null,
        phone: manualPhone.trim() || null,
      }
    ];

    try {
      const res = await fetch(`/api/events/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      const data = await res.json();
      if (res.ok) {
        setParticipants((prev) => [...prev, ...data]);
        setManualName("");
        setManualEmail("");
        setManualPhone("");
        setShowManualInput(false);
        setCsvError("");
      } else {
        setCsvError(data.error || "Katılımcı eklenemedi.");
      }
    } catch {
      setCsvError("Sunucu hatası.");
    } finally {
      setCsvLoading(false);
    }
  }

  async function clearParticipants() {
    if (!confirm("Tüm katılımcı listesini silmek istiyor musunuz?")) return;
    await fetch(`/api/events/${id}/participants`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    setParticipants([]);
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Yükleniyor...</div>;
  }

  if (!event) {
    return <div className="alert alert-danger">Etkinlik bulunamadı.</div>;
  }

  // Yoklama için: hangi participant'lar geldi?
  const attendedParticipantIds = new Set(
    attendances.filter((a) => a.participantId && a.status === "present").map((a) => a.participantId!)
  );
  const presentCount = participants.filter((p) => attendedParticipantIds.has(p.id)).length;
  // Walk-in (listede olmayan ama gelen ve durumu present olan)
  const walkIns = attendances.filter((a) => !a.isRegistered && !a.isManual && a.status === "present");

  let qrMessage = null;
  const startsAtTs = new Date(event.startsAt).getTime();
  const endsAtTs = new Date(event.endsAt).getTime();
  const tenMinsAfterStart = startsAtTs + 10 * 60000;
  
  if (nowTs > endsAtTs) {
    qrMessage = "Etkinlik/Oturum bitmiştir";
  } else if (nowTs > tenMinsAfterStart) {
    qrMessage = "Artık Yoklama Yapamazsınız";
  }

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13 }}>← Dashboard</Link>
          <h1 className="page-title" style={{ marginTop: 4 }}>{event.title}</h1>
          <p className="page-subtitle">
            {formatDate(event.startsAt)} — {formatDate(event.endsAt)}
            {event.locationLat && (
              <span style={{ marginLeft: 12 }}>Konum aktif ({event.locationRadiusM}m)</span>
            )}
          </p>
        </div>
        <a href={`/attend/${id}`} target="_blank" className="btn btn-secondary">
          Katılım Linki
        </a>
      </div>

      {/* CSV Upload bar */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Katılımcı Listesi</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 10 }}>
              {participants.length > 0
                ? `${participants.length} kişi yüklendi`
                : "Henüz liste yüklenmedi"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {participants.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={clearParticipants}>
                Listeyi Temizle
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowManualInput(!showManualInput); setShowSheetInput(false); }}>
              Manuel Ekle
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowSheetInput(!showSheetInput); setShowManualInput(false); }}>
              Google Sheets / Forms
            </button>
            <label className={`btn btn-${participants.length > 0 ? "secondary" : "primary"} btn-sm`} style={{ cursor: "pointer" }}>
              {csvLoading ? "Yükleniyor..." : participants.length > 0 ? "CSV Güncelle" : "CSV Yükle"}
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCsvImport} disabled={csvLoading} />
            </label>
          </div>
        </div>
        
        {showSheetInput && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, padding: 12, background: "var(--bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <input 
              type="text" 
              style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, background: "var(--bg-elevated)", color: "var(--text-primary)", outline: "none" }}
              placeholder="Google E-Tablo paylaşım URL'ini yapıştırın..." 
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSheetImport} disabled={csvLoading || !sheetUrl}>
              Ekle
            </button>
          </div>
        )}

        {showManualInput && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, padding: 12, background: "var(--bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <input 
              type="text" 
              style={{ flex: 1, minWidth: 150, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, background: "var(--bg-elevated)", color: "var(--text-primary)", outline: "none" }}
              placeholder="Ad Soyad (Zorunlu)" 
              value={manualName}
              onChange={e => setManualName(e.target.value)}
            />
            <input 
              type="text" 
              style={{ flex: 1, minWidth: 150, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, background: "var(--bg-elevated)", color: "var(--text-primary)", outline: "none" }}
              placeholder="E-posta (Opsiyonel)" 
              value={manualEmail}
              onChange={e => setManualEmail(e.target.value)}
            />
            <input 
              type="text" 
              style={{ flex: 1, minWidth: 150, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, background: "var(--bg-elevated)", color: "var(--text-primary)", outline: "none" }}
              placeholder="Telefon (Opsiyonel)" 
              value={manualPhone}
              onChange={e => setManualPhone(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleManualImport} disabled={csvLoading || !manualName.trim()}>
              Kaydet
            </button>
          </div>
        )}

        {csvError && <div className="alert alert-danger" style={{ marginTop: 10, fontSize: 13 }}>{csvError}</div>}
        {participants.length === 0 && !showSheetInput && !showManualInput && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
            CSV / Google Sheets sütun başlıkları: <strong>Ad Soyad</strong> (Zorunlu), Email (opsiyonel), Telefon (opsiyonel)
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 4, marginBottom: 24,
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
            {t === "qr" && "QR Kod"}
            {t === "attendance" && `Yoklama${participants.length > 0 ? ` (${presentCount}/${participants.length})` : ` (${attendances.length})`}`}
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

            {qrMessage ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--danger)" }}>{qrMessage}</h3>
              </div>
            ) : qrData ? (
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
                    {showQrUrl ? "URL'i Gizle" : "Katılım URL'ini Göster"}
                  </button>
                  {showQrUrl && (
                    <div style={{
                      background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)",
                      padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)",
                      wordBreak: "break-all", border: "1px solid var(--border)",
                    }}>
                      {qrData.attendUrl}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>Yükleniyor...</div>
            )}
          </div>

          <div className="card" style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Nasıl Çalışır?</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "Listeyi Yükle", desc: "Etkinlikten önce CSV ile katılımcı listesi yükleyin" },
                { title: "QR Okut", desc: "Katılımcılar telefon kamerasıyla QR kodu okutup adlarını yazar" },
                { title: "Otomatik Eşleştirme", desc: "Sistem adı listede arar ve Var/Yok durumunu işaretler" },
                { title: "Her dakika yenilenir", desc: "Güvenlik için QR kod 60 saniyede bir değişir" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* İstatistik */}
          {participants.length > 0 && (
            <div className="stat-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--success)" }}>{presentCount}</div>
                <div className="stat-label">Gelen</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--danger)" }}>{participants.length - presentCount}</div>
                <div className="stat-label">Gelmeyen</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{participants.length}</div>
                <div className="stat-label">Toplam Kayıtlı</div>
              </div>
              {walkIns.length > 0 && (
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--accent)" }}>{walkIns.length}</div>
                  <div className="stat-label">Walk-in</div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <a href={`/api/events/${id}/export`} className="btn btn-success btn-sm">
              Excel İndir
            </a>
          </div>

          {/* Kayıtlı katılımcı listesi: Var / Yok */}
          {participants.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ad Soyad</th>
                    <th>E-posta</th>
                    <th>Durum</th>
                    <th>Katılım Zamanı</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => {
                    const att = attendances.find((a) => a.participantId === p.id);
                    return (
                      <tr key={p.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{p.email || "-"}</td>
                        <td>
                          {att
                            ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span className={att.status === "present" ? "badge badge-success" : "badge badge-danger"}>
                                  {att.status === "present" ? "Var" : "Yok"}
                                </span>
                                {att.manualReason && (
                                  <span style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={att.manualReason}>
                                    Neden: {att.manualReason}
                                  </span>
                                )}
                              </div>
                            )
                            : <span className="badge badge-danger" style={{ opacity: 0.5 }}>Yok (Kayıt Yok)</span>
                          }
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                          {att && att.status === "present" ? formatDate(att.checkedInAt) : "-"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            {(!att || att.status === "absent") ? (
                              <button className="btn btn-primary btn-sm" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => toggleStatus(p.id, att?.status || "none")}>
                                Var Yap
                              </button>
                            ) : (
                              <button className="btn btn-danger btn-sm" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => toggleStatus(p.id, "present")}>
                                Yok Yap
                              </button>
                            )}
                            {att && (
                              <button className="btn btn-secondary btn-sm" style={{ padding: "4px 8px", fontSize: 12, opacity: 0.6 }} onClick={() => removeAttendance(att.id)}>
                                Kaydı Sil
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "32px 24px", color: "var(--text-muted)" }}>
              Katılımcı listesi yüklenmemiş. Yoklama kaydı yine de tutulur.
            </div>
          )}

          {/* Walk-in'ler (listede olmayan gelenler) */}
          {walkIns.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
                Listede Olmayan Katılımcılar (Walk-in)
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Ad Soyad</th>
                      <th>E-posta</th>
                      <th>Katılım Zamanı</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {walkIns.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500 }}>{a.name}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{a.email || "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{formatDate(a.checkedInAt)}</td>
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
            </div>
          )}

          {participants.length === 0 && attendances.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
              Henüz yoklama kaydı yok. Katılımcılar QR kodu okutunca burada görünür.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
