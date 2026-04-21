import { useRouter } from "expo-router";
import { View } from "react-native";

import { SearchPackages } from "@/components/search-packages";
import { BrandHeader } from "@/components/brand-header";

/**
 * T-33 & T-34: Search Packages Screen (HU-07)
 * 
 * Route: /packages/search
 * Purpose: Allow users to search and filter travel packages
 * 
 * Features:
 * - Real-time search with dynamic filters
 * - Infinite scroll pagination
 * - Advanced filters (duration, price ranges)
 * - Package card preview with quick info
 */
export default function SearchPackagesScreen() {
  const router = useRouter();

  const handlePackageSelect = (packageId: string) => {
    // Navigate to package details
    router.push(`/packages/${packageId}`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <BrandHeader title="Descubre Paquetes" subtitle="Encuentra tu próximo viaje" />
      <SearchPackages onPackageSelect={handlePackageSelect} />
    </View>
  );
}
