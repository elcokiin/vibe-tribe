import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text as UIText } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { getFieldError, mapAuthErrorMessage } from "@/lib/form-errors";

const resetPasswordSchema = z
  .object({
    email: z.string().trim().min(1, "El correo electrónico es requerido").email("Ingresa un correo electrónico válido"),
    otp: z.string().trim().min(1, "El código es requerido").length(6, "El código debe tener 6 dígitos"),
    newPassword: z.string().min(1, "La contraseña es requerida").min(8, "Usa al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

type ResetPasswordProps = { onSuccess: () => void };

export function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);

      await authClient.emailOtp.resetPassword(
        {
          email: value.email.trim(),
          otp: value.otp.trim(),
          password: value.newPassword,
          fetchOptions: {
            onError(error) {
              setServerError(
                mapAuthErrorMessage(error, "No se pudo actualizar la contraseña. Verifica el código e intenta de nuevo."),
              );
            },
            onSuccess() {
              formApi.reset();
              onSuccess();
            },
          },
        },
      );
    },
  });

  return (
    <View>
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          submissionAttempts: state.submissionAttempts,
        })}
      >
        {({ isSubmitting, submissionAttempts }) => (
          <>
            {!!serverError && (
              <View className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                <UIText className="text-destructive text-sm">{serverError}</UIText>
              </View>
            )}

            <View className="gap-3">
              <form.Field name="email">
                {(field) => (
                  <View className="gap-1">
                    <Label>Correo electrónico</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={(text) => {
                        if (serverError) {
                          setServerError(null);
                        }
                        field.handleChange(text);
                      }}
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      editable={!isSubmitting}
                      className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                    />

                    {(() => {
                      const shouldShowFieldError = field.state.meta.isTouched || submissionAttempts > 0;
                      const fieldError = getFieldError(field.state.meta.errors);

                      if (!shouldShowFieldError || !fieldError) {
                        return null;
                      }

                      return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                    })()}
                  </View>
                )}
              </form.Field>

              <form.Field name="otp">
                {(field) => (
                  <View className="gap-1">
                    <Label>Código de verificación</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={(text) => {
                        if (serverError) {
                          setServerError(null);
                        }
                        const sanitized = text.replace(/\D/g, "").slice(0, 6);
                        field.handleChange(sanitized);
                      }}
                      placeholder="123456"
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      returnKeyType="next"
                      editable={!isSubmitting}
                      className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                    />

                    {(() => {
                      const shouldShowFieldError = field.state.meta.isTouched || submissionAttempts > 0;
                      const fieldError = getFieldError(field.state.meta.errors);

                      if (!shouldShowFieldError || !fieldError) {
                        return null;
                      }

                      return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                    })()}
                  </View>
                )}
              </form.Field>

              <form.Field name="newPassword">
                {(field) => (
                  <View className="gap-1">
                    <Label>Nueva contraseña</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={(text) => {
                        if (serverError) {
                          setServerError(null);
                        }
                        field.handleChange(text);
                      }}
                      placeholder="••••••••"
                      secureTextEntry
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="next"
                      editable={!isSubmitting}
                      className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                    />

                    {(() => {
                      const shouldShowFieldError = field.state.meta.isTouched || submissionAttempts > 0;
                      const fieldError = getFieldError(field.state.meta.errors);

                      if (!shouldShowFieldError || !fieldError) {
                        return null;
                      }

                      return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                    })()}
                  </View>
                )}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => (
                  <View className="gap-1">
                    <Label>Confirmar contraseña</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={(text) => {
                        if (serverError) {
                          setServerError(null);
                        }
                        field.handleChange(text);
                      }}
                      placeholder="••••••••"
                      secureTextEntry
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="go"
                      editable={!isSubmitting}
                      className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                      onSubmitEditing={form.handleSubmit}
                    />

                    {(() => {
                      const shouldShowFieldError = field.state.meta.isTouched || submissionAttempts > 0;
                      const fieldError = getFieldError(field.state.meta.errors);

                      if (!shouldShowFieldError || !fieldError) {
                        return null;
                      }

                      return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                    })()}
                  </View>
                )}
              </form.Field>

              <Button onPress={form.handleSubmit} disabled={isSubmitting} className="mt-1">
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <UIText>Actualizar contraseña</UIText>
                )}
              </Button>
            </View>
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
