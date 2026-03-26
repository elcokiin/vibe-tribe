import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Text, View, Pressable } from "react-native";

import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Text as UIText } from "@/components/ui/text";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { useAppTheme } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { getThemeColors } from "@/lib/theme";
import { queryClient, orpc } from "@/utils/orpc";

export default function Home() {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());
  const privateData = useQuery(orpc.privateData.queryOptions());
  const isConnected = healthCheck?.data === "OK";
  const isLoading = healthCheck?.isLoading;
  const { data: session } = authClient.useSession();
  const { isDark } = useAppTheme();
  const theme = getThemeColors(isDark);

  return (
    <Container className="p-6">
      <View className="py-4 mb-6">
        <Text className="text-4xl font-bold text-foreground mb-2">BETTER T STACK</Text>
      </View>

      {session?.user ? (
        <Card className="mb-6 p-4 bg-secondary border-secondary">
          <Text className="text-foreground text-base mb-2">
            Welcome, <Text className="font-medium">{session.user.name}</Text>
          </Text>
          <Text className="text-muted-foreground text-sm mb-4">{session.user.email}</Text>
          <Pressable
            className="bg-destructive py-3 px-4 rounded-lg self-start active:opacity-70"
            onPress={() => {
              authClient.signOut();
              queryClient.invalidateQueries();
            }}
          >
            <Text className="text-destructive-foreground font-medium">Sign Out</Text>
          </Pressable>
        </Card>
      ) : null}

      <Card className="p-6 bg-secondary border-secondary">
        <View className="flex-row items-center justify-between mb-4">
          <CardTitle>System Status</CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"}>
            <UIText>{isConnected ? "LIVE" : "OFFLINE"}</UIText>
          </Badge>
        </View>

        <Card className="p-4">
          <CardContent className="p-0">
          <View className="flex-row items-center">
            <View
              className={`w-3 h-3 rounded-full mr-3 ${isConnected ? "bg-primary" : "bg-muted"}`}
            />
            <View className="flex-1">
              <Text className="text-foreground font-medium mb-1">ORPC Backend</Text>
              <CardDescription>
                {isLoading
                  ? "Checking connection..."
                  : isConnected
                    ? "Connected to API"
                    : "API Disconnected"}
              </CardDescription>
            </View>
            {isLoading && <Ionicons name="hourglass-outline" size={20} color={theme.muted} />}
            {!isLoading && isConnected && (
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            )}
            {!isLoading && !isConnected && (
              <Ionicons name="close-circle" size={20} color={theme.danger} />
            )}
          </View>
          </CardContent>
        </Card>
      </Card>

      <Card className="mt-6 p-4 bg-secondary border-secondary">
        <CardTitle className="mb-3">Private Data</CardTitle>
        {privateData && <CardDescription>{privateData.data?.message}</CardDescription>}
      </Card>

      {!session?.user && (
        <>
          <SignIn />
          <SignUp />
        </>
      )}
    </Container>
  );
}
