import { SymbolView } from 'expo-symbols';

type AppIconProps = {
  ios: string;
  android: string;
  color: string;
  size?: number;
};

export function AppIcon({ ios, android, color, size = 20 }: AppIconProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android } as never}
      tintColor={color}
      size={size}
    />
  );
}
