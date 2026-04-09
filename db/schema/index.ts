import { pgTable, serial, text, integer, real, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("participant").notNull(), // "admin" | "participant"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  locationRadiusM: integer("location_radius_m").default(200),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  qrSecret: text("qr_secret").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendances = pgTable("attendances", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  participantId: uuid("participant_id").references(() => participants.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
  lat: real("lat"),
  lng: real("lng"),
  isRegistered: boolean("is_registered").default(false),
  isManual: boolean("is_manual").default(false),
  status: text("status").default("present").notNull(),
  manualReason: text("manual_reason"),
  deviceId: text("device_id"),
});
