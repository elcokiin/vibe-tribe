import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text as UIText } from "@/components/ui/text";
import { orpc } from "@/utils/orpc";

/**
 * T-30: Validation schema for package creation form
 * Includes all required fields: destination, dates, duration, activities, accommodation
 */
const createPackageSchema = z.object({
  destination: z.string().trim().min(1, "El destino es requerido").max(200),
  title: z.string().trim().min(1, "El título es requerido").max(200),
  description: z.string().trim().min(10, "La descripción debe tener al menos 10 caracteres").max(2000),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de finalización es requerida"),
  maxParticipants: z.string().regex(/^\d+$/, "Debe ser un número válido").transform(Number).pipe(z.number().min(1).max(1000)),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Formato de precio inválido (ej: 1500.00)"),
  accommodation: z.string().trim().max(200).optional().or(z.literal("")),
  accommodationDetails: z.string().trim().max(500).optional().or(z.literal("")),
  tags: z.string().trim().optional().or(z.literal("")),
});

type CreatePackageFormProps = {
  onSuccess?: (packageId: string) => void;
  onError?: (error: string) => void;
};

export function CreatePackageForm({ onSuccess, onError }: CreatePackageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * T-30 & T-31: Form handling with validation and API integration
   */
  const form = useForm({
    defaultValues: {
      destination: "",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      maxParticipants: "10",
      price: "",
      accommodation: "",
      accommodationDetails: "",
      tags: "",
    },
    validators: {
      onSubmit: createPackageSchema,
      onChange: createPackageSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setGlobalError(null);

      try {
        // T-31: Call POST /packages endpoint
        const startDate = new Date(value.startDate);
        const endDate = new Date(value.endDate);

        // Validate dates on client
        if (startDate >= endDate) {
          throw new Error("La fecha de finalización debe ser posterior a la de inicio");
        }

        // Format price as decimal string
        const priceDecimal = parseFloat(value.price).toFixed(2);

        // Parse accommodation details if provided
        let accommodationDetails = null;
        if (value.accommodationDetails) {
          try {
            accommodationDetails = JSON.parse(value.accommodationDetails);
          } catch {
            // If not valid JSON, skip accommodation details
          }
        }

        const response = await orpc.package.create.mutate({
          destination: value.destination,
          title: value.title,
          description: value.description,
          startDate,
          endDate,
          maxParticipants: value.maxParticipants,
          price: priceDecimal,
          accommodation: value.accommodation || undefined,
          accommodationDetails: accommodationDetails || undefined,
          tags: value.tags ? value.tags.split(",").map((tag) => tag.trim()) : [],
        });

        if (response.success && response.id) {
          onSuccess?.(response.id);
        } else {
          throw new Error("No se pudo crear el paquete");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear el paquete";
        setGlobalError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <ScrollView className="flex-1 bg-white p-4" contentInsetAdjustmentBehavior="automatic">
      <View className="pb-8">
        {/* Error Alert */}
        {globalError && (
          <View className="mb-4 rounded-lg bg-red-50 p-4">
            <UIText className="text-sm font-medium text-red-800">{globalError}</UIText>
          </View>
        )}

        {/* Form Fields */}
        <form.Field name="destination">
          {(field) => (
            <View className="mb-4">
              <Label htmlFor="destination" className="mb-2">
                Destino *
              </Label>
              <Input
                id="destination"
                placeholder="ej: Cartagena, Colombia"
                value={field.state.value}
                onChangeText={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                editable={!isSubmitting}
              />
              {field.state.meta.errors && (
                <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
              )}
            </View>
          )}
        </form.Field>

        <form.Field name="title">
          {(field) => (
            <View className="mb-4">
              <Label htmlFor="title" className="mb-2">
                Título del Paquete *
              </Label>
              <Input
                id="title"
                placeholder="ej: Aventura en Cartagena"
                value={field.state.value}
                onChangeText={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                editable={!isSubmitting}
              />
              {field.state.meta.errors && (
                <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
              )}
            </View>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <View className="mb-4">
              <Label htmlFor="description" className="mb-2">
                Descripción *
              </Label>
              <Input
                id="description"
                placeholder="Describe tu paquete de viaje..."
                value={field.state.value}
                onChangeText={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                multiline
                numberOfLines={4}
                editable={!isSubmitting}
              />
              {field.state.meta.errors && (
                <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
              )}
            </View>
          )}
        </form.Field>

        <View className="grid grid-cols-2 gap-3 mb-4">
          <form.Field name="startDate">
            {(field) => (
              <View className="flex-1">
                <Label htmlFor="startDate" className="mb-2">
                  Inicio *
                </Label>
                <Input
                  id="startDate"
                  placeholder="2026-06-01"
                  value={field.state.value}
                  onChangeText={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                  editable={!isSubmitting}
                />
                {field.state.meta.errors && (
                  <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
                )}
              </View>
            )}
          </form.Field>

          <form.Field name="endDate">
            {(field) => (
              <View className="flex-1">
                <Label htmlFor="endDate" className="mb-2">
                  Fin *
                </Label>
                <Input
                  id="endDate"
                  placeholder="2026-06-05"
                  value={field.state.value}
                  onChangeText={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                  editable={!isSubmitting}
                />
                {field.state.meta.errors && (
                  <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
                )}
              </View>
            )}
          </form.Field>
        </View>

        <View className="grid grid-cols-2 gap-3 mb-4">
          <form.Field name="maxParticipants">
            {(field) => (
              <View className="flex-1">
                <Label htmlFor="maxParticipants" className="mb-2">
                  Máx. Participantes *
                </Label>
                <Input
                  id="maxParticipants"
                  placeholder="10"
                  value={field.state.value}
                  onChangeText={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
                {field.state.meta.errors && (
                  <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
                )}
              </View>
            )}
          </form.Field>

          <form.Field name="price">
            {(field) => (
              <View className="flex-1">
                <Label htmlFor="price" className="mb-2">
                  Precio USD *
                </Label>
                <Input
                  id="price"
                  placeholder="1500.00"
                  value={field.state.value}
                  onChangeText={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
                {field.state.meta.errors && (
                  <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
                )}
              </View>
            )}
          </form.Field>
        </View>

        <form.Field name="accommodation">
          {(field) => (
            <View className="mb-4">
              <Label htmlFor="accommodation" className="mb-2">
                Alojamiento (Opcional)
              </Label>
              <Input
                id="accommodation"
                placeholder="ej: Hotel 5 estrellas"
                value={field.state.value}
                onChangeText={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                editable={!isSubmitting}
              />
              {field.state.meta.errors && (
                <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
              )}
            </View>
          )}
        </form.Field>

        <form.Field name="tags">
          {(field) => (
            <View className="mb-6">
              <Label htmlFor="tags" className="mb-2">
                Tags (Opcional)
              </Label>
              <Input
                id="tags"
                placeholder="ej: playa, adventure, cultural (separados por comas)"
                value={field.state.value}
                onChangeText={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                editable={!isSubmitting}
              />
              {field.state.meta.errors && (
                <UIText className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</UIText>
              )}
            </View>
          )}
        </form.Field>

        {/* Submit Button */}
        <Button
          onPress={() => void form.handleSubmit()}
          disabled={isSubmitting}
          className={isSubmitting ? "opacity-50" : ""}
        >
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="white" />
              <UIText className="text-white font-semibold">Creando...</UIText>
            </View>
          ) : (
            <UIText className="text-white font-semibold">Crear Paquete</UIText>
          )}
        </Button>
      </View>
    </ScrollView>
  );
}
