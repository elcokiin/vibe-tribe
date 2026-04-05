import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
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

const verifyEmailSchema = z.object({
  otp: z.string().trim().min(1, "El código es requerido").length(6, "El código debe tener 6 dígitos"),
});

type VerificationData = {
  email: string;
  password: string | null;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

type SignUpProps = {
  initialMode?: "default" | "verify";
  prefilledEmail?: string;
  prefillMessage?: string;
};

export function SignUp({ initialMode = "default", prefilledEmail, prefillMessage }: SignUpProps) {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(prefillMessage ?? null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(() => {
    if (initialMode === "verify" && prefilledEmail?.trim()) {
      return { email: prefilledEmail.trim(), password: null };
    }

    return null;
  });
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const isVerifyOnlyMode = initialMode === "verify";

  const sendVerificationOtp = async (email: string, successText: string) => {
    await authClient.emailOtp.sendVerificationOtp(
      {
        email,
        type: "email-verification",
      },
      {
        onError(error) {
          setServerError(
            mapAuthErrorMessage(error, "No se pudo enviar el código. Intenta de nuevo en un momento."),
          );
        },
        onSuccess() {
          setSuccessMessage(successText);
        },
      },
    );
  };

  useEffect(() => {
    if (!isVerifyOnlyMode || !prefilledEmail?.trim()) {
      return;
    }

    setServerError(null);
    const verificationMessage = prefillMessage
      ? `${prefillMessage} Te enviamos un código para verificar tu correo.`
      : "Te enviamos un código para verificar tu correo.";

    void sendVerificationOtp(prefilledEmail.trim(), verificationMessage);
  }, [isVerifyOnlyMode, prefilledEmail, prefillMessage]);

  const otpForm = useForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: verifyEmailSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!verificationData) {
        return;
      }

      setServerError(null);
      setSuccessMessage(null);

      await authClient.emailOtp.verifyEmail(
        {
          email: verificationData.email,
          otp: value.otp.trim(),
        },
        {
          async onSuccess() {
            if (verificationData.password) {
              await authClient.signIn.email(
                {
                  email: verificationData.email,
                  password: verificationData.password,
                },
                {
                  onError(error) {
                    setServerError(
                      mapAuthErrorMessage(error, "El correo fue verificado, pero no se pudo iniciar sesión automáticamente."),
                    );
                  },
                  onSuccess() {
                    formApi.reset();
                    signUpForm.reset();
                    setVerificationData(null);
                    queryClient.refetchQueries();
                  },
                },
              );
              return;
            }

            setSuccessMessage("Correo verificado. Redirigiendo...");
            queryClient.refetchQueries();
          },
          onError(error) {
            setServerError(
              mapAuthErrorMessage(error, "No se pudo verificar el código. Intenta de nuevo o solicita uno nuevo."),
            );
          },
        },
      );
    },
  });

  const signUpForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value, formApi: _formApi }) => {
      setServerError(null);
      setSuccessMessage(null);

      const payload: SignUpPayload = {
        name: value.name.trim(),
        email: value.email.trim(),
        password: value.password,
      };

      await authClient.signUp.email(
        payload,
        {
          onError(error) {
            setServerError(
              mapAuthErrorMessage(error, "No se pudo crear la cuenta. Intenta de nuevo en un momento."),
            );
          },
          onSuccess() {
            setVerificationData({
              email: payload.email,
              password: payload.password,
            });
            setSuccessMessage("Te enviamos un código de verificación a tu correo. Ingrésalo para completar el registro.");
            otpForm.reset();
          },
        },
      );
    },
  });

  const handleResendOtp = async () => {
    if (!verificationData) {
      return;
    }

    setServerError(null);
    setSuccessMessage(null);
    setIsResendingOtp(true);

    try {
      await sendVerificationOtp(verificationData.email, "Te reenviamos un nuevo código de verificación.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const isVerifyingStep = !!verificationData;

  return (
    <View>
      <signUpForm.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          submissionAttempts: state.submissionAttempts,
        })}
      >
        {({ isSubmitting: isSignUpSubmitting, submissionAttempts: signUpSubmissionAttempts }) => (
          <otpForm.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          submissionAttempts: state.submissionAttempts,
        })}
          >
            {({ isSubmitting: isOtpSubmitting, submissionAttempts: otpSubmissionAttempts }) => {
              const isAnySubmitting = isSignUpSubmitting || isOtpSubmitting || isResendingOtp;

            return (
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
                  {!isVerifyingStep && (
                    <signUpForm.Field name="name">
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
                          editable={!isAnySubmitting}
                          className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                          onSubmitEditing={() => {
                            emailInputRef.current?.focus();
                          }}
                        />

                        {(() => {
                          const shouldShowFieldError = field.state.meta.isTouched || signUpSubmissionAttempts > 0;
                          const fieldError = getFieldError(field.state.meta.errors);

                          if (!shouldShowFieldError || !fieldError) {
                            return null;
                          }

                          return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                        })()}
                      </View>
                    )}
                    </signUpForm.Field>
                  )}

                  {!isVerifyingStep && (
                    <signUpForm.Field name="email">
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
                          editable={!isAnySubmitting}
                          className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                          onSubmitEditing={() => {
                            passwordInputRef.current?.focus();
                          }}
                        />

                        {(() => {
                          const shouldShowFieldError = field.state.meta.isTouched || signUpSubmissionAttempts > 0;
                          const fieldError = getFieldError(field.state.meta.errors);

                          if (!shouldShowFieldError || !fieldError) {
                            return null;
                          }

                          return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                        })()}
                      </View>
                    )}
                    </signUpForm.Field>
                  )}

                  {!isVerifyingStep && (
                    <signUpForm.Field name="password">
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
                          editable={!isAnySubmitting}
                          className={getFieldError(field.state.meta.errors) ? "border-destructive" : undefined}
                          onSubmitEditing={signUpForm.handleSubmit}
                        />

                        {(() => {
                          const shouldShowFieldError = field.state.meta.isTouched || signUpSubmissionAttempts > 0;
                          const fieldError = getFieldError(field.state.meta.errors);

                          if (!shouldShowFieldError || !fieldError) {
                            return null;
                          }

                          return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                        })()}
                      </View>
                    )}
                    </signUpForm.Field>
                  )}

                  {isVerifyingStep && (
                    <>
                      <View className="mb-1">
                        <UIText className="text-sm text-muted-foreground">
                          Ingresa el código de 6 dígitos que enviamos a {verificationData.email}.
                        </UIText>
                      </View>

                      <otpForm.Field name="otp">
                        {(field) => (
                          <View className="gap-1">
                            <Label>Código de verificación</Label>
                            <InputOTP
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
                              placeholder="123456"
                              returnKeyType="go"
                              editable={!isAnySubmitting}
                              invalid={!!getFieldError(field.state.meta.errors)}
                              onSubmitEditing={otpForm.handleSubmit}
                            />

                            {(() => {
                              const shouldShowFieldError = field.state.meta.isTouched || otpSubmissionAttempts > 0;
                              const fieldError = getFieldError(field.state.meta.errors);

                              if (!shouldShowFieldError || !fieldError) {
                                return null;
                              }

                              return <UIText className="text-destructive text-xs">{fieldError}</UIText>;
                            })()}
                          </View>
                        )}
                      </otpForm.Field>
                    </>
                  )}

                  {!isVerifyingStep ? (
                    <Button onPress={signUpForm.handleSubmit} disabled={isAnySubmitting} className="mt-1">
                      {isSignUpSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <UIText>Crear Cuenta</UIText>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button onPress={otpForm.handleSubmit} disabled={isAnySubmitting} className="mt-1">
                        {isOtpSubmitting ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <UIText>Verificar código</UIText>
                        )}
                      </Button>

                      <Button onPress={handleResendOtp} disabled={isAnySubmitting} variant="outline">
                        {isResendingOtp ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <UIText>Reenviar código</UIText>
                        )}
                      </Button>
                    </>
                  )}
                </View>
              </>
            );
          }}
        </otpForm.Subscribe>
        )}
      </signUpForm.Subscribe>
    </View>
  );
}
