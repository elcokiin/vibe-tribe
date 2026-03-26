import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { Moon, Sun } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAppTheme } from "@/contexts/app-theme-context";

export function ThemeToggle() {
  const { toggleTheme, isLight } = useAppTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleTheme();
      }}
      className="rounded-full"
    >
      {isLight ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <Icon as={Moon} size={18} className="text-foreground" />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <Icon as={Sun} size={18} className="text-foreground" />
        </Animated.View>
      )}
    </Button>
  );
}
