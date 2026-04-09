import { db } from "@vibetribe/db";
import { user } from "@vibetribe/db/schema/auth";
import { eq } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import z from "zod";

import { protectedProcedure } from "../procedure.js";

const profile = pgTable("profile", {
  userId: text("user_id").primaryKey(),
  description: text("description").notNull().default(""),
  favoriteDestinations: jsonb("favorite_destinations").$type<string[]>().notNull().default([]),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

const destinationSchema = z.string().trim().min(1).max(80);
const updateProfileSchema = z.object({
  description: z.string().trim().max(400).optional(),
  favoriteDestinations: z.array(destinationSchema).max(10).optional(),
  avatarUrl: z.string().trim().max(3_000_000).nullable().optional(),
});

function sanitizeDestinations(destinations: string[]) {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const destination of destinations) {
    const normalized = destination.trim();

    if (!normalized) {
      continue;
    }

    const key = normalized.toLocaleLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueValues.push(normalized);
  }

  return uniqueValues;
}

async function ensureProfile(userId: string) {
  const existing = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);

  if (existing[0]) {
    return existing[0];
  }

  await db.insert(profile).values({
    userId,
  });

  const created = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);

  return created[0];
}

export const profileRouter = {
  getMine: protectedProcedure.handler(async ({ context }) => {
    const sessionUser = context.session.user;
    const userId = sessionUser.id;
    const ensuredProfile = await ensureProfile(userId);

    return {
      userId,
      name: sessionUser.name,
      email: sessionUser.email,
      avatarUrl: ensuredProfile?.avatarUrl ?? sessionUser.image ?? null,
      description: ensuredProfile?.description ?? "",
      favoriteDestinations: ensuredProfile?.favoriteDestinations ?? [],
      updatedAt: ensuredProfile?.updatedAt ?? new Date(),
    };
  }),

  updateMine: protectedProcedure.input(updateProfileSchema).handler(async ({ context, input }) => {
    const sessionUser = context.session.user;
    const userId = sessionUser.id;
    await ensureProfile(userId);

    const profileChanges: {
      description?: string;
      favoriteDestinations?: string[];
      avatarUrl?: string | null;
    } = {};

    if (input.description !== undefined) {
      profileChanges.description = input.description;
    }

    if (input.favoriteDestinations !== undefined) {
      profileChanges.favoriteDestinations = sanitizeDestinations(input.favoriteDestinations);
    }

    if (input.avatarUrl !== undefined) {
      profileChanges.avatarUrl = input.avatarUrl;
    }

    if (Object.keys(profileChanges).length > 0) {
      await db
        .update(profile)
        .set(profileChanges)
        .where(eq(profile.userId, userId));
    }

    if (input.avatarUrl !== undefined && sessionUser.image !== input.avatarUrl) {
      await db
        .update(user)
        .set({
          image: input.avatarUrl,
        })
        .where(eq(user.id, userId));
    }

    const updatedRows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    const updated = updatedRows[0];

    return {
      userId,
      name: sessionUser.name,
      email: sessionUser.email,
      avatarUrl: updated?.avatarUrl ?? input.avatarUrl ?? sessionUser.image ?? null,
      description: updated?.description ?? "",
      favoriteDestinations: updated?.favoriteDestinations ?? [],
      updatedAt: updated?.updatedAt ?? new Date(),
    };
  }),

};
