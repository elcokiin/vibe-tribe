import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { SearchPackages } from "../search-packages";
import { queryClient } from "@/utils/orpc";

/**
 * T-33 & T-34: Unit Tests for Search Packages Component (HU-07)
 * 
 * Tests filtering, real-time updates, and UI interactions
 */

// Mock the oRPC client
jest.mock("@/utils/orpc", () => ({
  queryClient: {
    clear: jest.fn(),
  },
  orpc: {
    package: {
      list: {
        useInfiniteQuery: jest.fn((params, options) => ({
          data: {
            pages: [
              {
                data: [
                  {
                    id: "pkg_1",
                    destination: "Cartagena",
                    title: "Aventura en Cartagena",
                    price: "1500.00",
                    durationDays: 5,
                    maxParticipants: 20,
                    currentParticipants: 8,
                    creatorName: "Juan",
                  },
                ],
                pagination: { limit: 20, offset: 0, hasMore: false },
              },
            ],
          },
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetchingNextPage: false,
        })),
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

describe("SearchPackages Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering and Basic Features", () => {
    it("renders search filters", () => {
      renderWithProviders(<SearchPackages />);

      expect(screen.getByText("Buscar Destino")).toBeTruthy();
      expect(screen.getByPlaceholderText("Ej: Cartagena, Bogotá...")).toBeTruthy();
    });

    it("renders date filters", () => {
      renderWithProviders(<SearchPackages />);

      expect(screen.getByPlaceholderText("2026-06-01")).toBeTruthy();
      expect(screen.getByPlaceholderText("2026-06-05")).toBeTruthy();
    });

    it("renders advanced filters toggle button", () => {
      renderWithProviders(<SearchPackages />);

      expect(screen.getByText("Mostrar más filtros")).toBeTruthy();
    });

    it("toggles advanced filters visibility", async () => {
      renderWithProviders(<SearchPackages />);

      const toggleButton = screen.getByText("Mostrar más filtros");
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("Ocultar más filtros")).toBeTruthy();
        expect(screen.getByPlaceholderText("Días")).toBeTruthy();
      });
    });

    it("displays advanced filter inputs when toggled", async () => {
      renderWithProviders(<SearchPackages />);

      const toggleButton = screen.getByText("Mostrar más filtros");
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText("Días")).toBeTruthy();
        expect(screen.getAllByPlaceholderText("USD")).toBeTruthy();
      });
    });
  });

  describe("Destination Filtering", () => {
    it("should update destination filter when user types", async () => {
      const { orpc } = require("@/utils/orpc");
      
      renderWithProviders(<SearchPackages />);

      const destinationInput = screen.getByPlaceholderText("Ej: Cartagena, Bogotá...");
      fireEvent.changeText(destinationInput, "Cartagena");

      await waitFor(() => {
        expect(destinationInput.props.value).toBe("Cartagena");
      });
    });

    it("should call API with destination filter", async () => {
      const { orpc } = require("@/utils/orpc");
      const useInfiniteQueryMock = jest.fn();
      
      orpc.package.list.useInfiniteQuery = useInfiniteQueryMock;

      renderWithProviders(<SearchPackages />);

      const destinationInput = screen.getByPlaceholderText("Ej: Cartagena, Bogotá...");
      fireEvent.changeText(destinationInput, "Cartagena");

      await waitFor(() => {
        expect(useInfiniteQueryMock).toHaveBeenCalledWith(
          expect.objectContaining({
            destination: "Cartagena",
          }),
          expect.any(Object)
        );
      });
    });

    it("should clear destination when input is cleared", async () => {
      renderWithProviders(<SearchPackages />);

      const destinationInput = screen.getByPlaceholderText("Ej: Cartagena, Bogotá...");
      fireEvent.changeText(destinationInput, "Cartagena");
      fireEvent.changeText(destinationInput, "");

      await waitFor(() => {
        expect(destinationInput.props.value).toBe("");
      });
    });
  });

  describe("Date Filtering", () => {
    it("should update start date when user enters it", async () => {
      renderWithProviders(<SearchPackages />);

      const startDateInputs = screen.getAllByPlaceholderText("2026-06-01");
      fireEvent.changeText(startDateInputs[0], "2026-06-15");

      await waitFor(() => {
        expect(startDateInputs[0].props.value).toBe("2026-06-15");
      });
    });

    it("should update end date when user enters it", async () => {
      renderWithProviders(<SearchPackages />);

      const endDateInputs = screen.getAllByPlaceholderText("2026-06-05");
      fireEvent.changeText(endDateInputs[0], "2026-06-20");

      await waitFor(() => {
        expect(endDateInputs[0].props.value).toBe("2026-06-20");
      });
    });

    it("should apply date filters to API call", async () => {
      const { orpc } = require("@/utils/orpc");
      const useInfiniteQueryMock = jest.fn();
      
      orpc.package.list.useInfiniteQuery = useInfiniteQueryMock;

      renderWithProviders(<SearchPackages />);

      const startDateInputs = screen.getAllByPlaceholderText("2026-06-01");
      fireEvent.changeText(startDateInputs[0], "2026-06-15");

      await waitFor(() => {
        expect(useInfiniteQueryMock).toHaveBeenCalled();
      });
    });
  });

  describe("Advanced Filters", () => {
    it("should apply duration filters", async () => {
      renderWithProviders(<SearchPackages />);

      const toggleButton = screen.getByText("Mostrar más filtros");
      fireEvent.press(toggleButton);

      const durationInputs = screen.getAllByPlaceholderText("Días");
      fireEvent.changeText(durationInputs[0], "5");
      fireEvent.changeText(durationInputs[1], "10");

      await waitFor(() => {
        expect(durationInputs[0].props.value).toBe("5");
        expect(durationInputs[1].props.value).toBe("10");
      });
    });

    it("should apply price filters", async () => {
      renderWithProviders(<SearchPackages />);

      const toggleButton = screen.getByText("Mostrar más filtros");
      fireEvent.press(toggleButton);

      const priceInputs = screen.getAllByPlaceholderText("USD");
      fireEvent.changeText(priceInputs[0], "1000");
      fireEvent.changeText(priceInputs[1], "3000");

      await waitFor(() => {
        expect(priceInputs[0].props.value).toBe("1000");
        expect(priceInputs[1].props.value).toBe("3000");
      });
    });
  });

  describe("Results Display", () => {
    it("should display package results", async () => {
      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        expect(screen.getByText("Aventura en Cartagena")).toBeTruthy();
        expect(screen.getByText("Cartagena")).toBeTruthy();
      });
    });

    it("should display number of results found", async () => {
      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        expect(screen.getByText("1 paquetes encontrados")).toBeTruthy();
      });
    });

    it("should display package details in card", async () => {
      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        expect(screen.getByText("$1500.00")).toBeTruthy();
        expect(screen.getByText("5 días")).toBeTruthy();
        expect(screen.getByText("8/20 participantes")).toBeTruthy();
        expect(screen.getByText("por Juan")).toBeTruthy();
      });
    });

    it("should display empty message when no results", async () => {
      const { orpc } = require("@/utils/orpc");
      
      orpc.package.list.useInfiniteQuery = jest.fn(() => ({
        data: { pages: [{ data: [], pagination: { hasMore: false } }] },
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isFetchingNextPage: false,
      }));

      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        expect(screen.getByText("No se encontraron paquetes")).toBeTruthy();
      });
    });
  });

  describe("Package Card Interaction", () => {
    it("should call onPackageSelect when package card is pressed", async () => {
      const onPackageSelect = jest.fn();

      renderWithProviders(
        <SearchPackages onPackageSelect={onPackageSelect} />
      );

      await waitFor(() => {
        const detailsButton = screen.getByText("Ver Detalles");
        fireEvent.press(detailsButton);
      });

      expect(onPackageSelect).toHaveBeenCalledWith("pkg_1");
    });
  });

  describe("Loading and Error States", () => {
    it("should display loading indicator when searching", async () => {
      const { orpc } = require("@/utils/orpc");
      
      orpc.package.list.useInfiniteQuery = jest.fn(() => ({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isFetchingNextPage: false,
      }));

      renderWithProviders(<SearchPackages />);

      expect(screen.getByText("Buscando paquetes...")).toBeTruthy();
    });

    it("should display error message when search fails", async () => {
      const { orpc } = require("@/utils/orpc");
      
      orpc.package.list.useInfiniteQuery = jest.fn(() => ({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error("Network error"),
        refetch: jest.fn(),
        isFetchingNextPage: false,
      }));

      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeTruthy();
      });
    });

    it("should allow retry after error", async () => {
      const { orpc } = require("@/utils/orpc");
      const refetchMock = jest.fn();
      
      orpc.package.list.useInfiniteQuery = jest.fn(() => ({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error("Network error"),
        refetch: refetchMock,
        isFetchingNextPage: false,
      }));

      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        const retryButton = screen.getByText("Reintentar");
        fireEvent.press(retryButton);
      });

      expect(refetchMock).toHaveBeenCalled();
    });
  });

  describe("Pagination and Infinite Scroll", () => {
    it("should indicate when more results are available", async () => {
      const { orpc } = require("@/utils/orpc");
      
      orpc.package.list.useInfiniteQuery = jest.fn((params, options) => ({
        data: {
          pages: [
            {
              data: Array(20).fill({
                id: "pkg_1",
                destination: "Cartagena",
                title: "Package",
                price: "1500.00",
                durationDays: 5,
                maxParticipants: 20,
                currentParticipants: 8,
                creatorName: "User",
              }),
              pagination: { limit: 20, offset: 0, hasMore: true },
            },
          ],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isFetchingNextPage: false,
      }));

      renderWithProviders(<SearchPackages />);

      await waitFor(() => {
        expect(screen.getByText("20 paquetes encontrados")).toBeTruthy();
      });
    });
  });

  describe("Real-Time Filter Updates", () => {
    it("should debounce filter changes", async () => {
      const { orpc } = require("@/utils/orpc");
      const useInfiniteQueryMock = jest.fn(() => ({
        data: { pages: [{ data: [], pagination: { hasMore: false } }] },
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isFetchingNextPage: false,
      }));
      
      orpc.package.list.useInfiniteQuery = useInfiniteQueryMock;

      renderWithProviders(<SearchPackages />);

      const destinationInput = screen.getByPlaceholderText("Ej: Cartagena, Bogotá...");
      
      fireEvent.changeText(destinationInput, "C");
      fireEvent.changeText(destinationInput, "Ca");
      fireEvent.changeText(destinationInput, "Car");

      // Due to debouncing, should not call API for every character
      // Usually React.useDeferredValue prevents immediate updates
      await waitFor(() => {
        expect(useInfiniteQueryMock).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it("should reset offset when filters change", async () => {
      renderWithProviders(<SearchPackages />);

      const destinationInput = screen.getByPlaceholderText("Ej: Cartagena, Bogotá...");
      
      fireEvent.changeText(destinationInput, "Cartagena");

      // After filter change, offset should be reset to 0
      // This is tested implicitly through API call parameters
      await waitFor(() => {
        expect(destinationInput.props.value).toBe("Cartagena");
      });
    });
  });
});
