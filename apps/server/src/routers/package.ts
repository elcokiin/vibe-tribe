import { db } from "@vibetribe/db";
import { package as packageTable, packageParticipant, packageActivity } from "@vibetribe/db/schema/package";
import { user } from "@vibetribe/db/schema/auth";
import { profile } from "@vibetribe/db/schema/profile";
import { eq, and, desc, like, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";

import { protectedProcedure, publicProcedure } from "../procedure.js";

/**
 * Validation schemas
 */
const createPackageSchema = z.object({
  destination: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(10).max(2000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxParticipants: z.number().int().min(1).max(1000),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  accommodation: z.string().trim().max(200).nullable().optional(),
  accommodationDetails: z.object({
    name: z.string().trim().max(200),
    rating: z.number().min(0).max(5),
    amenities: z.array(z.string()).max(20),
  }).nullable().optional(),
  tags: z.array(z.string().trim().max(50)).max(10).default([]),
});

const updatePackageSchema = createPackageSchema.partial().extend({
  status: z.enum(["draft", "published", "cancelled"]).optional(),
});

const searchPackagesSchema = z.object({
  destination: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  minDuration: z.number().int().min(1).optional(),
  maxDuration: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["newest", "oldest", "price-asc", "price-desc", "duration-asc", "duration-desc"]).default("newest"),
});

const createActivitySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000),
  date: z.coerce.date(),
  location: z.string().trim().min(1).max(200),
  duration: z.string().trim().min(1).max(100),
  isIncluded: z.boolean().default(true),
  cost: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
});

/**
 * Helper to calculate duration in days
 */
function calculateDurationDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export const packageRouter = {
  /**
   * CREATE: Create a new travel package
   * Only authenticated users can create packages
   * Creator is automatically added as first participant
   */
  create: protectedProcedure
    .input(createPackageSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      
      // Validate dates
      if (input.startDate >= input.endDate) {
        throw new Error("End date must be after start date");
      }

      const packageId = nanoid();
      const durationDays = calculateDurationDays(input.startDate, input.endDate);

      // Insert package
      await db.insert(packageTable).values({
        id: packageId,
        creatorId: userId,
        destination: input.destination,
        title: input.title,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        durationDays,
        price: input.price,
        maxParticipants: input.maxParticipants,
        currentParticipants: 1, // Creator as first participant
        accommodation: input.accommodation || null,
        accommodationDetails: input.accommodationDetails || null,
        tags: input.tags,
      });

      // Add creator as first participant
      await db.insert(packageParticipant).values({
        id: nanoid(),
        packageId,
        userId,
      });

      return { success: true, id: packageId };
    }),

  /**
   * T-28: GET /packages with real-time filtering
   * Public endpoint - anyone can search packages
   * 
   * Optimized for performance with:
   * - Database indexes on filter columns
   * - Composite indexes for common search patterns
   * - Selective field projection
   * - Efficient query building
   */
  list: publicProcedure
    .input(searchPackagesSchema)
    .handler(async ({ input }) => {
      const whereConditions = [eq(packageTable.status, "published")];

      // T-28: Implementar filtros de búsqueda
      if (input.destination) {
        whereConditions.push(
          like(packageTable.destination, `%${input.destination.trim()}%`)
        );
      }

      if (input.startDate) {
        whereConditions.push(gte(packageTable.startDate, input.startDate));
      }

      if (input.endDate) {
        whereConditions.push(lte(packageTable.endDate, input.endDate));
      }

      if (input.minDuration) {
        whereConditions.push(gte(packageTable.durationDays, input.minDuration));
      }

      if (input.maxDuration) {
        whereConditions.push(lte(packageTable.durationDays, input.maxDuration));
      }

      if (input.minPrice) {
        whereConditions.push(gte(packageTable.price, input.minPrice));
      }

      if (input.maxPrice) {
        whereConditions.push(lte(packageTable.price, input.maxPrice));
      }

      // Build sort clause
      let orderByClause = desc(packageTable.createdAt);
      switch (input.sortBy) {
        case "oldest":
          orderByClause = packageTable.createdAt;
          break;
        case "price-asc":
          orderByClause = packageTable.price;
          break;
        case "price-desc":
          orderByClause = desc(packageTable.price);
          break;
        case "duration-asc":
          orderByClause = packageTable.durationDays;
          break;
        case "duration-desc":
          orderByClause = desc(packageTable.durationDays);
          break;
      }

      // Optimize query with selective field projection
      // Uses indexes on status, destination, startDate, durationDays
      const packages = await db
        .select({
          id: packageTable.id,
          destination: packageTable.destination,
          title: packageTable.title,
          description: packageTable.description,
          startDate: packageTable.startDate,
          endDate: packageTable.endDate,
          durationDays: packageTable.durationDays,
          price: packageTable.price,
          maxParticipants: packageTable.maxParticipants,
          currentParticipants: packageTable.currentParticipants,
          accommodation: packageTable.accommodation,
          creatorName: user.name,
          creatorImage: user.image,
        })
        .from(packageTable)
        .leftJoin(user, eq(packageTable.creatorId, user.id))
        .where(and(...whereConditions))
        .orderBy(orderByClause)
        .limit(input.limit)
        .offset(input.offset);

      return {
        data: packages,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          hasMore: packages.length === input.limit,
        },
      };
    }),

  /**
   * Alias for list - for RESTful compatibility
   * GET /packages -> list
   */
  search: publicProcedure
    .input(searchPackagesSchema)
    .handler(async ({ input, context }) => {
      // Delegate to list
      return context.ctx?.appRouter?.package?.list({ ...input }) || [];
    }),

  /**
   * READ: Get single package details with participants and activities
   * T-43: Enhanced response with participant ratings
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const pkg = await db
        .select()
        .from(packageTable)
        .where(eq(packageTable.id, input.id))
        .limit(1);

      if (!pkg[0]) {
        throw new Error("Package not found");
      }

      const participants = await db
        .select({
          id: packageParticipant.id,
          userId: packageParticipant.userId,
          userName: user.name,
          userImage: user.image,
          joinedAt: packageParticipant.joinedAt,
          averageRating: profile.averageRating,
          totalRatings: profile.totalRatings,
        })
        .from(packageParticipant)
        .leftJoin(user, eq(packageParticipant.userId, user.id))
        .leftJoin(profile, eq(packageParticipant.userId, profile.userId))
        .where(eq(packageParticipant.packageId, input.id));

      const activities = await db
        .select()
        .from(packageActivity)
        .where(eq(packageActivity.packageId, input.id));

      const creator = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, pkg[0].creatorId))
        .limit(1);

      return {
        ...pkg[0],
        creator: creator[0],
        participants: participants.map((p: typeof participants[0]) => ({
          ...p,
          isCreator: p.userId === pkg[0].creatorId,
        })),
        activities,
      };
    }),

  /**
   * UPDATE: Update a package (only by creator)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updatePackageSchema,
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Check if package exists and user is creator
      const pkg = await db
        .select()
        .from(packageTable)
        .where(eq(packageTable.id, input.id))
        .limit(1);

      if (!pkg[0]) {
        throw new Error("Package not found");
      }

      if (pkg[0].creatorId !== userId) {
        throw new Error("Only the package creator can update it");
      }

      // Validate dates if provided
      const startDate = input.data.startDate || pkg[0].startDate;
      const endDate = input.data.endDate || pkg[0].endDate;

      if (startDate >= endDate) {
        throw new Error("End date must be after start date");
      }

      // Calculate new duration if dates changed
      const durationDays =
        input.data.startDate || input.data.endDate
          ? calculateDurationDays(startDate, endDate)
          : pkg[0].durationDays;

      const updateData: Record<string, unknown> = { ...input.data };
      
      if (input.data.startDate || input.data.endDate) {
        updateData.durationDays = durationDays;
      }

      await db
        .update(packageTable)
        .set(updateData)
        .where(eq(packageTable.id, input.id));

      return { success: true };
    }),

  /**
   * DELETE: Delete a package (only by creator)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Check if package exists and user is creator
      const pkg = await db
        .select()
        .from(packageTable)
        .where(eq(packageTable.id, input.id))
        .limit(1);

      if (!pkg[0]) {
        throw new Error("Package not found");
      }

      if (pkg[0].creatorId !== userId) {
        throw new Error("Only the package creator can delete it");
      }

      await db.delete(packageTable).where(eq(packageTable.id, input.id));

      return { success: true };
    }),

  /**
   * Add an activity to a package (only by creator)
   */
  addActivity: protectedProcedure
    .input(
      z.object({
        packageId: z.string(),
        activity: createActivitySchema,
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Check if package exists and user is creator
      const pkg = await db
        .select()
        .from(packageTable)
        .where(eq(packageTable.id, input.packageId))
        .limit(1);

      if (!pkg[0]) {
        throw new Error("Package not found");
      }

      if (pkg[0].creatorId !== userId) {
        throw new Error("Only the package creator can add activities");
      }

      await db.insert(packageActivity).values({
        id: nanoid(),
        packageId: input.packageId,
        title: input.activity.title,
        description: input.activity.description,
        date: input.activity.date,
        location: input.activity.location,
        duration: input.activity.duration,
        isIncluded: input.activity.isIncluded ? 1 : 0,
        cost: input.activity.cost || null,
      });

      return { success: true };
    }),

  /**
   * Join a package as a participant
   */
  joinPackage: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Check if package exists
      const pkg = await db
        .select()
        .from(packageTable)
        .where(eq(packageTable.id, input.packageId))
        .limit(1);

      if (!pkg[0]) {
        throw new Error("Package not found");
      }

      // Check if already a participant
      const existing = await db
        .select()
        .from(packageParticipant)
        .where(
          and(
            eq(packageParticipant.packageId, input.packageId),
            eq(packageParticipant.userId, userId)
          )
        )
        .limit(1);

      if (existing[0]) {
        throw new Error("User is already a participant in this package");
      }

      // Check if package has space
      if (pkg[0].currentParticipants >= pkg[0].maxParticipants) {
        throw new Error("Package is full");
      }

      // Add participant
      await db.insert(packageParticipant).values({
        id: nanoid(),
        packageId: input.packageId,
        userId,
      });

      // Increment current participants
      await db
        .update(packageTable)
        .set({
          currentParticipants: pkg[0].currentParticipants + 1,
        })
        .where(eq(packageTable.id, input.packageId));

      return { success: true };
    }),

  /**
   * Leave a package
   */
  leavePackage: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Check if user is participant
      const participant = await db
        .select()
        .from(packageParticipant)
        .where(
          and(
            eq(packageParticipant.packageId, input.packageId),
            eq(packageParticipant.userId, userId)
          )
        )
        .limit(1);

      if (!participant[0]) {
        throw new Error("User is not a participant in this package");
      }

      // Remove participant
      await db
        .delete(packageParticipant)
        .where(eq(packageParticipant.id, participant[0].id));

      // Decrement current participants
      const pkg = await db
        .select()
        .from(packageTable)
        .where(eq(packageTable.id, input.packageId))
        .limit(1);

      if (pkg[0]) {
        await db
          .update(packageTable)
          .set({
            currentParticipants: Math.max(1, pkg[0].currentParticipants - 1),
          })
          .where(eq(packageTable.id, input.packageId));
      }

      return { success: true };
    }),
};
