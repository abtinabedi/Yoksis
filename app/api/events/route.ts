import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));
  return NextResponse.json(allEvents);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, locationLat, locationLng, locationRadiusM, startsAt, endsAt } = body;

  if (!title || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Başlık, başlangıç ve bitiş tarihi zorunludur." }, { status: 400 });
  }

  const qrSecret = crypto.randomBytes(32).toString("hex");

  const [newEvent] = await db
    .insert(events)
    .values({
      title,
      description,
      locationLat: locationLat || null,
      locationLng: locationLng || null,
      locationRadiusM: locationRadiusM || 200,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      qrSecret,
      createdBy: user.userId,
    })
    .returning();

  return NextResponse.json(newEvent, { status: 201 });
}
