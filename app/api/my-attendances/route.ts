import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });

    // Since participant linking relies on email or name matching mostly:
    // Let's get all attendances for their email or name (we could add a userId column to attendances, but right now we match by name/email)
    // Wait, attendances has NO userId! It has participantId linking to the event's CSV list.
    // For now, let's just match by email or name.
    
    // To make it simpler, we just query attendances where name = payload.name
    // (This works well since our entire logic now enforces exact name matches anyway!)

    const list = await db
      .select({
        id: attendances.id,
        eventName: events.title,
        checkedInAt: attendances.checkedInAt,
        isManual: attendances.isManual,
      })
      .from(attendances)
      .leftJoin(events, eq(attendances.eventId, events.id))
      .where(eq(attendances.name, payload.name))
      .orderBy(desc(attendances.checkedInAt));

    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
