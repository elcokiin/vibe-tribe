import { Link } from "expo-router";
import { View } from "react-native";

import { AppBackground } from "@/components/app-background";
import { Container } from "@/components/container";
import { ForgotPassword } from "@/components/forgot-password";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export default function ForgotPasswordScreen() {
  return (
    <AppBackground>
      <Container className="px-5 py-10">
        <View className="mb-5 flex-row justify-end">
          <ThemeToggle />
        </View>

        <View className="flex-1 justify-center">
          <Card className="border-border/60 bg-transparent shadow-none border-0">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Olvidé mi contraseña</CardTitle>
              <Text className="text-muted-foreground">
                Te enviaremos un código de verificación para restablecerla.
              </Text>
            </CardHeader>

            <CardContent className="gap-4 px-0">
              <ForgotPassword />

              <Text className="text-sm text-muted-foreground">
                ¿Ya tienes el código?{" "}
                <Link href={"/reset-password" as never} className="font-medium text-secondary">
                  Restablecer contraseña
                </Link>
              </Text>

              <Text className="text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <Link href={"/sign-in" as never} className="font-medium text-secondary">
                  Volver a iniciar sesión
                </Link>
              </Text>
            </CardContent>
          </Card>
        </View>
      </Container>
    </AppBackground>
  );
}
