import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";

import HomeScreen from "@/app/home";
import { AppThemeProvider } from "@/contexts/app-theme-context";

const { mockUseSession } = require("@/tests/mocks/auth-client");
const { mockHealthCheckQueryOptions, mockProfileGetMineQueryOptions } = require("@/tests/mocks/orpc");
const { mockRouterPush } = require("@/tests/mocks/router");

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return renderWithClient(
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <HomeScreen />
      </AppThemeProvider>
    </QueryClientProvider>,
  );
}

function renderWithClient(ui: ReactElement) {
  const { render } = require("@testing-library/react-native");
  return render(ui);
}

describe("home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHealthCheckQueryOptions.mockReturnValue({
      queryKey: ["healthCheck"],
      queryFn: async () => "OK",
    });
    mockProfileGetMineQueryOptions.mockReturnValue({
      queryKey: ["profile", "getMine"],
      queryFn: async () => ({
        userId: "1",
        name: "Test User",
        email: "test@mail.com",
        avatarUrl: null,
        description: "Bio inicial",
        favoriteDestinations: ["Cusco"],
        updatedAt: new Date(),
      }),
    });
  });

  it("redirects to sign-in when there is no session", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    renderHome();

    expect(screen.getByText("REDIRECT:/sign-in")).toBeOnTheScreen();
  });

  it("shows live badge when health check succeeds", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", emailVerified: true } }, isPending: false });
    renderHome();

    await waitFor(() => {
      expect(screen.getByText("LIVE")).toBeOnTheScreen();
      expect(screen.getByText("Connection is healthy.")).toBeOnTheScreen();
    });
  });

  it("shows offline state when health check fails", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", emailVerified: true } }, isPending: false });
    mockHealthCheckQueryOptions.mockReturnValue({
      queryKey: ["healthCheck"],
      queryFn: async () => {
        throw new Error("offline");
      },
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText("OFFLINE")).toBeOnTheScreen();
      expect(screen.getByText("Could not reach the API.")).toBeOnTheScreen();
    });
  });

  it("redirects unverified users to sign-in", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", emailVerified: false } }, isPending: false });
    renderHome();

    expect(screen.getByText("REDIRECT:/sign-in")).toBeOnTheScreen();
  });

  it("navigates to dedicated profile page", async () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", emailVerified: true } }, isPending: false });

    renderHome();

    fireEvent.press(screen.getByText("Ir a mi perfil"));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/profile");
    });
  });
});
