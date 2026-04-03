function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  EXPO_PUBLIC_SERVER_URL: requireEnv("EXPO_PUBLIC_SERVER_URL"),
} as const;
