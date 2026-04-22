import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  decimal,
  index,
} from "drizzle-orm/pg-core";

import { user } from "./auth.js";

/**
 * Main travel travelPackages table
 * Stores all travel travelPackage information
 */
export const travelPackage = pgTable(
  "travel_travelPackage",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    destination: text("destination").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    durationDays: integer("duration_days").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    maxParticipants: integer("max_participants").notNull(),
    currentParticipants: integer("current_participants").notNull().default(1), // Creator counts as 1
    accommodation: text("accommodation"),
    accommodationDetails: jsonb("accommodation_details").$type<{
      name: string;
      rating: number;
      amenities: string[];
    }>(),
    status: text("status", { enum: ["draft", "published", "cancelled"] })
      .notNull()
      .default("published"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Single column indexes
    index("travelPackage_creatorId_idx").on(table.creatorId),
    index("travelPackage_destination_idx").on(table.destination),
    index("travelPackage_startDate_idx").on(table.startDate),
    index("travelPackage_status_idx").on(table.status),
    index("travelPackage_durationDays_idx").on(table.durationDays),

    // Composite indexes for common search patterns
    index("travelPackage_status_destination_idx").on(table.status, table.destination),
    index("travelPackage_status_startDate_idx").on(table.status, table.startDate),
    index("travelPackage_status_durationDays_idx").on(
      table.status,
      table.durationDays,
    ),
    index("travelPackage_startDate_endDate_status_idx").on(
      table.startDate,
      table.endDate,
      table.status,
    ),
  ],
);

/**
 * Package participants junction table
 * Links users to travelPackages they have joined
 */
export const travelPackageParticipant = pgTable(
  "travelPackage_participant",
  {
    id: text("id").primaryKey(),
    travelPackageId: text("travelPackage_id")
      .notNull()
      .references(() => travelPackage.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("travelPackageParticipant_travelPackageId_idx").on(table.travelPackageId),
    index("travelPackageParticipant_userId_idx").on(table.userId),
  ],
);

/**
 * Package activities table
 * Stores all activities within a travel travelPackage
 */
export const travelPackageActivity = pgTable(
  "travelPackage_activity",
  {
    id: text("id").primaryKey(),
    travelPackageId: text("travelPackage_id")
      .notNull()
      .references(() => travelPackage.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: timestamp("date").notNull(),
    location: text("location").notNull(),
    duration: text("duration").notNull(), // e.g., "2 hours", "full day"
    isIncluded: integer("is_included").notNull().default(1), // 1 = included, 0 = optional
    cost: decimal("cost", { precision: 10, scale: 2 }), // Only if optional
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("travelPackageActivity_travelPackageId_idx").on(table.travelPackageId)],
);

/**
 * Relations
 */
export const travelPackageRelations = relations(travelPackage, ({ one, many }) => ({
  creator: one(user, {
    fields: [travelPackage.creatorId],
    references: [user.id],
  }),
  participants: many(travelPackageParticipant),
  activities: many(travelPackageActivity),
}));

export const travelPackageParticipantRelations = relations(
  travelPackageParticipant,
  ({ one }) => ({
    travelPackage: one(travelPackage, {
      fields: [travelPackageParticipant.travelPackageId],
      references: [travelPackage.id],
    }),
    user: one(user, {
      fields: [travelPackageParticipant.userId],
      references: [user.id],
    }),
  }),
);

export const travelPackageActivityRelations = relations(
  travelPackageActivity,
  ({ one }) => ({
    travelPackage: one(travelPackage, {
      fields: [travelPackageActivity.travelPackageId],
      references: [travelPackage.id],
    }),
  }),
);
