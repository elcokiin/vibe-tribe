import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";

import { client, orpc } from "@/utils/orpc";
import { BrandHeader } from "@/components/brand-header";
import { Text as UIText } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import CreatePackageForm, { type CreatePackageFormHandle } from "@/components/create-package";

/**
 * T-39, T-40, T-41, T-42: Edit/Cancel Package Screen (HU-08)
 * 
 * Route: /packages/[id]/edit
 * Purpose: Edit or cancel a travel package (creator only)
 * 
 * Features:
 * - T-39: Pre-load form with current package data
 * - T-40: Update endpoint integration with visual confirmation
 * - T-41: Delete flow with confirmation modal
 * - T-42: Creator-only authorization + error handling
 */
export default function EditPackageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [formRef, setFormRef] = useState<CreatePackageFormHandle | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch package details on mount
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        if (!id) {
          setError("ID de paquete no proporcionado");
          setIsLoading(false);
          return;
        }

        const data = await client.package.getById({ id });
        setPackageData(data);

        // T-42: Validate creator authorization
        if (data.creatorId !== session?.user?.id) {
          setError("No tienes permiso para editar este paquete");
          return;
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el paquete");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      void fetchPackage();
    }
  }, [id, session?.user?.id]);

  // Handle package update (T-40)
  const handleSaveChanges = async () => {
    if (!formRef || !id || !packageData) return;

    try {
      setIsSaving(true);
      const formData = formRef.getFormData();

      // Validate form data
      if (!formData.title || !formData.destination) {
        setError("Por favor completa todos los campos requeridos");
        return;
      }

      // Validate date logic
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        setError("La fecha de fin debe ser posterior a la fecha de inicio");
        return;
      }

      // Call update endpoint
      const result = await orpc.package.update.mutate({
        id,
        title: formData.title,
        destination: formData.destination,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        maxParticipants: formData.maxParticipants,
        price: formData.price,
        accommodation: formData.accommodation,
        accommodationDetails: formData.accommodationDetails,
        tags: formData.tags ?? [],
      });

      // Show success message
      setSuccessMessage("✅ Cambios guardados exitosamente");
      setError(null);

      // Auto-clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.message === "Unauthorized" || err.message === "403"
          ? "No tienes permiso para editar este paquete"
          : err.message || "Error al guardar cambios";

      setError(errorMessage);
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle package deletion (T-41)
  const handleDeletePackage = async () => {
    if (!id || !packageData) return;

    try {
      setIsDeleting(true);
      setShowDeleteModal(false);

      // Call delete endpoint
      await orpc.package.delete.mutate({ id });

      // Show success and navigate back
      Alert.alert("Paquete Eliminado", "El paquete ha sido cancelado exitosamente", [
        {
          text: "OK",
          onPress: () => {
            router.push("/packages");
          },
        },
      ]);
    } catch (err: any) {
      const errorMessage =
        err.message === "Unauthorized" || err.message === "403"
          ? "No tienes permiso para eliminar este paquete"
          : err.message || "Error al eliminar paquete";

      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmChecked(false);
    }
  };

  // T-42: Unauthorized state
  if (error === "No tienes permiso para editar este paquete") {
    return (
      <View className="flex-1 bg-white">
        <BrandHeader title="Error de Acceso" />
        <View className="flex-1 items-center justify-center px-4">
          <UIText className="mb-4 text-center text-lg font-bold text-red-600">
            Acceso Denegado (403)
          </UIText>
          <UIText className="mb-6 text-center text-gray-600">
            Solo el creador del paquete puede editarlo o cancelarlo.
          </UIText>
          <Button onPress={() => router.back()} className="bg-blue-600">
            <UIText className="text-white font-semibold">Volver</UIText>
          </Button>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0080FF" />
        <UIText className="mt-4 text-gray-600">Cargando paquete...</UIText>
      </View>
    );
  }

  if (error || !packageData) {
    return (
      <View className="flex-1 bg-white">
        <BrandHeader title="Error" />
        <View className="flex-1 items-center justify-center px-4">
          <UIText className="text-center text-red-600 mb-4">
            {error || "No se pudo cargar el paquete"}
          </UIText>
          <Button onPress={() => router.back()}>
            <UIText className="text-white font-semibold">Volver</UIText>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        contentInsetAdjustmentBehavior="automatic"
      >
        <BrandHeader title="Editar Paquete" />

        <View className="px-4 py-6">
          {/* Success Message */}
          {successMessage && (
            <View className="mb-4 rounded-lg bg-green-50 p-3">
              <UIText className="text-sm font-medium text-green-800">
                {successMessage}
              </UIText>
            </View>
          )}

          {/* Info Message */}
          <View className="mb-6 rounded-lg bg-blue-50 p-4">
            <UIText className="text-sm font-semibold text-blue-900">
              📝 Edita los detalles de tu paquete
            </UIText>
            <UIText className="mt-2 text-xs text-blue-800">
              Los cambios se guardarán inmediatamente. Los participantes actuales recibirán una notificación de los cambios.
            </UIText>
          </View>

          {/* T-39: Pre-loaded form with current data */}
          <CreatePackageForm
            ref={setFormRef}
            initialValues={{
              title: packageData.title,
              destination: packageData.destination,
              description: packageData.description,
              startDate: packageData.startDate,
              endDate: packageData.endDate,
              maxParticipants: packageData.maxParticipants,
              price: packageData.price,
              accommodation: packageData.accommodation ?? "",
              accommodationDetails: packageData.accommodationDetails ?? {
                rating: 0,
                amenities: [],
              },
              tags: packageData.tags ?? [],
            }}
          />

          {/* Error Message */}
          {error && (
            <View className="mb-4 mt-4 rounded-lg bg-red-50 p-3">
              <UIText className="text-sm font-medium text-red-800">{error}</UIText>
            </View>
          )}

          {/* Action Buttons */}
          <View className="mt-8 gap-3">
            {/* Save Button (T-40) */}
            <Button
              onPress={handleSaveChanges}
              disabled={isSaving || isDeleting}
              className={isSaving ? "opacity-50 bg-green-600" : "bg-green-600"}
            >
              <UIText className="text-white font-semibold">
                {isSaving ? "Guardando cambios..." : "💾 Guardar Cambios"}
              </UIText>
            </Button>

            {/* Cancel/Delete Button (T-41) */}
            <Button
              onPress={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className={isDeleting ? "opacity-50 bg-red-600" : "bg-red-600"}
            >
              <UIText className="text-white font-semibold">
                {isDeleting ? "Cancelando..." : "🗑️ Cancelar Paquete"}
              </UIText>
            </Button>

            {/* Back Button */}
            <Button
              onPress={() => router.back()}
              disabled={isSaving || isDeleting}
              className="bg-gray-300"
            >
              <UIText className="text-gray-800 font-semibold">Volver sin guardar</UIText>
            </Button>
          </View>

          <View className="mt-4 rounded-lg bg-yellow-50 p-3">
            <UIText className="text-xs text-yellow-800">
              ⚠️ Los cambios en fechas o capacidad podrían afectar a los participantes inscritos.
            </UIText>
          </View>
        </View>
      </ScrollView>

      {/* T-41: Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmChecked(false);
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="mx-4 rounded-2xl bg-white p-6">
            <UIText className="mb-4 text-xl font-bold text-gray-900">
              ⚠️ Cancelar Paquete
            </UIText>

            <UIText className="mb-4 text-gray-700">
              ¿Estás seguro de que deseas cancelar este paquete? Esta acción es irreversible y los participantes serán notificados.
            </UIText>

            <View className="mb-6 rounded-lg bg-red-50 p-3">
              <UIText className="text-sm font-semibold text-red-900">
                Paquete: {packageData.title}
              </UIText>
              <UIText className="mt-1 text-xs text-red-800">
                Participantes inscritos: {packageData.currentParticipants}
              </UIText>
            </View>

            {/* Confirmation Checkbox */}
            <TouchableOpacity
              onPress={() => setDeleteConfirmChecked(!deleteConfirmChecked)}
              className="mb-6 flex-row items-center rounded-lg border border-gray-300 p-3"
            >
              <View
                className={`mr-3 h-5 w-5 rounded border-2 items-center justify-center ${
                  deleteConfirmChecked ? "border-red-600 bg-red-600" : "border-gray-400"
                }`}
              >
                {deleteConfirmChecked && (
                  <UIText className="text-white font-bold">✓</UIText>
                )}
              </View>
              <UIText className="flex-1 text-sm text-gray-700">
                Entiendo que esta acción es irreversible
              </UIText>
            </TouchableOpacity>

            {/* Modal Buttons */}
            <View className="gap-2">
              <Button
                onPress={handleDeletePackage}
                disabled={!deleteConfirmChecked || isDeleting}
                className={
                  !deleteConfirmChecked || isDeleting
                    ? "opacity-50 bg-red-600"
                    : "bg-red-600"
                }
              >
                <UIText className="text-white font-semibold">
                  {isDeleting ? "Cancelando paquete..." : "Sí, Cancelar Paquete"}
                </UIText>
              </Button>

              <Button
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmChecked(false);
                }}
                disabled={isDeleting}
                className="bg-gray-300"
              >
                <UIText className="text-gray-800 font-semibold">No, mantener paquete</UIText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
