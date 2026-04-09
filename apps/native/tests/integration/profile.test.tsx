import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import ProfileScreen from "@/app/profile";
import { renderWithProviders } from "@/tests/render-with-providers";

const { mockUseSession } = require("@/tests/mocks/auth-client");
const {
  mockProfileGetMineQueryOptions,
  mockProfileUpdateMineMutationFn,
} = require("@/tests/mocks/orpc");

describe("profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: { user: { id: "1", emailVerified: true } }, isPending: false });

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

  it("renders profile form and saves updates", async () => {
    renderWithProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText("Mi Perfil")).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Cuentanos sobre tu estilo de viaje"), "Nueva bio");
    fireEvent.changeText(screen.getByPlaceholderText("Ej: Kyoto, Cusco, Cartagena"), "Kyoto, Cartagena");
    fireEvent.press(screen.getByText("Guardar perfil"));

    await waitFor(() => {
      expect(mockProfileUpdateMineMutationFn).toHaveBeenCalled();
      expect(mockProfileUpdateMineMutationFn.mock.calls[0][0]).toEqual({
        description: "Nueva bio",
        favoriteDestinations: ["Kyoto", "Cartagena"],
      });
    });
  });
});
