import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { AppBackground } from "@/components/app-background";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text as UIText } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <AppBackground>
        <Container>
          <View className="flex-1 justify-center items-center p-4">
            <Card className="items-center p-6 max-w-sm rounded-lg bg-secondary border-secondary">
              <CardContent className="items-center p-0">
                <UIText className="text-4xl mb-3">404</UIText>
                <UIText className="text-foreground font-medium text-lg mb-1">Page Not Found</UIText>
                <UIText className="text-muted-foreground text-sm text-center mb-4">
                  The page you're looking for doesn't exist.
                </UIText>
                <Link href={"/sign-in" as never} asChild>
                  <Button size="sm">
                    <UIText>Go to Sign In</UIText>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </View>
        </Container>
      </AppBackground>
    </>
  );
}
