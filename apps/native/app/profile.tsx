import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { Image, View } from "react-native";

import { AppBackground } from "@/components/app-background";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export default function ProfileScreen() {
  const router = useRouter();
  const tanstackQueryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const isEmailVerified = session?.user?.emailVerified === true;

  const profile = useQuery(
    orpc.profile.getMine.queryOptions({
      enabled: !!session?.user,
    }),
  );

  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [favoritesDraft, setFavoritesDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const profileQueryKey = useMemo(() => orpc.profile.getMine.queryKey(), []);

  const updateProfile = useMutation(
    orpc.profile.updateMine.mutationOptions({
      async onMutate(input) {
        await tanstackQueryClient.cancelQueries({ queryKey: profileQueryKey });
        const previous = tanstackQueryClient.getQueryData(profileQueryKey);

        tanstackQueryClient.setQueryData(profileQueryKey, (current) => {
          if (!current || typeof current !== "object") {
            return current;
          }

          return {
            ...current,
            description: input.description ?? (current as { description?: string }).description ?? "",
            favoriteDestinations:
              input.favoriteDestinations ?? (current as { favoriteDestinations?: string[] }).favoriteDestinations ?? [],
            avatarUrl: input.avatarUrl ?? (current as { avatarUrl?: string | null }).avatarUrl ?? null,
            updatedAt: new Date(),
          };
        });

        return { previous };
      },
      onError(_error, _input, context) {
        if (context?.previous !== undefined) {
          tanstackQueryClient.setQueryData(profileQueryKey, context.previous);
        }
      },
      onSettled() {
        tanstackQueryClient.invalidateQueries({ queryKey: profileQueryKey });
      },
    }),
  );

  useEffect(() => {
    if (!profile.data) {
      return;
    }

    if (descriptionDraft || favoritesDraft) {
      return;
    }

    setDescriptionDraft(profile.data.description ?? "");
    setFavoritesDraft((profile.data.favoriteDestinations ?? []).join(", "));
  }, [descriptionDraft, favoritesDraft, profile.data]);

  if (!isSessionPending && (!session?.user || !isEmailVerified)) {
    return <Redirect href={"/sign-in" as never} />;
  }

  const profileName = profile.data?.name ?? session?.user?.name ?? "Traveler";
  const profileAvatar = profile.data?.avatarUrl ?? session?.user?.image ?? null;

  async function onPickAvatar() {
    setSaveError(null);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setSaveError("Necesitamos acceso a tus fotos para actualizar la imagen de perfil.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets[0];

    if (!picked?.base64) {
      setSaveError("No pudimos procesar la imagen seleccionada. Intenta con otra foto.");
      return;
    }

    const mimeType = picked.mimeType ?? "image/jpeg";
    const avatarUrl = `data:${mimeType};base64,${picked.base64}`;

    updateProfile.mutate(
      { avatarUrl },
      {
        onError() {
          setSaveError("No pudimos actualizar la foto de perfil. Intenta de nuevo.");
        },
      },
    );
  }

  function onSaveProfile() {
    setSaveError(null);

    const favoriteDestinations = favoritesDraft
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    updateProfile.mutate(
      {
        description: descriptionDraft.trim(),
        favoriteDestinations,
      },
      {
        onError() {
          setSaveError("No pudimos guardar los cambios del perfil.");
        },
      },
    );
  }

  return (
    <AppBackground>
      <Container className="px-5 py-10">
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold">Mi Perfil</Text>
            <Text className="text-muted-foreground">Gestiona tu foto, descripcion y destinos favoritos.</Text>
          </View>
          <ThemeToggle />
        </View>

        <Card className="border-border/60 bg-card/95">
          <CardHeader>
            <View className="gap-1">
              <CardTitle>Informacion personal</CardTitle>
              <CardDescription>Los cambios se guardan y se reflejan inmediatamente.</CardDescription>
            </View>
          </CardHeader>

          <CardContent className="gap-4">
            <View className="flex-row items-center gap-3">
              {profileAvatar ? (
                <Image
                  source={{ uri: profileAvatar }}
                  style={{ width: 72, height: 72, borderRadius: 999 }}
                  accessibilityLabel="Foto de perfil"
                />
              ) : (
                <View className="bg-muted h-[72px] w-[72px] items-center justify-center rounded-full">
                  <Text className="text-lg font-semibold">{profileName.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}

              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold">{profileName}</Text>
                <Text className="text-muted-foreground text-sm">
                  {profile.data?.email ?? session?.user?.email ?? "-"}
                </Text>
              </View>

              <Button variant="outline" onPress={onPickAvatar} disabled={updateProfile.isPending}>
                <Text>{updateProfile.isPending ? "Guardando..." : "Cambiar foto"}</Text>
              </Button>
            </View>

            <View className="gap-2">
              <Label>Descripcion</Label>
              <Input
                value={descriptionDraft}
                onChangeText={setDescriptionDraft}
                placeholder="Cuentanos sobre tu estilo de viaje"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="h-28 py-3"
              />
            </View>

            <View className="gap-2">
              <Label>Destinos favoritos</Label>
              <Input
                value={favoritesDraft}
                onChangeText={setFavoritesDraft}
                placeholder="Ej: Kyoto, Cusco, Cartagena"
              />
              <Text className="text-muted-foreground text-xs">Separalos con comas.</Text>
            </View>

            {saveError ? <Text className="text-destructive text-sm">{saveError}</Text> : null}

            <View className="flex-row gap-2">
              <Button variant="outline" onPress={() => router.back()}>
                <Text>Volver</Text>
              </Button>
              <Button onPress={onSaveProfile} disabled={updateProfile.isPending || profile.isLoading}>
                <Text>{updateProfile.isPending ? "Guardando cambios..." : "Guardar perfil"}</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </Container>
    </AppBackground>
  );
}
