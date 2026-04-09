import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const list = await db.select().from(attendances).where(eq(attendances.eventId, id));

  const data = list.map((a) => ({
    "Ad Soyad": a.name,
    "Email": a.email || "-",
    "Telefon": a.phone || "-",
    "Durum": a.status === "present" ? "Var" : "Yok",
    "Katılım Tarihi": a.status === "present" ? new Date(a.checkedInAt).toLocaleString("tr-TR") : "-",
    "Manuel Sebep": a.manualReason || "-",
    "Kayıt Türü": a.isManual ? "Manuel" : a.isRegistered ? "Kayıtlı" : "Walk-in",
    "Enlem": a.lat || "-",
    "Boylam": a.lng || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Katılımcılar");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="katilim-${id}.xlsx"`,
    },
  });
}
