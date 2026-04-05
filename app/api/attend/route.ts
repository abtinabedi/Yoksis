import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, attendances, participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyQrToken, haversineDistance } from "@/lib/qr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, token: qrToken, lat, lng, name, email, phone } = body;

    if (!eventId || !qrToken) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    // 1. Etkinliği bul
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    // 2. QR token doğrula
    if (!verifyQrToken(event.qrSecret, qrToken)) {
      return NextResponse.json({ error: "QR kod geçersiz veya süresi dolmuş. Lütfen yeni kodu okutun." }, { status: 400 });
    }

    // 3. Konum doğrula (etkinliğin konumu varsa)
    if (event.locationLat && event.locationLng) {
      if (!lat || !lng) {
        return NextResponse.json({
          error: "Konum bilgisi alınamadı. Katılım için konum izni vermeniz gerekiyor.",
        }, { status: 400 });
      }

      const distance = haversineDistance(event.locationLat, event.locationLng, lat, lng);
      const radius = event.locationRadiusM || 200;

      if (distance > radius) {
        return NextResponse.json({
          error: `Etkinlik alanının dışındasınız. (${Math.round(distance)}m uzaktasınız, izin verilen: ${radius}m)`,
        }, { status: 400 });
      }
    }

    // 4. Kayıtlı katılımcı mı kontrol et (email ile eşleştir)
    let participantId: string | null = null;
    let isRegistered = false;

    if (email) {
      const registered = await db
        .select()
        .from(participants)
        .where(eq(participants.eventId, eventId));

      const match = registered.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase()
      );
      if (match) {
        participantId = match.id;
        isRegistered = true;
      }
    }

    // Kayıtsız kullanıcı için ad zorunlu
    if (!isRegistered && !name) {
      return NextResponse.json({ error: "Ad soyad zorunludur." }, { status: 400 });
    }

    // 5. Çift kayıt kontrolü
    if (participantId) {
      const existing = await db
        .select()
        .from(attendances)
        .where(eq(attendances.participantId, participantId));

      const alreadyCheckedIn = existing.find((a) => a.eventId === eventId);
      if (alreadyCheckedIn) {
        return NextResponse.json({
          error: "Bu etkinliğe zaten katılım kaydınız var.",
          alreadyCheckedIn: true,
        }, { status: 409 });
      }
    }

    // 6. Katılım kaydı oluştur
    const [record] = await db
      .insert(attendances)
      .values({
        eventId,
        participantId,
        name: isRegistered
          ? (await db.select().from(participants).where(eq(participants.id, participantId!)))[0].name
          : name,
        email: email || null,
        phone: phone || null,
        lat: lat || null,
        lng: lng || null,
        isRegistered,
        isManual: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      record,
      message: isRegistered
        ? "Katılımınız kaydedildi! Hoş geldiniz."
        : "Katılımınız başarıyla oluşturuldu!",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
