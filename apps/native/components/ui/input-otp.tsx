import { cn } from "@/lib/utils";
import { useRef } from "react";
import { Pressable, TextInput, type TextInputProps, View } from "react-native";

import { Text } from "@/components/ui/text";

type InputOTPProps = Omit<TextInputProps, "value" | "onChangeText" | "maxLength"> & {
  value: string;
  onChangeText: (value: string) => void;
  maxLength?: number;
  invalid?: boolean;
};

export function InputOTP({
  value,
  onChangeText,
  maxLength = 6,
  invalid = false,
  editable,
  className,
  onBlur,
  onSubmitEditing,
  placeholder,
  ...props
}: InputOTPProps) {
  const inputRef = useRef<TextInput>(null);
  const isEditable = editable !== false;

  return (
    <Pressable
      accessible={false}
      className={cn("w-full", className)}
      onPress={() => {
        if (!isEditable) {
          return;
        }

        inputRef.current?.focus();
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        {Array.from({ length: maxLength }, (_, index) => {
          const char = value[index] ?? "";
          const isActive = isEditable && index === Math.min(value.length, maxLength - 1);

          return (
            <View
              key={index}
              className={cn(
                "border-input bg-background h-12 flex-1 items-center justify-center rounded-md border",
                invalid && "border-destructive",
                isActive && !invalid && "border-primary",
                !isEditable && "opacity-50",
              )}
            >
              <Text className="text-lg font-semibold tracking-[0.2em]">{char || " "}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        testID="otp-hidden-input"
        value={value}
        onChangeText={(text) => {
          const sanitized = text.replace(/\D/g, "").slice(0, maxLength);
          onChangeText(sanitized);
        }}
        maxLength={maxLength}
        keyboardType="number-pad"
        autoCapitalize="none"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        editable={isEditable}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder ?? "123456"}
        className="absolute inset-0 opacity-0"
        {...props}
      />
    </Pressable>
  );
}
