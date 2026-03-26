import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import { type ReactElement } from "react";

import { AppThemeProvider } from "@/contexts/app-theme-context";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>{ui}</AppThemeProvider>
      </QueryClientProvider>,
    ),
    queryClient,
  };
}
