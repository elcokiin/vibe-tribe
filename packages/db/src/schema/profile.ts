import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, decimal, integer } from "drizzle-orm/pg-core";

import { user } from "./auth.js";

export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull().default(""),
  favoriteDestinations: jsonb("favorite_destinations").$type<string[]>().notNull().default([]),
  avatarUrl: text("avatar_url"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).notNull().default("5.0"), // 1-5 stars
  totalRatings: integer("total_ratings").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
}));
