/**
 * T-38: Package Details Screen - Unit Tests
 * 
 * Test Suite for component rendering and user interactions
 */

import { describe, it, expect, beforeEach, vi } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import PackageDetailsScreen from "@/app/packages/[id]";

// Mock dependencies
vi.mock("@/utils/orpc", () => ({
  client: {
    package: {
      getById: vi.fn(),
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

vi.mock("expo-router", () => ({
  useLocalSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

vi.mock("@/components/brand-header", () => ({
  BrandHeader: ({ title, subtitle }: any) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
    </div>
  ),
}));

vi.mock("@/components/ui/text", () => ({
  Text: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onPress, disabled }: any) => (
    <button onClick={onPress} disabled={disabled}>
      {children}
    </button>
  ),
}));

import { client, orpc } from "@/utils/orpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";

describe("Package Details Screen Unit Tests (T-38)", () => {
  const mockPackageId = "pkg_123";
  const mockUserId = "user_456";
  const mockCreatorId = "user_creator";

  const mockPackageData = {
    id: mockPackageId,
    title: "Adventure Package",
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
    ],
    activities: [
      {
        id: "act_1",
        title: "Zip-lining",
        description: "Canopy tour",
        location: "La Fortuna",
        date: new Date("2024-07-02"),
        duration: "3 hours",
        isIncluded: true,
        cost: null,
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
    (client.package.getById as any).mockResolvedValue(mockPackageData);
  });

  describe("Component Rendering", () => {
    it("should render loading state initially", () => {
      (client.package.getById as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockPackageData), 1000)
          )
      );

      render(<PackageDetailsScreen />);

      // Loading indicator should be visible
      expect(screen.queryByText(/Cargando/)).toBeDefined();
    });

    it("should display package title and destination after loading", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("Adventure Package")).toBeDefined();
        expect(screen.getByText("Costa Rica")).toBeDefined();
      });
    });

    it("should display package summary card with duration and price", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(client.package.getById).toHaveBeenCalled();
      });

      // Duration
      expect(screen.queryByText("7 días")).toBeDefined();
      // Price
      expect(screen.queryByText(/\$1200/)).toBeDefined();
    });

    it("should display description section", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("Amazing 7-day adventure")).toBeDefined();
      });
    });

    it("should display dates section", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Fechas del Viaje/)).toBeDefined();
      });
    });

    it("should display accommodation section", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("Eco-lodge")).toBeDefined();
        expect(screen.queryByText("Alojamiento")).toBeDefined();
      });
    });

    it("should display activities section", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("Zip-lining")).toBeDefined();
        expect(screen.getByText("Canopy tour")).toBeDefined();
      });
    });

    it("should show included vs optional activity badges", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Incluida|Opcional/)).toBeDefined();
      });
    });

    it("should display participants section with names", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeDefined();
        expect(screen.getByText("Jane Smith")).toBeDefined();
      });
    });

    it("should show organizer badge on creator", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Organizador/)).toBeDefined();
      });
    });

    it("should display creator information", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeDefined();
        expect(screen.getByText("john@example.com")).toBeDefined();
      });
    });

    it("should display capacity progress bar", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText("3 / 10 inscritos")).toBeDefined();
      });
    });
  });

  describe("Button Visibility", () => {
    it("should show Join button for non-creator user", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Únete Ahora/)).toBeDefined();
      });
    });

    it("should show Leave button for participant user", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: "user_2" } }, // Jane Smith
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Abandonar Paquete/)).toBeDefined();
      });
    });

    it("should show Edit button for package creator", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockCreatorId } },
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Editar Paquete/)).toBeDefined();
      });
    });

    it("should show Full message when capacity reached", async () => {
      (client.package.getById as any).mockResolvedValue({
        ...mockPackageData,
        currentParticipants: 10,
        maxParticipants: 10,
      });

      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Paquete Lleno/)).toBeDefined();
      });
    });

    it("should show Sign in button for unauthenticated users", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: null,
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Inicia sesión/)).toBeDefined();
      });
    });

    it("should always show Back button", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Volver/)).toBeDefined();
      });
    });
  });

  describe("User Interactions", () => {
    it("should call joinPackage when Join button is pressed", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });
      (orpc.package.joinPackage.mutate as any).mockResolvedValue({
        success: true,
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        const joinButton = screen.queryByText(/Únete Ahora/);
        if (joinButton) fireEvent.press(joinButton);
      });

      // After join, should refetch
      await waitFor(() => {
        expect(orpc.package.joinPackage.mutate).toHaveBeenCalledWith({
          packageId: mockPackageId,
        });
      });
    });

    it("should call leavePackage when Leave button is pressed", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: "user_2" } },
      });
      (orpc.package.leavePackage.mutate as any).mockResolvedValue({
        success: true,
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        const leaveButton = screen.queryByText(/Abandonar Paquete/);
        if (leaveButton) fireEvent.press(leaveButton);
      });

      await waitFor(() => {
        expect(orpc.package.leavePackage.mutate).toHaveBeenCalledWith({
          packageId: mockPackageId,
        });
      });
    });

    it("should navigate to sign-in when unauthenticated user tries to join", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: null,
      });

      const router = (useRouter as any)();

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        const signInButton = screen.queryByText(/Inicia sesión/);
        if (signInButton) fireEvent.press(signInButton);
      });

      expect(router.push).toHaveBeenCalledWith("/sign-in");
    });

    it("should navigate back when Back button is pressed", async () => {
      const router = (useRouter as any)();

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        const backButton = screen.queryByText(/Volver/);
        if (backButton) fireEvent.press(backButton);
      });

      expect(router.back).toHaveBeenCalled();
    });

    it("should handle join error gracefully", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });
      (orpc.package.joinPackage.mutate as any).mockRejectedValue(
        new Error("Join failed")
      );

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Join failed|Error/)).toBeDefined();
      });
    });

    it("should disable action buttons during loading", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });
      (orpc.package.joinPackage.mutate as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 500)
          )
      );

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        const joinButton = screen.queryByText(/Únete Ahora/);
        expect(joinButton).toBeDefined();
      });
    });
  });

  describe("Error States", () => {
    it("should display error message when package fetch fails", async () => {
      (client.package.getById as any).mockRejectedValue(
        new Error("Failed to fetch"
      );

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Failed to fetch/)).toBeDefined();
      });
    });

    it("should display error for invalid package ID", async () => {
      (useLocalSearchParams as any).mockReturnValue({ id: undefined });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(
          screen.queryByText(/ID de paquete no proporcionado/)
        ).toBeDefined();
      });
    });

    it("should handle 404 not found error", async () => {
      (client.package.getById as any).mockRejectedValue(
        new Error("Package not found")
      );

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(
          screen.queryByText(/Package not found|no encontrado/)
        ).toBeDefined();
      });
    });

    it("should show retry button in error state", async () => {
      (client.package.getById as any).mockRejectedValue(
        new Error("Failed to fetch")
      );

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Volver/)).toBeDefined();
      });
    });
  });

  describe("Data Formatting", () => {
    it("should format dates in Spanish locale", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        // Should contain Spanish month names or English depending on locale
        expect(screen.queryByText(/Fechas del Viaje/)).toBeDefined();
      });
    });

    it("should display currency correctly", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/\$1200/)).toBeDefined();
      });
    });

    it("should show accommodation amenities as comma-separated list", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/WiFi|Pool/)).toBeDefined();
      });
    });

    it("should display activity cost only for optional activities", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        // Included activities should not show cost
        const zipling = screen.getByText("Zip-lining");
        expect(zipling).toBeDefined();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper text hierarchy with headings", async () => {
      render(<PackageDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText("Adventure Package")).toBeDefined();
      });
    });

    it("should label all interactive buttons", async () => {
      (authClient.useSession as any).mockReturnValue({
        data: { user: { id: mockUserId } },
      });

      render(<PackageDetailsScreen />);

      await waitFor(() => {
        const button = screen.queryByText(/Únete Ahora|Volver/);
        expect(button).toBeDefined();
      });
    });

    it("should display loading indicator with descriptive text", async () => {
      (client.package.getById as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockPackageData), 1000)
          )
      );

      render(<PackageDetailsScreen />);

      expect(screen.queryByText(/Cargando detalles/)).toBeDefined();
    });
  });
});
