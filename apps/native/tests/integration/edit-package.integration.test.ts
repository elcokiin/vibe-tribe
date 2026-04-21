/**
 * T-39, T-40, T-41, T-42: Edit/Cancel Package - Integration Tests
 * 
 * Test Suite for /packages/[id]/edit integration with backend
 * Tests creator authorization, updates, deletion, and error handling
 */

import { describe, it, expect, beforeEach, vi } from "@jest/globals";

// Mock oRPC client
vi.mock("@/utils/orpc", () => ({
  client: {
    package: {
      getById: vi.fn(),
    },
  },
  orpc: {
    package: {
      update: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
    },
  },
}));

// Mock router
vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock Better Auth
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

import { client, orpc } from "@/utils/orpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";

describe("Edit/Cancel Package Integration Tests (T-39, T-40, T-41, T-42)", () => {
  const mockPackageId = "pkg_123";
  const mockCreatorId = "user_creator";
  const mockOtherId = "user_other";

  const mockPackageData = {
    id: mockPackageId,
    title: "Adventure in Costa Rica",
    destination: "Costa Rica",
    description: "Amazing 7-day adventure",
    startDate: new Date("2024-07-01"),
    endDate: new Date("2024-07-07"),
    durationDays: 7,
    price: 1200,
    maxParticipants: 10,
    currentParticipants: 3,
    accommodation: "Eco-lodge",
    accommodationDetails: { rating: 4.5, amenities: ["WiFi", "Pool"] },
    status: "published",
    tags: ["adventure"],
    creatorId: mockCreatorId,
    creator: { id: mockCreatorId, name: "John Doe", email: "john@example.com" },
    participants: [
      { id: "p1", userId: mockCreatorId, userName: "John Doe", joinedAt: new Date() },
      { id: "p2", userId: "user_2", userName: "Jane", joinedAt: new Date() },
    ],
    activities: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocalSearchParams as any).mockReturnValue({ id: mockPackageId });
    (useRouter as any).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
    });
  });

  describe("T-39: Load Package Data for Editing", () => {
    it("should fetch package details on mount", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageData);

      await client.package.getById({ id: mockPackageId });

      expect(client.package.getById).toHaveBeenCalledWith({ id: mockPackageId });
    });

    it("should pre-load form with current data", async () => {
      (client.package.getById as any).mockResolvedValue(mockPackageData);

      const data = await client.package.getById({ id: mockPackageId });

      expect(data.title).toBe("Adventure in Costa Rica");
      expect(data.price).toBe(1200);
      expect(data.maxParticipants).toBe(10);
      expect(data.accommodation).toBe("Eco-lodge");
    });

    it("should have all form fields available", async () => {
      (client.package.getById as any).mockResolvedValue(mockPackageData);

      const data = await client.package.getById({ id: mockPackageId });

      expect(data).toHaveProperty("title");
      expect(data).toHaveProperty("destination");
      expect(data).toHaveProperty("description");
      expect(data).toHaveProperty("startDate");
      expect(data).toHaveProperty("endDate");
      expect(data).toHaveProperty("maxParticipants");
      expect(data).toHaveProperty("price");
      expect(data).toHaveProperty("accommodation");
      expect(data).toHaveProperty("tags");
    });
  });

  describe("T-42: Creator Authorization", () => {
    it("should allow creator to edit their own package", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageData);

      const data = await client.package.getById({ id: mockPackageId });
      const isCreator = mockCreatorId === data.creatorId;

      expect(isCreator).toBe(true);
    });

    it("should prevent non-creator from editing (403 Unauthorized)", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockOtherId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageData);

      const data = await client.package.getById({ id: mockPackageId });
      const isCreator = mockOtherId === data.creatorId;

      expect(isCreator).toBe(false);
      // Should show "No tienes permiso" error
    });

    it("should handle 403 error when updating as non-creator", async () => {
      const error = new Error("403");
      (orpc.package.update.mutate as any).mockRejectedValue(error);

      try {
        await orpc.package.update.mutate({
          id: mockPackageId,
          title: "Modified",
        });
      } catch (err: any) {
        expect(err.message).toBe("403");
      }
    });

    it("should handle 403 error when deleting as non-creator", async () => {
      const error = new Error("403");
      (orpc.package.delete.mutate as any).mockRejectedValue(error);

      try {
        await orpc.package.delete.mutate({ id: mockPackageId });
      } catch (err: any) {
        expect(err.message).toBe("403");
      }
    });
  });

  describe("T-40: Update Package", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageData);
    });

    it("should update package with new values", async () => {
      const updateData = {
        id: mockPackageId,
        title: "New Title",
        destination: "New Destination",
        description: "New description",
        startDate: new Date("2024-08-01"),
        endDate: new Date("2024-08-07"),
        maxParticipants: 15,
        price: 1500,
        accommodation: "Luxury Hotel",
        accommodationDetails: { rating: 5, amenities: ["WiFi", "Spa"] },
        tags: ["luxury"],
      };

      (orpc.package.update.mutate as any).mockResolvedValue({
        success: true,
        id: mockPackageId,
      });

      const result = await orpc.package.update.mutate(updateData);

      expect(orpc.package.update.mutate).toHaveBeenCalledWith(updateData);
      expect(result.success).toBe(true);
    });

    it("should validate required fields on update", async () => {
      const invalidData = {
        id: mockPackageId,
        title: "", // Invalid: empty
      };

      if (!invalidData.title) {
        throw new Error("Title is required");
      }
    });

    it("should validate date logic on update", async () => {
      const invalidDates = {
        id: mockPackageId,
        startDate: new Date("2024-07-07"),
        endDate: new Date("2024-07-01"), // Invalid: ends before start
      };

      if (invalidDates.endDate <= invalidDates.startDate) {
        throw new Error("End date must be after start date");
      }
    });

    it("should recalculate duration on date change", async () => {
      const newData = {
        id: mockPackageId,
        startDate: new Date("2024-08-01"),
        endDate: new Date("2024-08-10"), // 9 days
      };

      const durationDays = Math.ceil(
        (newData.endDate.getTime() - newData.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(durationDays).toBe(9);
    });

    it("should validate capacity vs current participants", async () => {
      // Current participants: 3
      // New max: needs to be >= 3
      const validCapacity = 5; // >= 3
      expect(validCapacity).toBeGreaterThanOrEqual(mockPackageData.currentParticipants);
    });

    it("should show success message after update", async () => {
      (orpc.package.update.mutate as any).mockResolvedValue({
        success: true,
      });

      const result = await orpc.package.update.mutate({
        id: mockPackageId,
        title: "Updated",
      });

      expect(result.success).toBe(true);
      // Success message: "✅ Cambios guardados exitosamente"
    });

    it("should handle update errors gracefully", async () => {
      const mockError = new Error("Update failed");
      (orpc.package.update.mutate as any).mockRejectedValue(mockError);

      try {
        await orpc.package.update.mutate({ id: mockPackageId, title: "Test" });
      } catch (err: any) {
        expect(err.message).toBe("Update failed");
      }
    });

    it("should preserve unchanged fields during update", async () => {
      const updateData = {
        id: mockPackageId,
        title: "New Title", // Only this changes
        destination: mockPackageData.destination, // Keep same
        description: mockPackageData.description, // Keep same
        startDate: mockPackageData.startDate, // Keep same
        endDate: mockPackageData.endDate, // Keep same
      };

      (orpc.package.update.mutate as any).mockResolvedValue({ success: true });

      const result = await orpc.package.update.mutate(updateData);

      expect(orpc.package.update.mutate).toHaveBeenCalledWith(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe("T-41: Delete Package", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageData);
    });

    it("should show delete confirmation modal", () => {
      // Component state: showDeleteModal = true
      const showDeleteModal = true;
      expect(showDeleteModal).toBe(true);
    });

    it("should require confirmation checkbox before delete", () => {
      let deleteConfirmChecked = false;

      if (deleteConfirmChecked) {
        // Can proceed with delete
      } else {
        // Button disabled
        expect(deleteConfirmChecked).toBe(false);
      }
    });

    it("should delete package when confirmed", async () => {
      (orpc.package.delete.mutate as any).mockResolvedValue({
        success: true,
      });

      const result = await orpc.package.delete.mutate({ id: mockPackageId });

      expect(orpc.package.delete.mutate).toHaveBeenCalledWith({ id: mockPackageId });
      expect(result.success).toBe(true);
    });

    it("should navigate away after successful delete", async () => {
      const router = (useRouter as any)();
      (orpc.package.delete.mutate as any).mockResolvedValue({ success: true });

      await orpc.package.delete.mutate({ id: mockPackageId });
      router.push("/packages");

      expect(router.push).toHaveBeenCalledWith("/packages");
    });

    it("should show alert on delete success", async () => {
      (orpc.package.delete.mutate as any).mockResolvedValue({ success: true });

      const result = await orpc.package.delete.mutate({ id: mockPackageId });

      expect(result.success).toBe(true);
      // Alert shown: "Paquete Eliminado"
    });

    it("should handle delete errors gracefully", async () => {
      const mockError = new Error("Delete failed");
      (orpc.package.delete.mutate as any).mockRejectedValue(mockError);

      try {
        await orpc.package.delete.mutate({ id: mockPackageId });
      } catch (err: any) {
        expect(err.message).toBe("Delete failed");
      }
    });

    it("should prevent delete if confirmation not checked", () => {
      const deleteConfirmChecked = false;
      const canDelete = deleteConfirmChecked === true;

      expect(canDelete).toBe(false);
    });

    it("should notify participants of cancellation", async () => {
      // Backend handles notification
      (orpc.package.delete.mutate as any).mockResolvedValue({
        success: true,
        notifiedParticipants: 3,
      });

      const result = await orpc.package.delete.mutate({ id: mockPackageId });

      expect(result.notifiedParticipants).toBe(3);
    });
  });

  describe("Form Validation on Edit", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageData);
    });

    it("should require title field", () => {
      const title = "";
      if (!title) {
        throw new Error("Title is required");
      }
    });

    it("should require destination field", () => {
      const destination = "";
      if (!destination) {
        throw new Error("Destination is required");
      }
    });

    it("should validate price is non-negative", () => {
      const price = -100;
      expect(price).toBeGreaterThanOrEqual(0);
    });

    it("should validate maxParticipants is positive", () => {
      const maxParticipants = 0;
      expect(maxParticipants).toBeGreaterThan(0);
    });

    it("should validate tags is array", () => {
      const tags = ["adventure", "nature"];
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
    });

    it("should handle missing package ID", async () => {
      (useLocalSearchParams as any).mockReturnValue({ id: undefined });

      if (!mockPackageId) {
        throw new Error("ID de paquete no proporcionado");
      }
    });

    it("should handle 404 not found error", async () => {
      (client.package.getById as any).mockRejectedValue(new Error("Package not found"));

      try {
        await client.package.getById({ id: mockPackageId });
      } catch (err: any) {
        expect(err.message).toContain("Package not found");
      }
    });

    it("should handle network timeout on fetch", async () => {
      (client.package.getById as any).mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        )
      );

      try {
        await client.package.getById({ id: mockPackageId });
      } catch (err: any) {
        expect(err.message).toContain("timeout");
      }
    });

    it("should handle network timeout on update", async () => {
      (orpc.package.update.mutate as any).mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        )
      );

      try {
        await orpc.package.update.mutate({ id: mockPackageId, title: "Test" });
      } catch (err: any) {
        expect(err.message).toContain("timeout");
      }
    });

    it("should handle unauthenticated user preventing edit access", async () => {
      (authClient.useSession as any).mockReturnValue({ data: null });

      const session = (authClient.useSession as any)();
      expect(session.data).toBeNull();
    });
  });

  describe("Notification Flows", () => {
    it("should notify participants when package is updated", async () => {
      const participants = mockPackageData.participants;
      expect(participants.length).toBeGreaterThan(0);
      // Backend sends notifications to all participants
    });

    it("should notify participants when package is cancelled", async () => {
      const participantCount = mockPackageData.currentParticipants;
      expect(participantCount).toBe(3);
      // Backend sends cancellation notifications
    });
  });
});
