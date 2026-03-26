import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import SignInScreen from "@/app/sign-in";
import { SignIn } from "@/components/sign-in";
import { renderWithProviders } from "@/tests/render-with-providers";

const { mockUseSession, mockSignInEmail } = require("@/tests/mocks/auth-client");
const { mockRefetchQueries } = require("@/tests/mocks/orpc");

describe("sign-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null, isPending: false });
  });

  it("shows validation errors on empty submit", async () => {
    renderWithProviders(<SignIn />);

    fireEvent.press(screen.getByText("Iniciar Sesión"));

    await waitFor(() => {
      expect(screen.getByText("El correo electrónico es requerido")).toBeOnTheScreen();
      expect(screen.getByText("La contraseña es requerida")).toBeOnTheScreen();
    });
  });

  it("submits valid credentials and refetches queries", async () => {
    mockSignInEmail.mockImplementation(async (_payload, handlers) => {
      handlers.onSuccess?.();
    });

    renderWithProviders(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("correo@ejemplo.com"), "test@mail.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "12345678");
    fireEvent.press(screen.getByText("Iniciar Sesión"));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledTimes(1);
      expect(mockRefetchQueries).toHaveBeenCalledTimes(1);
    });
  });

  it("shows mapped error on failed sign in", async () => {
    mockSignInEmail.mockImplementation(async (_payload, handlers) => {
      handlers.onError?.({ message: "Invalid credentials" });
    });

    renderWithProviders(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("correo@ejemplo.com"), "test@mail.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "12345678");
    fireEvent.press(screen.getByText("Iniciar Sesión"));

    await waitFor(() => {
      expect(screen.getByText("Correo o contraseña incorrectos.")).toBeOnTheScreen();
    });
  });

  it("redirects authenticated users from screen", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1" } }, isPending: false });
    renderWithProviders(<SignInScreen />);

    expect(screen.queryByText("Iniciar Sesión")).not.toBeOnTheScreen();
  });
});
