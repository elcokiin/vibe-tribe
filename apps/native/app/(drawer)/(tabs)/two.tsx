import { View } from "react-native";

import { Container } from "@/components/container";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function TabTwo() {
  return (
    <Container className="p-6">
      <View className="flex-1 justify-center items-center">
        <Card className="p-8 items-center bg-secondary border-secondary">
          <CardContent className="items-center p-0">
            <CardTitle className="text-3xl mb-2">TabTwo</CardTitle>
          </CardContent>
        </Card>
      </View>
    </Container>
  );
}
