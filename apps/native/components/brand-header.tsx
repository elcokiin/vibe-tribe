import { Image, View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type BrandHeaderProps = {
  className?: string;
  compact?: boolean;
  showTagline?: boolean;
  align?: "left" | "center";
};

export function BrandHeader({
  className,
  compact = false,
  showTagline = true,
  align = "center",
}: BrandHeaderProps) {
  const isCentered = align === "center";

  return (
    <View
      className={cn(
        "gap-3",
        isCentered ? "items-center" : "items-start",
        compact ? "gap-2" : "gap-3",
        className,
      )}
    >
      <View
        className={cn("flex-row items-center", compact ? "gap-2" : "gap-3")}
      >
        <Image
          source={require("../assets/brand/logomark.png")}
          accessibilityLabel="VibeTribe logomark"
          resizeMode="contain"
          style={{ width: compact ? 34 : 46, height: compact ? 34 : 46 }}
        />

        <Image
          source={require("../assets/brand/wordmark.png")}
          accessibilityLabel="VibeTribe wordmark"
          resizeMode="contain"
          style={{ width: compact ? 120 : 172, height: compact ? 26 : 36 }}
        />
      </View>

      {showTagline ? (
        <Text
          className={cn(
            "text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          tu vibra es tu pasaporte
        </Text>
      ) : null}
    </View>
  );
}
