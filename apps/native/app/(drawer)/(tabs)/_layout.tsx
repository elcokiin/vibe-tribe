import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useAppTheme } from "@/contexts/app-theme-context";
import { getThemeColors } from "@/lib/theme";

export default function TabLayout() {
  const { isDark } = useAppTheme();
  const theme = getThemeColors(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          color: theme.foreground,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
