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

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "El correo electrónico es requerido").email("Ingresa un correo electrónico válido"),
});

export function ForgotPassword() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      setSuccessMessage(null);

      await authClient.emailOtp.requestPasswordReset(
        {
          email: value.email.trim(),
        },
        {
          onError(error) {
            setServerError(
              mapAuthErrorMessage(error, "No se pudo enviar el correo de recuperación. Intenta de nuevo en un momento."),
            );
          },
          onSuccess() {
            setSuccessMessage(
              "Si el correo existe, te enviamos un código de verificación para restablecer tu contraseña.",
            );
            formApi.setFieldValue("email", value.email.trim());
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

            {!!successMessage && (
              <View className="mb-3 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2">
                <UIText className="text-sm text-green-700 dark:text-green-400">{successMessage}</UIText>
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
                        if (successMessage) {
                          setSuccessMessage(null);
                        }
                        field.handleChange(text);
                      }}
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
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
                {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : <UIText>Enviar código</UIText>}
              </Button>
            </View>
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
