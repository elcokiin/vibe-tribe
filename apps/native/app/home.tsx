import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Server, ShieldCheck, ShieldX } from "lucide-react-native";

import { AppBackground } from "@/components/app-background";
import { BrandHeader } from "@/components/brand-header";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { queryClient, orpc } from "@/utils/orpc";

export default function HomeScreen() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const isEmailVerified = session?.user?.emailVerified === true;
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());
  const isConnected = healthCheck.data === "OK";

  if (!isSessionPending && (!session?.user || !isEmailVerified)) {
    return <Redirect href={"/sign-in" as never} />;
  }

  return (
    <AppBackground>
      <Container className="px-5 py-10">
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <BrandHeader compact showTagline={false} align="left" className="mb-2" />
            <Text className="text-muted-foreground">Protected route with backend health check.</Text>
          </View>
          <ThemeToggle />
        </View>

        <View className="gap-5">
          <Card className="border-border/60 bg-card/95">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={Server} className="text-primary" />
                  <CardTitle>Sprint 2 Features</CardTitle>
                </View>
              </View>
              <CardDescription>Opciones añadidas para el manejo de paquetes.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <Button variant="default" onPress={() => router.push("/packages/search" as never)}>
                <Text>Buscar Paquetes</Text>
              </Button>
              <Button variant="default" onPress={() => router.push("/packages/create" as never)}>
                <Text>Crear Paquete</Text>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/95">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon as={Server} className="text-primary" />
                  <CardTitle>Health Check</CardTitle>
                </View>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  <Text>{isConnected ? "LIVE" : "OFFLINE"}</Text>
                </Badge>
              </View>
              <CardDescription>Checks connectivity with your API server.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <Button variant="outline" onPress={() => router.push("/profile" as never)}>
                <Text>Ir a mi perfil</Text>
              </Button>

              {healthCheck.isLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" />
                  <Text className="text-muted-foreground">Checking connection...</Text>
                </View>
              ) : isConnected ? (
                <View className="flex-row items-center gap-2">
                  <Icon as={ShieldCheck} className="text-primary" />
                  <Text>Connection is healthy.</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Icon as={ShieldX} className="text-destructive" />
                  <Text className="text-destructive">Could not reach the API.</Text>
                </View>
              )}

              <Button
                variant="destructive"
                onPress={() => {
                  authClient.signOut();
                  queryClient.invalidateQueries();
                }}
              >
                <Text>Sign Out</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </Container>
    </AppBackground>
  );
}
