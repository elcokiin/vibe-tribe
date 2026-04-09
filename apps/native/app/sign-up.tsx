import { Link, Redirect, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { AppBackground } from "@/components/app-background";
import { BrandHeader } from "@/components/brand-header";
import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

export default function SignUpScreen() {
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const { data: session, isPending } = authClient.useSession();
  const isEmailVerified = session?.user?.emailVerified === true;
  const isVerifyModeFromParams = params.mode === "verify";

  const prefilledEmailFromParams = (() => {
    if (typeof params.email !== "string") {
      return undefined;
    }

    try {
      return decodeURIComponent(params.email);
    } catch {
      return params.email;
    }
  })();

  const isVerifyMode = isVerifyModeFromParams || (!!session?.user && !isEmailVerified);
  const prefilledEmail = prefilledEmailFromParams ?? session?.user?.email;

  if (session?.user && isEmailVerified) {
    return <Redirect href={"/home" as never} />;
  }

  return (
    <AppBackground>
      <Container className="px-5 py-10">
        <View className="mb-5 flex-row justify-end">
          <ThemeToggle />
        </View>

        <View className="flex-1 justify-center">
          <Card className="border-border/60 bg-transparent shadow-none border-0">
            <BrandHeader className="mb-6" />
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
              <Text className="text-muted-foreground">
                Empieza ahora y accede a tu panel de inicio.
              </Text>
            </CardHeader>
            <CardContent className="gap-4 px-0">
              {isPending ? (
                <Text className="text-muted-foreground">
                  Verificando sesión...
                </Text>
              ) : (
                <SignUp
                  initialMode={isVerifyMode ? "verify" : "default"}
                  prefilledEmail={prefilledEmail}
                  prefillMessage={
                    isVerifyMode
                      ? "Tu cuenta existe, pero debes verificar tu correo para continuar."
                      : undefined
                  }
                />
              )}

              <Text className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href={"/sign-in" as never}
                  className="font-medium text-secondary"
                >
                  Inicia sesión
                </Link>
              </Text>
            </CardContent>
          </Card>
        </View>
      </Container>
    </AppBackground>
  );
}
