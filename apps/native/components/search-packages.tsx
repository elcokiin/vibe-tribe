import { useDeferredValue, useState } from "react";
import React from "react";
import { FlatList, TextInput, View, ActivityIndicator, RefreshControl } from "react-native";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text as UIText } from "@/components/ui/text";
import { orpc } from "@/utils/orpc";

/**
 * T-33 & T-34: Search filters with real-time updates
 */
const searchFiltersSchema = z.object({
  destination: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minDuration: z.string().regex(/^\d*$/).optional(),
  maxDuration: z.string().regex(/^\d*$/).optional(),
  minPrice: z.string().regex(/^\d+(\.\d{0,2})?|^/).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{0,2})?|^/).optional(),
});

type SearchFilters = z.infer<typeof searchFiltersSchema>;

type PackageItem = {
  id: string;
  destination: string;
  title: string;
  price: string;
  durationDays: number;
  maxParticipants: number;
  currentParticipants: number;
  creatorName: string;
  accommodation?: string;
};

type SearchPackagesComponentProps = {
  onPackageSelect?: (packageId: string) => void;
};

export function SearchPackages({ onPackageSelect }: SearchPackagesComponentProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    destination: "",
    startDate: "",
    endDate: "",
    minDuration: "",
    maxDuration: "",
    minPrice: "",
    maxPrice: "",
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allPackages, setAllPackages] = useState<PackageItem[]>([]);

  // Debounce filters to reduce API calls
  const debouncedFilters = useDeferredValue(filters);

  /**
   * T-34: Real-time search with React Query
   * Updates results immediately when filters change
   */
  const { data, isLoading, isError, error, refetch, isFetchingNextPage } = orpc.package.list.useInfiniteQuery(
    {
      destination: debouncedFilters.destination || undefined,
      startDate: debouncedFilters.startDate ? new Date(debouncedFilters.startDate) : undefined,
      endDate: debouncedFilters.endDate ? new Date(debouncedFilters.endDate) : undefined,
      minDuration: debouncedFilters.minDuration ? parseInt(debouncedFilters.minDuration, 10) : undefined,
      maxDuration: debouncedFilters.maxDuration ? parseInt(debouncedFilters.maxDuration, 10) : undefined,
      minPrice: debouncedFilters.minPrice || undefined,
      maxPrice: debouncedFilters.maxPrice || undefined,
      limit: 20,
      offset,
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination?.hasMore) {
          return {
            offset: (lastPage.pagination.offset ?? 0) + 20,
          };
        }
        return null;
      },
      initialPageParam: { offset: 0 },
    }
  );

  // Reset offset when filters change
  React.useEffect(() => {
    setOffset(0);
    setAllPackages([]);
  }, [debouncedFilters]);

  // Combine pages
  React.useEffect(() => {
    if (data?.pages) {
      const combined = data.pages.flatMap((page) => page.data || []);
      setAllPackages(combined);
    }
  }, [data]);

  const handleLoadMore = () => {
    if (data?.pages[data.pages.length - 1]?.pagination?.hasMore) {
      setOffset((prev) => prev + 20);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <View className="flex-1 bg-white">
      {/* Search Header */}
      <View className="border-b border-gray-200 p-4">
        <Label className="mb-2 text-sm font-semibold">Buscar Destino</Label>
        <Input
          placeholder="Ej: Cartagena, Bogotá..."
          value={filters.destination}
          onChangeText={(value) => handleFilterChange("destination", value)}
          className="mb-2"
        />

        {/* Basic Filters */}
        <View className="mb-3 grid grid-cols-2 gap-2">
          <View>
            <Label className="mb-1 text-xs font-medium">Inicio</Label>
            <Input
              placeholder="2026-06-01"
              value={filters.startDate}
              onChangeText={(value) => handleFilterChange("startDate", value)}
              keyboardType="default"
            />
          </View>
          <View>
            <Label className="mb-1 text-xs font-medium">Fin</Label>
            <Input
              placeholder="2026-06-05"
              value={filters.endDate}
              onChangeText={(value) => handleFilterChange("endDate", value)}
              keyboardType="default"
            />
          </View>
        </View>

        {/* Toggle Advanced Filters */}
        <Button
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="mb-2 bg-gray-200"
        >
          <UIText className="text-gray-800 font-semibold">
            {showAdvancedFilters ? "Ocultar" : "Mostrar"} más filtros
          </UIText>
        </Button>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <View className="mb-3 rounded-lg bg-gray-50 p-3">
            <View className="mb-2 grid grid-cols-2 gap-2">
              <View>
                <Label className="mb-1 text-xs font-medium">Duración Min</Label>
                <Input
                  placeholder="Días"
                  value={filters.minDuration}
                  onChangeText={(value) => handleFilterChange("minDuration", value)}
                  keyboardType="number-pad"
                />
              </View>
              <View>
                <Label className="mb-1 text-xs font-medium">Duración Max</Label>
                <Input
                  placeholder="Días"
                  value={filters.maxDuration}
                  onChangeText={(value) => handleFilterChange("maxDuration", value)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-2">
              <View>
                <Label className="mb-1 text-xs font-medium">Precio Min</Label>
                <Input
                  placeholder="USD"
                  value={filters.minPrice}
                  onChangeText={(value) => handleFilterChange("minPrice", value)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View>
                <Label className="mb-1 text-xs font-medium">Precio Max</Label>
                <Input
                  placeholder="USD"
                  value={filters.maxPrice}
                  onChangeText={(value) => handleFilterChange("maxPrice", value)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Results */}
      {isError && (
        <View className="flex-1 items-center justify-center px-4">
          <UIText className="mb-4 text-center text-red-600">
            {error instanceof Error ? error.message : "Error al buscar paquetes"}
          </UIText>
          <Button onPress={() => refetch()}>
            <UIText className="text-white font-semibold">Reintentar</UIText>
          </Button>
        </View>
      )}

      {allPackages.length === 0 && !isLoading && !isError && (
        <View className="flex-1 items-center justify-center px-4">
          <UIText className="text-gray-500">No se encontraron paquetes</UIText>
          <UIText className="mt-2 text-xs text-gray-400">Intenta con otros filtros</UIText>
        </View>
      )}

      {allPackages.length > 0 && (
        <FlatList
          data={allPackages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PackageCard
              package={item}
              onPress={() => onPackageSelect?.(item.id)}
            />
          )}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="flex-1 items-center justify-center py-4">
                <ActivityIndicator size="small" color="#0080FF" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
            />
          }
        />
      )}

      {isLoading && allPackages.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0080FF" />
          <UIText className="mt-4 text-gray-600">Buscando paquetes...</UIText>
        </View>
      )}

      {/* Results Count */}
      {allPackages.length > 0 && (
        <View className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <UIText className="text-sm text-gray-600">
            {allPackages.length} paquetes encontrados
          </UIText>
        </View>
      )}
    </View>
  );
}

