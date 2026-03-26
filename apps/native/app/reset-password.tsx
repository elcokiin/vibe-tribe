import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppBackground } from "@/components/app-background";
import { Container } from "@/components/container";
import { ResetPassword } from "@/components/reset-password";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export default function ResetPasswordScreen() {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <AppBackground>
      <Container className="px-5 py-10">
        <View className="mb-5 flex-row justify-end">
          <ThemeToggle />
        </View>

        <View className="flex-1 justify-center">
          <Card className="border-border/60 bg-transparent shadow-none border-0">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
              <Text className="text-muted-foreground">
                Crea una nueva contraseña para volver a entrar a tu cuenta.
              </Text>
            </CardHeader>

            <CardContent className="gap-4 px-0">
              {isCompleted ? (
                <View className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2">
                  <Text className="text-sm text-green-700 dark:text-green-400">
                    Tu contraseña fue actualizada correctamente.
                  </Text>
                </View>
              ) : null}

              {!isCompleted ? <ResetPassword onSuccess={() => setIsCompleted(true)} /> : null}

              <Text className="text-sm text-muted-foreground">
                Ir a{" "}
                <Link href={"/sign-in" as never} className="font-medium text-secondary">
                  Iniciar sesión
                </Link>
              </Text>
            </CardContent>
          </Card>
        </View>
      </Container>
    </AppBackground>
  );
}
