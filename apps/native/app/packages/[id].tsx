import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";

import { orpc, client } from "@/utils/orpc";
import { BrandHeader } from "@/components/brand-header";
import { Text as UIText } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

/**
 * HU-21: Package Details Screen
 * 
 * Route: /packages/[id]
 * Purpose: Display full details of a travel package
 * 
 * Features:
 * - Package info (destino, fechas, duración, precio)
 * - List of participants
 * - List of activities
 * - Creator information
 * - Join/Leave package functionality
 */
export default function PackageDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      setError("ID de paquete no proporcionado");
      setIsLoading(false);
      return;
    }

    const fetchPackageDetails = async () => {
      try {
        const data = await client.package.getById({ id });
        setPackageData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el paquete");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageDetails();
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0080FF" />
      </View>
    );
  }

  if (error || !packageData) {
    return (
      <View className="flex-1 bg-white">
        <BrandHeader title="Error" />
        <View className="flex-1 items-center justify-center px-4">
          <UIText className="text-center text-red-600 mb-4">{error || "Paquete no encontrado"}</UIText>
          <Button onPress={() => router.back()}>
            <UIText className="text-white font-semibold">Volver</UIText>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentInsetAdjustmentBehavior="automatic">
      <BrandHeader title={packageData.title} subtitle={packageData.destination} />

      <View className="px-4 py-6">
        {/* Package Summary */}
        <View className="mb-6 rounded-lg bg-blue-50 p-4">
          <UIText className="mb-3 text-lg font-bold text-gray-900">{packageData.title}</UIText>
          
          <View className="mb-3 flex-row items-center justify-between">
            <UIText className="text-sm text-gray-600">Duración:</UIText>
            <UIText className="font-semibold text-gray-900">{packageData.durationDays} días</UIText>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <UIText className="text-sm text-gray-600">Precio:</UIText>
            <UIText className="font-semibold text-green-600">${packageData.price} USD</UIText>
          </View>

          <View className="flex-row items-center justify-between">
            <UIText className="text-sm text-gray-600">Participantes:</UIText>
            <UIText className="font-semibold text-gray-900">
              {packageData.currentParticipants}/{packageData.maxParticipants}
            </UIText>
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <UIText className="mb-2 text-base font-semibold text-gray-900">Descripción</UIText>
          <UIText className="text-gray-700">{packageData.description}</UIText>
        </View>

        {/* Dates */}
        <View className="mb-6 rounded-lg bg-gray-100 p-4">
          <UIText className="mb-2 font-semibold text-gray-900">Fechas</UIText>
          <UIText className="text-sm text-gray-600">
            Inicio: {new Date(packageData.startDate).toLocaleDateString("es-ES")}
          </UIText>
          <UIText className="text-sm text-gray-600">
            Fin: {new Date(packageData.endDate).toLocaleDateString("es-ES")}
          </UIText>
        </View>

        {/* Accommodation */}
        {packageData.accommodation && (
          <View className="mb-6">
            <UIText className="mb-2 font-semibold text-gray-900">Alojamiento</UIText>
            <UIText className="text-gray-700">{packageData.accommodation}</UIText>
          </View>
        )}

        {/* Activities */}
        {packageData.activities && packageData.activities.length > 0 && (
          <View className="mb-6">
            <UIText className="mb-3 font-semibold text-gray-900">Actividades</UIText>
            {packageData.activities.map((activity: any) => (
              <View key={activity.id} className="mb-3 rounded-lg bg-gray-100 p-3">
                <UIText className="font-semibold text-gray-900">{activity.title}</UIText>
                <UIText className="text-xs text-gray-600">{activity.location}</UIText>
                <UIText className="mt-1 text-sm text-gray-700">{activity.description}</UIText>
              </View>
            ))}
          </View>
        )}

        {/* Participants */}
        {packageData.participants && packageData.participants.length > 0 && (
          <View className="mb-6">
            <UIText className="mb-3 font-semibold text-gray-900">Viajeros</UIText>
            {packageData.participants.map((participant: any) => (
              <View key={participant.id} className="mb-2 flex-row items-center">
                <View className="mr-3 h-10 w-10 rounded-full bg-blue-200" />
                <UIText className="text-gray-900">{participant.userName}</UIText>
              </View>
            ))}
          </View>
        )}

        {/* Creator Info */}
        {packageData.creator && (
          <View className="mb-6 rounded-lg bg-gray-100 p-4">
            <UIText className="mb-2 font-semibold text-gray-900">Organizador</UIText>
            <UIText className="text-gray-900">{packageData.creator.name}</UIText>
            <UIText className="text-sm text-gray-600">{packageData.creator.email}</UIText>
          </View>
        )}

        {/* Action Button */}
        <Button onPress={() => router.back()} className="mb-4">
          <UIText className="text-white font-semibold">Volver</UIText>
        </Button>
      </View>
    </ScrollView>
  );
}
