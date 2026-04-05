import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances, participants } from "@/db/schema";
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
  const list = await db.select().from(attendances).where(eq(attendances.eventId, id));
  return NextResponse.json(list);
}

// Manuel katılım işaretle (admin tarafından)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const { participantId } = await request.json();

  const [participant] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId));

  if (!participant) {
    return NextResponse.json({ error: "Katılımcı bulunamadı." }, { status: 404 });
  }

  const [record] = await db
    .insert(attendances)
    .values({
      eventId: id,
      participantId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      isRegistered: true,
      isManual: true,
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { attendanceId } = await request.json();
  await db.delete(attendances).where(eq(attendances.id, attendanceId));
  return NextResponse.json({ success: true });
}
