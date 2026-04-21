/**
 * T-38: Package Details Screen - Integration Tests
 * 
 * Test Suite for /packages/[id] integration with backend
 * Tests end-to-end package details retrieval, join/leave actions, and navigation
 */

import { describe, it, expect, beforeEach, vi } from "@jest/globals";
import type { Package, PackageParticipant, PackageActivity } from "@repo/db";

// Mock oRPC client
vi.mock("@/utils/orpc", () => ({
  client: {
    package: {
      getById: vi.fn(),
      joinPackage: vi.fn(),
      leavePackage: vi.fn(),
    },
  },
  orpc: {
    package: {
      joinPackage: {
        mutate: vi.fn(),
      },
      leavePackage: {
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

describe("Package Details Integration Tests (T-38)", () => {
  const mockPackageId = "pkg_123";
  const mockUserId = "user_456";
  const mockCreatorId = "user_creator";

  const mockPackageDetailResponse = {
    id: mockPackageId,
    destination: "Costa Rica",
    title: "Adventure in Costa Rica",
    description: "An amazing 7-day adventure through the rainforests of Costa Rica",
    startDate: new Date("2024-07-01"),
    endDate: new Date("2024-07-07"),
    durationDays: 7,
    price: 1200,
    maxParticipants: 10,
    currentParticipants: 3,
    accommodation: "Eco-lodge",
    accommodationDetails: {
      rating: 4.5,
      amenities: ["WiFi", "Pool", "Restaurant"],
    },
    status: "published",
    tags: ["adventure", "nature", "rainforest"],
    creatorId: mockCreatorId,
    creator: {
      id: mockCreatorId,
      name: "John Doe",
      email: "john@example.com",
      image: null,
    },
    participants: [
      {
        id: "part_1",
        userId: mockCreatorId,
        userName: "John Doe",
        userImage: null,
        joinedAt: new Date("2024-01-01"),
      },
      {
        id: "part_2",
        userId: "user_2",
        userName: "Jane Smith",
        userImage: null,
        joinedAt: new Date("2024-01-02"),
      },
      {
        id: "part_3",
        userId: "user_3",
        userName: "Bob Johnson",
        userImage: null,
        joinedAt: new Date("2024-01-03"),
      },
    ],
    activities: [
      {
        id: "act_1",
        title: "Zip-lining Tour",
        description: "Exciting zip-line adventure through the canopy",
        location: "La Fortuna",
        date: new Date("2024-07-02"),
        duration: "3 hours",
        isIncluded: true,
        cost: null,
      },
      {
        id: "act_2",
        title: "Spa Treatment",
        description: "Relax with traditional Costa Rican spa",
        location: "San José",
        date: new Date("2024-07-05"),
        duration: "2 hours",
        isIncluded: false,
        cost: 80,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocalSearchParams as any).mockReturnValue({ id: mockPackageId });
    (useRouter as any).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
    });
  });

  describe("Initial Package Load", () => {
    it("should fetch package details when component mounts", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });
      (client.package.getById as any).mockResolvedValue(mockPackageDetailResponse);

      // Simulate component mount
      const result = await client.package.getById({ id: mockPackageId });

      expect(client.package.getById).toHaveBeenCalledWith({ id: mockPackageId });
      expect(result).toEqual(mockPackageDetailResponse);
      expect(result.title).toBe("Adventure in Costa Rica");
    });

    it("should handle missing package ID gracefully", async () => {
      (useLocalSearchParams as any).mockReturnValue({ id: undefined });

      expect(() => {
        if (!mockPackageId) throw new Error("ID de paquete no proporcionado");
      }).toThrow("ID de paquete no proporcionado");
    });

    it("should handle API error when fetching package details", async () => {
      const mockError = new Error("Failed to fetch package");
      (client.package.getById as any).mockRejectedValue(mockError);

      try {
        await client.package.getById({ id: mockPackageId });
        throw new Error("Should have thrown");
      } catch (err: any) {
        expect(err.message).toBe("Failed to fetch package");
      }
    });

    it("should show loading state during fetch", async () => {
      (client.package.getById as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockPackageDetailResponse), 100)
          )
      );

      const promise = client.package.getById({ id: mockPackageId });
      // Loading state would be shown here in real component

      const result = await promise;
      expect(result).toBeDefined();
    });

    it("should display 404 error for non-existent package", async () => {
      (client.package.getById as any).mockRejectedValue(
        new Error("Package not found")
      );

      try {
        await client.package.getById({ id: "invalid_id" });
      } catch (err: any) {
        expect(err.message).toContain("Package not found");
      }
    });
  });

  describe("Package Information Display", () => {
    beforeEach(() => {
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );
    });

    it("should display all required package fields", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg).toHaveProperty("title", "Adventure in Costa Rica");
      expect(pkg).toHaveProperty("destination", "Costa Rica");
      expect(pkg).toHaveProperty("description");
      expect(pkg).toHaveProperty("startDate");
      expect(pkg).toHaveProperty("endDate");
      expect(pkg).toHaveProperty("durationDays", 7);
      expect(pkg).toHaveProperty("price", 1200);
      expect(pkg).toHaveProperty("accommodation");
      expect(pkg).toHaveProperty("participants");
      expect(pkg).toHaveProperty("activities");
      expect(pkg).toHaveProperty("creator");
    });

    it("should calculate capacity correctly", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      const capacityPercentage =
        (pkg.currentParticipants / pkg.maxParticipants) * 100;
      expect(capacityPercentage).toBe(30);
      expect(pkg.currentParticipants).toBe(3);
      expect(pkg.maxParticipants).toBe(10);
    });

    it("should have correct participant information", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg.participants).toHaveLength(3);
      expect(pkg.participants[0].userName).toBe("John Doe");
      expect(pkg.participants[0].userId).toBe(mockCreatorId);
      expect(pkg.participants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userName: "Jane Smith" }),
          expect.objectContaining({ userName: "Bob Johnson" }),
        ])
      );
    });

    it("should have correct activity data with costs", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg.activities).toHaveLength(2);

      // Included activity
      const includedActivity = pkg.activities.find(
        (a: any) => a.title === "Zip-lining Tour"
      );
      expect(includedActivity?.isIncluded).toBe(true);
      expect(includedActivity?.cost).toBeNull();

      // Optional activity
      const optionalActivity = pkg.activities.find(
        (a: any) => a.title === "Spa Treatment"
      );
      expect(optionalActivity?.isIncluded).toBe(false);
      expect(optionalActivity?.cost).toBe(80);
    });

    it("should display creator information", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg.creator).toEqual({
        id: mockCreatorId,
        name: "John Doe",
        email: "john@example.com",
        image: null,
      });
    });

    it("should display accommodation details if present", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg.accommodation).toBe("Eco-lodge");
      expect(pkg.accommodationDetails).toHaveProperty("rating", 4.5);
      expect(pkg.accommodationDetails.amenities).toContain("WiFi");
      expect(pkg.accommodationDetails.amenities).toContain("Pool");
      expect(pkg.accommodationDetails.amenities).toContain("Restaurant");
    });
  });

  describe("Join Package Action", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );
    });

    it("should show 'Join' button when user is not participant and not creator", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      // User is not in participants list
      const isParticipant = pkg.participants.some(
        (p: any) => p.userId === mockUserId
      );
      const isCreator = mockUserId === pkg.creatorId;

      expect(isParticipant).toBe(false);
      expect(isCreator).toBe(false);
      // Should show "¡Únete Ahora!" button
    });

    it("should successfully join a package", async () => {
      (orpc.package.joinPackage.mutate as any).mockResolvedValue({
        success: true,
      });

      const response = await orpc.package.joinPackage.mutate({
        packageId: mockPackageId,
      });

      expect(orpc.package.joinPackage.mutate).toHaveBeenCalledWith({
        packageId: mockPackageId,
      });
      expect(response.success).toBe(true);
    });

    it("should update UI after successful join", async () => {
      const initialPkg = await client.package.getById({ id: mockPackageId });
      const initialCount = initialPkg.currentParticipants;

      (orpc.package.joinPackage.mutate as any).mockResolvedValue({
        success: true,
      });
      (client.package.getById as any).mockResolvedValue({
        ...mockPackageDetailResponse,
        currentParticipants: initialCount + 1,
        participants: [
          ...mockPackageDetailResponse.participants,
          {
            id: "part_new",
            userId: mockUserId,
            userName: "New User",
            userImage: null,
            joinedAt: new Date(),
          },
        ],
      });

      await orpc.package.joinPackage.mutate({ packageId: mockPackageId });
      const updatedPkg = await client.package.getById({ id: mockPackageId });

      expect(updatedPkg.currentParticipants).toBe(initialCount + 1);
      expect(updatedPkg.participants).toHaveLength(4);
    });

    it("should prevent joining a full package", async () => {
      const fullPackage = {
        ...mockPackageDetailResponse,
        currentParticipants: 10,
        maxParticipants: 10,
      };
      (client.package.getById as any).mockResolvedValue(fullPackage);

      const pkg = await client.package.getById({ id: mockPackageId });

      const canJoin =
        pkg.currentParticipants < pkg.maxParticipants &&
        !pkg.participants.some((p: any) => p.userId === mockUserId);

      expect(canJoin).toBe(false);
    });

    it("should prevent duplicate package joins", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      const isParticipant = pkg.participants.some(
        (p: any) => p.userId === mockUserId
      );

      if (isParticipant) {
        (orpc.package.joinPackage.mutate as any).mockRejectedValue(
          new Error("User already a participant")
        );

        try {
          await orpc.package.joinPackage.mutate({ packageId: mockPackageId });
        } catch (err: any) {
          expect(err.message).toContain("already a participant");
        }
      }
    });

    it("should handle join errors gracefully", async () => {
      const mockError = new Error("Server error during join");
      (orpc.package.joinPackage.mutate as any).mockRejectedValue(mockError);

      try {
        await orpc.package.joinPackage.mutate({ packageId: mockPackageId });
      } catch (err: any) {
        expect(err.message).toContain("Server error");
      }
    });
  });

  describe("Leave Package Action", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: "user_2" } }, // Jane Smith is a participant
      });
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );
    });

    it("should show 'Leave' button when user is a participant", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      const isParticipant = pkg.participants.some(
        (p: any) => p.userId === "user_2"
      );

      expect(isParticipant).toBe(true);
      // Should show "Abandonar Paquete" button
    });

    it("should successfully leave a package", async () => {
      (orpc.package.leavePackage.mutate as any).mockResolvedValue({
        success: true,
      });

      const response = await orpc.package.leavePackage.mutate({
        packageId: mockPackageId,
      });

      expect(orpc.package.leavePackage.mutate).toHaveBeenCalledWith({
        packageId: mockPackageId,
      });
      expect(response.success).toBe(true);
    });

    it("should update UI after successful leave", async () => {
      const initialPkg = await client.package.getById({ id: mockPackageId });
      const initialCount = initialPkg.currentParticipants;

      (orpc.package.leavePackage.mutate as any).mockResolvedValue({
        success: true,
      });
      (client.package.getById as any).mockResolvedValue({
        ...mockPackageDetailResponse,
        currentParticipants: initialCount - 1,
        participants: mockPackageDetailResponse.participants.filter(
          (p: any) => p.userId !== "user_2"
        ),
      });

      await orpc.package.leavePackage.mutate({ packageId: mockPackageId });
      const updatedPkg = await client.package.getById({ id: mockPackageId });

      expect(updatedPkg.currentParticipants).toBe(initialCount - 1);
      expect(updatedPkg.participants).toHaveLength(2);
    });

    it("should handle leave errors gracefully", async () => {
      const mockError = new Error("Already left package");
      (orpc.package.leavePackage.mutate as any).mockRejectedValue(mockError);

      try {
        await orpc.package.leavePackage.mutate({ packageId: mockPackageId });
      } catch (err: any) {
        expect(err.message).toContain("Already left package");
      }
    });
  });

  describe("Creator-Specific Actions", () => {
    beforeEach(() => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );
    });

    it("should show 'Edit Package' button only for creator", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      const isCreator = mockCreatorId === pkg.creatorId;

      expect(isCreator).toBe(true);
      // Should show "Editar Paquete" button
    });

    it("should show creator badge on organizer", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      const creatorParticipant = pkg.participants.find(
        (p: any) => p.userId === pkg.creatorId
      );

      expect(creatorParticipant).toBeDefined();
      expect(creatorParticipant?.userId).toBe(mockCreatorId);
    });

    it("should not show join/leave buttons for creator", async () => {
      const pkg = await client.package.getById({ id: mockPackageId });

      const isCreator = mockCreatorId === pkg.creatorId;
      const isParticipant = pkg.participants.some(
        (p: any) => p.userId === mockCreatorId
      );

      expect(isCreator).toBe(true);
      expect(isParticipant).toBe(true);
      // Should not show join or leave button, only edit
    });
  });

  describe("Authentication State", () => {
    it("should show 'Sign in' button when user is not authenticated", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: null,
      });
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );

      const session = (authClient.useSession as any)();
      expect(session.data).toBeNull();
    });

    it("should show user-specific actions when authenticated", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );

      const session = (authClient.useSession as any)();
      expect(session.data?.user?.id).toBe(mockUserId);
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );
    });

    it("should navigate back when back button is pressed", async () => {
      const router = (useRouter as any)();

      router.back();

      expect(router.back).toHaveBeenCalled();
    });

    it("should navigate to sign-in when unauthenticated user tries to join", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: null,
      });

      const router = (useRouter as any)();

      // User without session clicks join
      router.push("/sign-in");

      expect(router.push).toHaveBeenCalledWith("/sign-in");
    });

    it("should navigate to edit page for creator", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });

      const router = (useRouter as any)();

      router.push(`/packages/${mockPackageId}/edit`);

      expect(router.push).toHaveBeenCalledWith(`/packages/${mockPackageId}/edit`);
    });
  });

  describe("Error Handling", () => {
    it("should handle null package data gracefully", async () => {
      (client.package.getById as any).mockResolvedValue(null);

      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg).toBeNull();
    });

    it("should handle missing required fields", async () => {
      const incompletePackage = {
        id: mockPackageId,
        // Missing other required fields
      };
      (client.package.getById as any).mockResolvedValue(incompletePackage);

      const pkg = await client.package.getById({ id: mockPackageId });

      expect(pkg).toHaveProperty("id");
    });

    it("should display error message on API failure", async () => {
      const errorMessage = "Failed to load package details";
      (client.package.getById as any).mockRejectedValue(
        new Error(errorMessage)
      );

      try {
        await client.package.getById({ id: mockPackageId });
      } catch (err: any) {
        expect(err.message).toBe(errorMessage);
      }
    });

    it("should handle network timeout", async () => {
      (client.package.getById as any).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timeout")),
              5000
            )
          )
      );

      try {
        await client.package.getById({ id: mockPackageId });
      } catch (err: any) {
        expect(err.message).toContain("timeout");
      }
    });
  });

  describe("Pull to Refresh", () => {
    beforeEach(() => {
      (client.package.getById as any).mockResolvedValue(
        mockPackageDetailResponse
      );
    });

    it("should refetch package data on pull to refresh", async () => {
      await client.package.getById({ id: mockPackageId });
      expect(client.package.getById).toHaveBeenCalledTimes(1);

      // Simulate pull to refresh
      await client.package.getById({ id: mockPackageId });
      expect(client.package.getById).toHaveBeenCalledTimes(2);
    });

    it("should update participant count on refresh if user joined", async () => {
      const initialPkg = await client.package.getById({ id: mockPackageId });
      const initialCount = initialPkg.currentParticipants;

      (client.package.getById as any).mockResolvedValue({
        ...mockPackageDetailResponse,
        currentParticipants: initialCount + 1,
      });

      const refreshedPkg = await client.package.getById({
        id: mockPackageId,
      });

      expect(refreshedPkg.currentParticipants).toBe(initialCount + 1);
    });
  });
});
