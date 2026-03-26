import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import SignUpScreen from "@/app/sign-up";
import { SignUp } from "@/components/sign-up";
import { renderWithProviders } from "@/tests/render-with-providers";

const { mockUseSession, mockSignUpEmail } = require("@/tests/mocks/auth-client");
const { mockRefetchQueries } = require("@/tests/mocks/orpc");

describe("sign-up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null, isPending: false });
  });

  it("shows validation errors on empty submit", async () => {
    renderWithProviders(<SignUp />);

    fireEvent.press(screen.getByText("Crear Cuenta"));

    await waitFor(() => {
      expect(screen.getByText("El nombre es requerido")).toBeOnTheScreen();
      expect(screen.getByText("El correo electrónico es requerido")).toBeOnTheScreen();
      expect(screen.getByText("La contraseña es requerida")).toBeOnTheScreen();
    });
  });

  it("submits valid registration and refetches queries", async () => {
    mockSignUpEmail.mockImplementation(async (_payload, handlers) => {
      handlers.onSuccess?.();
    });

    renderWithProviders(<SignUp />);

    fireEvent.changeText(screen.getByPlaceholderText("Juan Pérez"), "Juan Perez");
    fireEvent.changeText(screen.getByPlaceholderText("correo@ejemplo.com"), "test@mail.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "12345678");
    fireEvent.press(screen.getByText("Crear Cuenta"));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledTimes(1);
      expect(mockRefetchQueries).toHaveBeenCalledTimes(1);
    });
  });

  it("shows duplicate account error", async () => {
    mockSignUpEmail.mockImplementation(async (_payload, handlers) => {
      handlers.onError?.({ message: "Email already exists" });
    });

    renderWithProviders(<SignUp />);

    fireEvent.changeText(screen.getByPlaceholderText("Juan Pérez"), "Juan Perez");
    fireEvent.changeText(screen.getByPlaceholderText("correo@ejemplo.com"), "test@mail.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "12345678");
    fireEvent.press(screen.getByText("Crear Cuenta"));

    await waitFor(() => {
      expect(screen.getByText("Este correo ya está registrado.")).toBeOnTheScreen();
    });
  });

  it("redirects authenticated users from screen", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1" } }, isPending: false });
    renderWithProviders(<SignUpScreen />);

    expect(screen.queryByText("Crear Cuenta")).not.toBeOnTheScreen();
  });
});
