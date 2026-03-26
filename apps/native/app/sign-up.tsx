import { Link, Redirect } from "expo-router";
import { View } from "react-native";

import { AppBackground } from "@/components/app-background";
import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

export default function SignUpScreen() {
  const { data: session, isPending } = authClient.useSession();

  if (session?.user) {
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
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
              <Text className="text-muted-foreground">
                Empieza ahora y accede a tu panel de inicio protegido.
              </Text>
            </CardHeader>
            <CardContent className="gap-4 px-0">
              {isPending ? <Text className="text-muted-foreground">Verificando sesión...</Text> : <SignUp />}

              <Text className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href={"/sign-in" as never} className="font-medium text-secondary">
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
