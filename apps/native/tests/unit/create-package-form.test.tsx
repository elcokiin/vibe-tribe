import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { CreatePackageForm } from "../create-package";
import { queryClient } from "@/utils/orpc";

/**
 * T-32: Unit Tests for Create Package Form (HU-06)
 * 
 * Tests validation, error handling, and basic form interactions
 */

// Mock the oRPC client
jest.mock("@/utils/orpc", () => ({
  queryClient: {
    clear: jest.fn(),
  },
  orpc: {
    package: {
      create: {
        mutate: jest.fn(),
      },
    },
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe("CreatePackageForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all required form fields", () => {
    renderWithProviders(<CreatePackageForm />);

    expect(screen.getByText("Destino *")).toBeTruthy();
    expect(screen.getByText("Título del Paquete *")).toBeTruthy();
    expect(screen.getByText("Descripción *")).toBeTruthy();
    expect(screen.getByText("Inicio *")).toBeTruthy();
    expect(screen.getByText("Fin *")).toBeTruthy();
    expect(screen.getByText("Máx. Participantes *")).toBeTruthy();
    expect(screen.getByText("Precio USD *")).toBeTruthy();
  });

  it("displays validation error when destination is empty", async () => {
    renderWithProviders(<CreatePackageForm />);

    const submitButton = screen.getByText("Crear Paquete");
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("El destino es requerido")).toBeTruthy();
    });
  });

  it("displays validation error when title is too short", async () => {
    renderWithProviders(<CreatePackageForm />);

    const destinationInput = screen.getByPlaceholderText("ej: Cartagena, Colombia");
    fireEvent.changeText(destinationInput, "Cartagena");

    await waitFor(() => {
      expect(screen.queryByText("El título es requerido")).toBeTruthy();
    });
  });

  it("displays validation error when description is less than 10 characters", async () => {
    renderWithProviders(<CreatePackageForm />);

    const descriptionInput = screen.getByPlaceholderText("Describe tu paquete de viaje...");
    fireEvent.changeText(descriptionInput, "Short");

    await waitFor(() => {
      expect(screen.queryByText("La descripción debe tener al menos 10 caracteres")).toBeTruthy();
    });
  });

  it("displays validation error when end date is before start date", async () => {
    renderWithProviders(<CreatePackageForm />);

    const startDateInput = screen.getByPlaceholderText("2026-06-01");
    const endDateInput = screen.getByDisplayValue("2026-06-05");

    fireEvent.changeText(startDateInput, "2026-06-10");
    fireEvent.changeText(endDateInput, "2026-06-05");

    const submitButton = screen.getByText("Crear Paquete");
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("La fecha de finalización debe ser posterior a la de inicio")).toBeTruthy();
    });
  });

  it("displays validation error for invalid price format", async () => {
    renderWithProviders(<CreatePackageForm />);

    const priceInput = screen.getByPlaceholderText("1500.00");
    fireEvent.changeText(priceInput, "invalid-price");

    await waitFor(() => {
      expect(screen.queryByText("Formato de precio inválido (ej: 1500.00)")).toBeTruthy();
    });
  });

  it("calls onSuccess callback when form submission is successful", async () => {
    const onSuccess = jest.fn();
    const { orpc } = require("@/utils/orpc");
    
    orpc.package.create.mutate = jest.fn().mockResolvedValue({
      success: true,
      id: "pkg_123",
    });

    renderWithProviders(<CreatePackageForm onSuccess={onSuccess} />);

    // Fill in form fields
    const destinationInput = screen.getByPlaceholderText("ej: Cartagena, Colombia");
    const titleInput = screen.getByPlaceholderText("ej: Aventura en Cartagena");
    const descriptionInput = screen.getByPlaceholderText("Describe tu paquete de viaje...");
    const priceInput = screen.getByPlaceholderText("1500.00");

    fireEvent.changeText(destinationInput, "Cartagena");
    fireEvent.changeText(titleInput, "Aventura en Cartagena");
    fireEvent.changeText(descriptionInput, "Una aventura increíble por la costa");
    fireEvent.changeText(priceInput, "1500.00");

    const submitButton = screen.getByText("Crear Paquete");
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("pkg_123");
    });
  });

  it("calls onError callback when form submission fails", async () => {
    const onError = jest.fn();
    const { orpc } = require("@/utils/orpc");
    
    orpc.package.create.mutate = jest.fn().mockRejectedValue(
      new Error("Network error")
    );

    renderWithProviders(<CreatePackageForm onError={onError} />);

    // Fill in form fields with valid data
    const destinationInput = screen.getByPlaceholderText("ej: Cartagena, Colombia");
    const titleInput = screen.getByPlaceholderText("ej: Aventura en Cartagena");
    const descriptionInput = screen.getByPlaceholderText("Describe tu paquete de viaje...");
    const priceInput = screen.getByPlaceholderText("1500.00");

    fireEvent.changeText(destinationInput, "Cartagena");
    fireEvent.changeText(titleInput, "Aventura en Cartagena");
    fireEvent.changeText(descriptionInput, "Una aventura increíble por la costa");
    fireEvent.changeText(priceInput, "1500.00");

    const submitButton = screen.getByText("Crear Paquete");
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Network error");
    });
  });

  it("disables submit button while request is in progress", async () => {
    const { orpc } = require("@/utils/orpc");
    
    let resolveSubmit: (() => void) | null = null;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    orpc.package.create.mutate = jest.fn(() => submitPromise);

    renderWithProviders(<CreatePackageForm />);

    // Fill in form fields
    const destinationInput = screen.getByPlaceholderText("ej: Cartagena, Colombia");
    const titleInput = screen.getByPlaceholderText("ej: Aventura en Cartagena");
    const descriptionInput = screen.getByPlaceholderText("Describe tu paquete de viaje...");
    const priceInput = screen.getByPlaceholderText("1500.00");

    fireEvent.changeText(destinationInput, "Cartagena");
    fireEvent.changeText(titleInput, "Aventura en Cartagena");
    fireEvent.changeText(descriptionInput, "Una aventura increíble por la costa");
    fireEvent.changeText(priceInput, "1500.00");

    const submitButton = screen.getByText("Crear Paquete");
    fireEvent.press(submitButton);

    // Check that button shows loading state
    expect(screen.getByText("Creando...")).toBeTruthy();
    expect(submitButton.props.disabled).toBe(true);

    // Resolve the submit
    resolveSubmit?.();

    // Button should return to normal
    await waitFor(() => {
      expect(screen.getByText("Crear Paquete")).toBeTruthy();
    });
  });
});
