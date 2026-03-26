import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback } from "react";
import { Pressable, Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAppTheme } from "@/contexts/app-theme-context";
import { getThemeColors } from "@/lib/theme";

function DrawerLayout() {
  const { isDark } = useAppTheme();
  const theme = getThemeColors(isDark);

  const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <Drawer
      screenOptions={{
        headerTintColor: theme.foreground,
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontWeight: "600",
          color: theme.foreground,
        },
        headerRight: renderThemeToggle,
        drawerStyle: { backgroundColor: theme.background },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Home",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : theme.foreground }}>Home</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons name="home-outline" size={size} color={focused ? color : theme.foreground} />
          ),
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerTitle: "Tabs",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : theme.foreground }}>Tabs</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <MaterialIcons
              name="border-bottom"
              size={size}
              color={focused ? color : theme.foreground}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable className="mr-4">
                <Ionicons name="add-outline" size={24} color={theme.foreground} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Drawer.Screen
        name="todos"
        options={{
          headerTitle: "Todos",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : theme.foreground }}>Todos</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="checkbox-outline"
              size={size}
              color={focused ? color : theme.foreground}
            />
          ),
        }}
      />
    </Drawer>
  );
}

export default DrawerLayout;
