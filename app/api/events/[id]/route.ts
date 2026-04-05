import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

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
  return NextResponse.json(event);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ success: true });
}
