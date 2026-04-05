import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { generateQrToken } from "@/lib/qr";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });

  const qrToken = generateQrToken(event.qrSecret);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const attendUrl = `${appUrl}/attend/${id}?t=${qrToken}`;

  const qrDataUrl = await QRCode.toDataURL(attendUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  // Kaç saniye sonra yenileneceği
  const secondsUntilRefresh = 60 - (Math.floor(Date.now() / 1000) % 60);

  return NextResponse.json({
    qrDataUrl,
    attendUrl,
    token: qrToken,
    secondsUntilRefresh,
  });
}