/**
 * Individual package card component
 */
function PackageCard({
  package: pkg,
  onPress,
}: {
  package: PackageItem;
  onPress: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-lg bg-white shadow-sm"
      style={{ elevation: 2 }}
    >
      <View className="p-4">
        <View className="mb-2 flex-row items-start justify-between">
          <View className="flex-1">
            <UIText className="text-base font-bold text-gray-900">
              {pkg.title}
            </UIText>
            <UIText className="mt-1 text-sm text-gray-600">
              {pkg.destination}
            </UIText>
          </View>
          <UIText className="text-lg font-bold text-green-600">
            ${pkg.price}
          </UIText>
        </View>

        <View className="mb-3 flex-row gap-2">
          <View className="flex-1 rounded-md bg-blue-50 px-2 py-1">
            <UIText className="text-xs text-blue-700">
              {pkg.durationDays} días
            </UIText>
          </View>
          <View className="flex-1 rounded-md bg-purple-50 px-2 py-1">
            <UIText className="text-xs text-purple-700">
              {pkg.currentParticipants}/{pkg.maxParticipants} participantes
            </UIText>
          </View>
        </View>

        {pkg.accommodation && (
          <UIText className="mb-3 text-xs text-gray-600">
            🏨 {pkg.accommodation}
          </UIText>
        )}

        <View className="mb-3 flex-row items-center justify-between">
          <UIText className="text-xs font-medium text-gray-700">
            por {pkg.creatorName}
          </UIText>
        </View>

        <Button
          onPress={onPress}
          className="bg-blue-600"
        >
          <UIText className="text-center text-white font-semibold">
            Ver Detalles
          </UIText>
        </Button>
      </View>
    </View>
  );
}
