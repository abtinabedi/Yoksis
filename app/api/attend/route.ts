import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, attendances, participants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyQrToken, haversineDistance } from "@/lib/qr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, token: qrToken, lat, lng, name, email, phone, deviceId } = body;

    if (!eventId || !qrToken) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Ad soyad zorunludur." }, { status: 400 });
    }

    // 1. Etkinliği bul
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    // 2. QR token doğrula
    if (!verifyQrToken(event.qrSecret, qrToken)) {
      return NextResponse.json({
        error: "QR kod geçersiz veya süresi dolmuş. Lütfen yeni kodu okutun.",
      }, { status: 400 });
    }

    // 3. Cihaz kontrolü — aynı cihaz bu etkinliğe daha önce katıldı mı?
    if (deviceId) {
      const [existingDevice] = await db
        .select()
        .from(attendances)
        .where(and(eq(attendances.eventId, eventId), eq(attendances.deviceId, deviceId)));

      if (existingDevice) {
        return NextResponse.json({
          error: "Bu cihazdan zaten katılım kaydı oluşturulmuş.",
          alreadyCheckedIn: true,
        }, { status: 409 });
      }
    }

    // 4. Konum doğrula (etkinliğin konumu varsa)
    if (event.locationLat && event.locationLng) {
      if (!lat || !lng) {
        return NextResponse.json({
          error: "Konum bilgisi alınamadı. Katılım için konum iznine ihtiyaç var.",
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

    // 5. İsim eşleştirme (büyük/küçük harf duyarsız)
    const normalizedInput = name.trim().toLowerCase().replace(/\s+/g, " ");

    const allParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.eventId, eventId));

    const matched = allParticipants.find(
      (p) => p.name.trim().toLowerCase().replace(/\s+/g, " ") === normalizedInput
    );

    // 6. İsim ile çift kayıt kontrolü
    const existingAttendances = await db
      .select()
      .from(attendances)
      .where(eq(attendances.eventId, eventId));

    const alreadyIn = existingAttendances.find(
      (a) => a.name.trim().toLowerCase().replace(/\s+/g, " ") === normalizedInput
    );

    if (alreadyIn) {
      return NextResponse.json({
        error: "Bu isimle zaten bir katılım kaydı oluşturulmuş.",
        alreadyCheckedIn: true,
      }, { status: 409 });
    }

    // 7. Katılım kaydı oluştur
    const [record] = await db
      .insert(attendances)
      .values({
        eventId,
        participantId: matched?.id ?? null,
        name: matched ? matched.name : name.trim(),
        email: email || matched?.email || null,
        phone: phone || matched?.phone || null,
        lat: lat || null,
        lng: lng || null,
        isRegistered: !!matched,
        isManual: false,
        deviceId: deviceId || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      record,
      isRegistered: !!matched,
      message: matched
        ? `Hoş geldiniz, ${matched.name}! Katılımınız kaydedildi.`
        : "Katılımınız kaydedildi.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
