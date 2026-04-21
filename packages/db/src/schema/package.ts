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
 * Main travel packages table
 * Stores all travel package information
 */
export const package = pgTable(
  "package",
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
    accommodation: text("accommodation").nullable(),
    accommodationDetails: jsonb("accommodation_details")
      .$type<{ name: string; rating: number; amenities: string[] }>()
      .nullable(),
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
    index("package_creatorId_idx").on(table.creatorId),
    index("package_destination_idx").on(table.destination),
    index("package_startDate_idx").on(table.startDate),
  ]
);

/**
 * Package participants junction table
 * Links users to packages they have joined
 */
export const packageParticipant = pgTable(
  "package_participant",
  {
    id: text("id").primaryKey(),
    packageId: text("package_id")
      .notNull()
      .references(() => package.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("packageParticipant_packageId_idx").on(table.packageId),
    index("packageParticipant_userId_idx").on(table.userId),
  ]
);

/**
 * Package activities table
 * Stores all activities within a travel package
 */
export const packageActivity = pgTable(
  "package_activity",
  {
    id: text("id").primaryKey(),
    packageId: text("package_id")
      .notNull()
      .references(() => package.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: timestamp("date").notNull(),
    location: text("location").notNull(),
    duration: text("duration").notNull(), // e.g., "2 hours", "full day"
    isIncluded: integer("is_included").notNull().default(1), // 1 = included, 0 = optional
    cost: decimal("cost", { precision: 10, scale: 2 }).nullable(), // Only if optional
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("packageActivity_packageId_idx").on(table.packageId)]
);

/**
 * Relations
 */
export const packageRelations = relations(package, ({ one, many }) => ({
  creator: one(user, {
    fields: [package.creatorId],
    references: [user.id],
  }),
  participants: many(packageParticipant),
  activities: many(packageActivity),
}));

export const packageParticipantRelations = relations(
  packageParticipant,
  ({ one }) => ({
    package: one(package, {
      fields: [packageParticipant.packageId],
      references: [package.id],
    }),
    user: one(user, {
      fields: [packageParticipant.userId],
      references: [user.id],
    }),
  })
);

export const packageActivityRelations = relations(packageActivity, ({ one }) => ({
  package: one(package, {
    fields: [packageActivity.packageId],
    references: [package.id],
  }),
}));
