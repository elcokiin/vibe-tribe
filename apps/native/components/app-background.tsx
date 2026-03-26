import { type PropsWithChildren } from "react";
import { View } from "react-native";

import { cn } from "@/lib/utils";

type AppBackgroundProps = PropsWithChildren<{
  className?: string;
}>;

export function AppBackground({ children, className }: AppBackgroundProps) {
  return (
    <View className={cn("relative flex-1 bg-background", className)}>
      <View className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10" />
      <View className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-secondary/15" />
      <View className="absolute bottom-0 left-0 right-0 h-56 rounded-t-[48px] bg-accent/10" />
      <View className="flex-1">{children}</View>
    </View>
  );
}
