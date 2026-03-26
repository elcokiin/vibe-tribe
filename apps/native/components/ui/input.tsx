import { cn } from '@/lib/utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/contexts/app-theme-context';
import { THEME } from '@/lib/theme';

function Input({
  className,
  placeholderTextColor,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  const { isDark } = useAppTheme();
  // Se usa explícitamente el color muted del tema configurado en tu theme.ts
  const defaultPlaceholderColor = isDark ? THEME.dark.muted : THEME.light.muted;

  return (
    <TextInput
      className={cn(
        'dark:bg-input/30 border-input bg-background text-foreground flex h-10 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 text-base leading-5 shadow-sm shadow-black/5 sm:h-9',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          // En nativo eliminamos la clase `placeholder:` porque Tailwind a veces interfiere 
          // con la propiedad explícita de `placeholderTextColor` que vamos a enviar
        }),
        className
      )}
      placeholderTextColor={placeholderTextColor ?? defaultPlaceholderColor}
      {...props}
    />
  );
}

export { Input };
