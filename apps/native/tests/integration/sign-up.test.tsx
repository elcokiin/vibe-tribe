import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";

import SignUpScreen from "@/app/sign-up";
import { SignUp } from "@/components/sign-up";
import { renderWithProviders } from "@/tests/render-with-providers";

const { mockUseSession, mockSignUpEmail, mockEmailOtpVerifyEmail, mockSignInEmail } = require("@/tests/mocks/auth-client");
const { mockRefetchQueries } = require("@/tests/mocks/orpc");

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const { mockEmailOtpSendVerificationOtp } = require("@/tests/mocks/auth-client");

type AuthHandlers = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

describe("sign-up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
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

  it("completes sign up after otp verification and refetches queries", async () => {
    mockSignUpEmail.mockImplementation(async (_payload: unknown, handlers: AuthHandlers) => {
      handlers.onSuccess?.();
    });
    mockEmailOtpVerifyEmail.mockImplementation(async (_payload: unknown, handlers: AuthHandlers) => {
      handlers.onSuccess?.();
    });
    mockSignInEmail.mockImplementation(async (_payload: unknown, handlers: AuthHandlers) => {
      handlers.onSuccess?.();
    });

    renderWithProviders(<SignUp />);

    fireEvent.changeText(screen.getByPlaceholderText("Juan Pérez"), "Juan Perez");
    fireEvent.changeText(screen.getByPlaceholderText("correo@ejemplo.com"), "test@mail.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "12345678");
    fireEvent.press(screen.getByText("Crear Cuenta"));

    await waitFor(() => {
      expect(screen.getByText("Verificar código")).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByTestId("otp-hidden-input"), "123456");
    fireEvent.press(screen.getByText("Verificar código"));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailOtpVerifyEmail).toHaveBeenCalledTimes(1);
      expect(mockSignInEmail).toHaveBeenCalledTimes(1);
      expect(mockRefetchQueries).toHaveBeenCalledTimes(1);
    });
  });

  it("shows duplicate account error", async () => {
    mockSignUpEmail.mockImplementation(async (_payload: unknown, handlers: AuthHandlers) => {
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
    mockUseSession.mockReturnValue({ data: { user: { id: "1", emailVerified: true } }, isPending: false });
    renderWithProviders(<SignUpScreen />);

    expect(screen.queryByText("Crear Cuenta")).not.toBeOnTheScreen();
  });

  it("shows verify mode for unverified users on sign-up screen", async () => {
    mockEmailOtpSendVerificationOtp.mockImplementation(async (_payload: unknown, handlers: AuthHandlers) => {
      handlers.onSuccess?.();
    });
    mockUseSession.mockReturnValue({ data: { user: { id: "1", email: "test@mail.com", emailVerified: false } }, isPending: false });
    renderWithProviders(<SignUpScreen />);

    await waitFor(() => {
      expect(screen.getByText("Verificar código")).toBeOnTheScreen();
      expect(screen.queryByText("Crear Cuenta")).not.toBeOnTheScreen();
    });
  });

  it("shows otp verification mode and message when redirected from sign-in", async () => {
    mockUseLocalSearchParams.mockReturnValue({
      mode: "verify",
      email: "test%2Botp%40mail.com",
    });
    mockEmailOtpSendVerificationOtp.mockImplementation(async (_payload: unknown, handlers: AuthHandlers) => {
      handlers.onSuccess?.();
    });

    renderWithProviders(<SignUpScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(/Tu cuenta existe, pero debes verificar tu correo para continuar\./),
      ).toBeOnTheScreen();
      expect(screen.getByText("Verificar código")).toBeOnTheScreen();
      expect(screen.queryByText("Crear Cuenta")).not.toBeOnTheScreen();
      expect(mockEmailOtpSendVerificationOtp).toHaveBeenCalledTimes(1);
    });
  });
});
