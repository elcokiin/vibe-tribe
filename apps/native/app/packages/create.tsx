import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { CreatePackageForm } from "@/components/create-package";
import { BrandHeader } from "@/components/brand-header";
import { Text as UIText } from "@/components/ui/text";

/**
 * T-30 & T-31: Create Package Screen (HU-06)
 * 
 * Route: /packages/create
 * Purpose: Allow authenticated users to create new travel packages
 * 
 * Features:
 * - Form with all required fields (destination, dates, price, etc.)
 * - Real-time validation with Zod
 * - Error/success handling with visual feedback
 * - Navigation to package details after creation
 */
export default function CreatePackageScreen() {
  const router = useRouter();

  const handleSuccess = (packageId: string) => {
    // Navigate to package details page after successful creation
    router.replace(`/packages/${packageId}`);
  };

  const handleError = (error: string) => {
    console.error("Failed to create package:", error);
    // Error is shown in form, no additional navigation needed
  };

  return (
    <View className="flex-1 bg-gray-50">
      <BrandHeader title="Crear Paquete de Viaje" subtitle="Comparte tu próxima aventura" />
      <CreatePackageForm onSuccess={handleSuccess} onError={handleError} />
    </View>
  );
}
