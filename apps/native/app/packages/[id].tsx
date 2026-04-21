import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator, RefreshControl } from "react-native";

import { orpc, client } from "@/utils/orpc";
import { BrandHeader } from "@/components/brand-header";
import { Text as UIText } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ParticipantsList } from "@/components/participants-list";

/**
 * T-36 & T-37: Package Details Screen (HU-21)
 * 
 * Route: /packages/[id]
 * Purpose: Display full details of a travel package with all information
 * 
 * Features:
 * - T-36: Completamente soportado por endpoint GET /packages/:id
 *   * Retorna: package detail + participants + activities + creator info
 * 
 * - T-37: Pantalla detallada con:
 *   * Destino, fechas, duración, precio
 *   * Descripción completa
 *   * Alojamiento y detalles
 *   * Lista de actividades con detalles
 *   * Lista de participantes
 *   * Información del organizador
 *   * Botones de acción (unirse/abandonar)
 */
export default function PackageDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userParticipating, setUserParticipating] = useState(false);

  const fetchPackageDetails = async () => {
    try {
      if (!id) {
        setError("ID de paquete no proporcionado");
        setIsLoading(false);
        return;
      }

      const data = await client.package.getById({ id });
      setPackageData(data);
      setError(null);

      // Check if current user is already a participant
      if (session?.user?.id && data.participants) {
        const isParticipant = data.participants.some(
          (p: any) => p.userId === session.user.id
        );
        setUserParticipating(isParticipant);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el paquete");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchPackageDetails();
  }, [id]);

  const handleJoinPackage = async () => {
    if (!id || !session?.user?.id) return;

    setActionLoading(true);
    try {
      await orpc.package.joinPackage.mutate({ packageId: id });
      setUserParticipating(true);
      // Refetch to update participant count
      await fetchPackageDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse al paquete");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeavePackage = async () => {
    if (!id || !session?.user?.id) return;

    setActionLoading(true);
    try {
      await orpc.package.leavePackage.mutate({ packageId: id });
      setUserParticipating(false);
      // Refetch to update participant count
      await fetchPackageDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al abandonar el paquete");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0080FF" />
        <UIText className="mt-4 text-gray-600">Cargando detalles...</UIText>
      </View>
    );
  }

  if (error || !packageData) {
    return (
      <View className="flex-1 bg-white">
        <BrandHeader title="Error" />
        <View className="flex-1 items-center justify-center px-4">
          <UIText className="text-center text-red-600 mb-4">
            {error || "Paquete no encontrado"}
          </UIText>
          <Button onPress={() => router.back()}>
            <UIText className="text-white font-semibold">Volver</UIText>
          </Button>
        </View>
      </View>
    );
  }

  const isCreator = session?.user?.id === packageData.creatorId;
  const canJoinPackage = !isCreator && !userParticipating && packageData.currentParticipants < packageData.maxParticipants;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={async () => {
            setIsRefreshing(true);
            await fetchPackageDetails();
          }}
        />
      }
    >
      <BrandHeader title={packageData.title} subtitle={packageData.destination} />

      <View className="px-4 py-6">
        {/* Error Alert */}
        {error && (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <UIText className="text-sm font-medium text-red-800">{error}</UIText>
          </View>
        )}

        {/* Package Summary Card */}
        <View className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <UIText className="mb-4 text-xl font-bold text-gray-900">{packageData.title}</UIText>

          <View className="mb-3 grid grid-cols-2 gap-3">
            <View className="rounded-md bg-white p-3">
              <UIText className="text-xs text-gray-600">Duración</UIText>
              <UIText className="text-lg font-bold text-blue-600">{packageData.durationDays} días</UIText>
            </View>

            <View className="rounded-md bg-white p-3">
              <UIText className="text-xs text-gray-600">Precio</UIText>
              <UIText className="text-lg font-bold text-green-600">${packageData.price}</UIText>
            </View>
          </View>

          <View className="rounded-md bg-white p-3">
            <UIText className="mb-1 text-xs text-gray-600">Participantes</UIText>
            <UIText className="text-base font-semibold text-gray-900">
              {packageData.currentParticipants} / {packageData.maxParticipants} inscritos
            </UIText>
            <View className="mt-2 h-2 rounded-full bg-gray-200">
              <View
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${(packageData.currentParticipants / packageData.maxParticipants) * 100}%`,
                }}
              />
            </View>
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <UIText className="mb-2 text-base font-semibold text-gray-900">Descripción</UIText>
          <UIText className="leading-6 text-gray-700">{packageData.description}</UIText>
        </View>

        {/* Dates Section */}
        <View className="mb-6 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 p-4">
          <UIText className="mb-3 font-semibold text-gray-900">📅 Fechas del Viaje</UIText>
          <View className="mb-2 flex-row items-center justify-between">
            <UIText className="text-gray-600">Inicio:</UIText>
            <UIText className="font-semibold text-gray-900">
              {new Date(packageData.startDate).toLocaleDateString("es-ES", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </UIText>
          </View>
          <View className="flex-row items-center justify-between">
            <UIText className="text-gray-600">Fin:</UIText>
            <UIText className="font-semibold text-gray-900">
              {new Date(packageData.endDate).toLocaleDateString("es-ES", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </UIText>
          </View>
        </View>

        {/* Accommodation */}
        {packageData.accommodation && (
          <View className="mb-6 rounded-lg bg-purple-50 p-4">
            <UIText className="mb-2 font-semibold text-gray-900">🏨 Alojamiento</UIText>
            <UIText className="text-gray-900">{packageData.accommodation}</UIText>
            {packageData.accommodationDetails && (
              <View className="mt-3 space-y-2">
                <UIText className="text-xs text-gray-600">
                  ⭐ Calificación: {packageData.accommodationDetails.rating}/5
                </UIText>
                {packageData.accommodationDetails.amenities && packageData.accommodationDetails.amenities.length > 0 && (
                  <UIText className="text-xs text-gray-600">
                    Amenities: {packageData.accommodationDetails.amenities.join(", ")}
                  </UIText>
                )}
              </View>
            )}
          </View>
        )}

        {/* Activities */}
        {packageData.activities && packageData.activities.length > 0 && (
          <View className="mb-6">
            <UIText className="mb-3 text-base font-semibold text-gray-900">🎯 Actividades</UIText>
            {packageData.activities.map((activity: any, idx: number) => (
              <View
                key={activity.id}
                className={`mb-3 rounded-lg p-4 ${activity.isIncluded ? "bg-green-50" : "bg-gray-100"}`}
              >
                <View className="mb-2 flex-row items-start justify-between">
                  <UIText className="flex-1 font-semibold text-gray-900">{activity.title}</UIText>
                  <UIText className={`text-xs font-bold px-2 py-1 rounded ${
                    activity.isIncluded ? "bg-green-200 text-green-800" : "bg-gray-300 text-gray-800"
                  }`}>
                    {activity.isIncluded ? "Incluida" : "Opcional"}
                  </UIText>
                </View>
                <UIText className="mb-1 text-xs text-gray-600">📍 {activity.location}</UIText>
                <UIText className="mb-2 text-sm text-gray-700">{activity.description}</UIText>
                <View className="flex-row items-center justify-between">
                  <UIText className="text-xs text-gray-600">⏱️ {activity.duration}</UIText>
                  {activity.cost && !activity.isIncluded && (
                    <UIText className="text-xs font-semibold text-red-600">${activity.cost}</UIText>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Participants - T-43, T-44, T-45: View with Ratings */}
        {packageData.participants && packageData.participants.length > 0 && (
          <View className="mb-6">
            <UIText className="mb-3 text-base font-semibold text-gray-900">
              👥 Viajeros ({packageData.participants.length})
            </UIText>
            <ParticipantsList
              participants={packageData.participants.map((p: any) => ({
                id: p.id,
                userId: p.userId,
                userName: p.userName || "Usuario Desconocido",
                userImage: p.userImage,
                joinedAt: new Date(p.joinedAt),
                averageRating: p.averageRating ? parseFloat(p.averageRating.toString()) : 5.0,
                totalRatings: p.totalRatings || 0,
                isCreator: p.userId === packageData.creatorId,
              }))}
              loading={false}
              emptyMessage="Sé el primero en unirte"
            />
          </View>
        )}

        {/* Creator Info */}
        {packageData.creator && (
          <View className="mb-6 rounded-lg bg-indigo-50 p-4">
            <UIText className="mb-3 font-semibold text-gray-900">📋 Organizador</UIText>
            <View className="flex-row items-start">
              <View className="mr-3 h-16 w-16 items-center justify-center rounded-full bg-indigo-200">
                {packageData.creator.image ? (
                  <UIText className="text-2xl">🧑</UIText>
                ) : (
                  <UIText className="text-2xl font-bold text-indigo-600">
                    {packageData.creator.name.charAt(0).toUpperCase()}
                  </UIText>
                )}
              </View>
              <View className="flex-1">
                <UIText className="font-semibold text-gray-900">{packageData.creator.name}</UIText>
                <UIText className="text-sm text-gray-600">{packageData.creator.email}</UIText>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="mb-6 flex-col gap-3">
          {!session?.user ? (
            <Button
              onPress={() => router.push("/sign-in")}
              className="bg-blue-600"
            >
              <UIText className="text-white font-semibold">Inicia sesión para unirte</UIText>
            </Button>
          ) : isCreator ? (
            <Button
              onPress={() => router.push(`/packages/${id}/edit`)}
              className="bg-purple-600"
            >
              <UIText className="text-white font-semibold">Editar Paquete</UIText>
            </Button>
          ) : userParticipating ? (
            <Button
              onPress={handleLeavePackage}
              disabled={actionLoading}
              className={actionLoading ? "opacity-50" : "bg-red-600"}
            >
              <UIText className="text-white font-semibold">
                {actionLoading ? "Abandonando..." : "Abandonar Paquete"}
              </UIText>
            </Button>
          ) : canJoinPackage ? (
            <Button
              onPress={handleJoinPackage}
              disabled={actionLoading}
              className={actionLoading ? "opacity-50" : "bg-green-600"}
            >
              <UIText className="text-white font-semibold">
                {actionLoading ? "Uniéndose..." : "¡Únete Ahora!"}
              </UIText>
            </Button>
          ) : (
            <Button disabled className="opacity-50 bg-gray-400">
              <UIText className="text-white font-semibold">Paquete Lleno</UIText>
            </Button>
          )}

          <Button
            onPress={() => router.back()}
            className="bg-gray-300"
          >
            <UIText className="text-gray-800 font-semibold">Volver</UIText>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
