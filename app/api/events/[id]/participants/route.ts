import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
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
  const list = await db.select().from(participants).where(eq(participants.eventId, id));
  return NextResponse.json(list);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Tek kayıt veya toplu kayıt (array)
  const items = Array.isArray(body) ? body : [body];

  const inserted = await db
    .insert(participants)
    .values(items.map((p) => ({ ...p, eventId: id })))
    .returning();

  return NextResponse.json(inserted, { status: 201 });
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
  const { participantId } = await request.json();
  await db.delete(participants).where(eq(participants.id, participantId));
  return NextResponse.json({ success: true });
}
