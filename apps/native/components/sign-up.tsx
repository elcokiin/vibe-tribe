import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text as UIText } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { getFieldError, mapAuthErrorMessage } from "@/lib/form-errors";
import { queryClient } from "@/utils/orpc";

const signUpSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().min(1, "El correo electrónico es requerido").email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida").min(8, "Usa al menos 8 caracteres"),
});

export function SignUp() {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);

      await authClient.signUp.email(
        {
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
        },
        {
          onError(error) {
            setServerError(
              mapAuthErrorMessage(error, "No se pudo crear la cuenta. Intenta de nuevo en un momento."),
            );
          },
          onSuccess() {
            formApi.reset();
            queryClient.refetchQueries();
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
          {({ isSubmitting, submissionAttempts }) => {
            return (
              <>
                {!!serverError && (
                  <View className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                    <UIText className="text-destructive text-sm">{serverError}</UIText>
                  </View>
                )}

                <View className="gap-3">
                  <form.Field name="name">
                    {(field) => (
                      <View className="gap-1">
                        <Label>Nombre</Label>
                        <Input
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChangeText={(text) => {
                            if (serverError) {
                              setServerError(null);
                            }
                            field.handleChange(text);
                          }}
                          placeholder="Juan Pérez"
                          autoComplete="name"
                          textContentType="name"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                          onSubmitEditing={() => {
                            emailInputRef.current?.focus();
                          }}
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

                  <form.Field name="email">
                    {(field) => (
                      <View className="gap-1">
                        <Label>Correo electrónico</Label>
                        <Input
                          ref={emailInputRef}
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
                          blurOnSubmit={false}
                          className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                          onSubmitEditing={() => {
                            passwordInputRef.current?.focus();
                          }}
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

                  <form.Field name="password">
                    {(field) => (
                      <View className="gap-1">
                        <Label>Contraseña</Label>
                        <Input
                          ref={passwordInputRef}
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
                      <UIText>Crear Cuenta</UIText>
                    )}
                  </Button>
                </View>
              </>
            );
          }}
        </form.Subscribe>
    </View>
  );
}
