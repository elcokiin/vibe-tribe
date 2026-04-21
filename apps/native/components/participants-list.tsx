import { View, ScrollView, FlatList } from "react-native";
import { Text as UIText } from "@/components/ui/text";

interface Participant {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  joinedAt: Date;
  averageRating?: number;
  totalRatings?: number;
  isCreator?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: number;
}

/**
 * T-44: Participant List Component
 * 
 * Displays list of package participants with:
 * - Avatar
 * - Name
 * - Average rating (1-5 stars)
 * - Number of ratings
 * - Organizer badge if applicable
 */
export function ParticipantsList({
  participants,
  loading = false,
  emptyMessage = "Sin participantes aún",
  maxHeight,
}: ParticipantsListProps) {
  if (loading) {
    return (
      <View className="py-4 items-center">
        <UIText className="text-gray-500">Cargando participantes...</UIText>
      </View>
    );
  }

  if (!participants || participants.length === 0) {
    return (
      <View className="py-4 items-center">
        <UIText className="text-gray-500">{emptyMessage}</UIText>
      </View>
    );
  }

  const renderStars = (rating: number = 5, size: "sm" | "md" = "sm") => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <View className="flex-row items-center gap-1">
        {/* Full Stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <UIText key={`full-${i}`} className={size === "sm" ? "text-xs" : "text-sm"}>
            ⭐
          </UIText>
        ))}
        {/* Half Star */}
        {hasHalfStar && (
          <UIText className={size === "sm" ? "text-xs" : "text-sm"}>
            ⭐‍
          </UIText>
        )}
        {/* Empty Stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <UIText
            key={`empty-${i}`}
            className={`${size === "sm" ? "text-xs" : "text-sm"} opacity-30`}
          >
            ⭐
          </UIText>
        ))}
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={participants}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item: participant }) => (
          <View className="mb-3 flex-row items-start rounded-lg bg-gray-50 p-4">
            {/* Avatar */}
            <View className="mr-3 h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
              {participant.userImage ? (
                <UIText className="text-lg">👤</UIText>
              ) : (
                <UIText className="text-lg font-bold text-white">
                  {participant.userName.charAt(0).toUpperCase()}
                </UIText>
              )}
            </View>

            {/* Info */}
            <View className="flex-1">
              {/* Name + Creator Badge */}
              <View className="mb-1 flex-row items-center gap-2">
                <UIText className="flex-1 font-semibold text-gray-900">
                  {participant.userName}
                </UIText>
                {participant.isCreator && (
                  <View className="rounded-full bg-yellow-100 px-2 py-1">
                    <UIText className="text-xs font-bold text-yellow-700">
                      Organizador
                    </UIText>
                  </View>
                )}
              </View>

              {/* Rating */}
              <View className="mb-1 flex-row items-center gap-2">
                {renderStars(participant.averageRating ?? 5, "sm")}
                <UIText className="text-xs text-gray-600">
                  {participant.averageRating?.toFixed(1) ?? "5.0"}
                  {(participant.totalRatings ?? 0) > 0 && (
                    <UIText className="text-xs text-gray-500">
                      ({participant.totalRatings} reseñas)
                    </UIText>
                  )}
                </UIText>
              </View>

              {/* Join Date */}
              <UIText className="text-xs text-gray-500">
                Se unió: {new Date(participant.joinedAt).toLocaleDateString("es-ES")}
              </UIText>
            </View>
          </View>
        )}
      />
    </View>
  );
}

/**
 * Standalone participant card for single display
 */
export function ParticipantCard({ participant }: { participant: Participant }) {
  return (
    <View className="mb-3 flex-row items-start rounded-lg bg-gray-50 p-4">
      <View className="mr-3 h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
        <UIText className="text-lg font-bold text-white">
          {participant.userName.charAt(0).toUpperCase()}
        </UIText>
      </View>

      <View className="flex-1">
        <UIText className="font-semibold text-gray-900">{participant.userName}</UIText>
        <UIText className="text-xs text-gray-600">
          ⭐ {participant.averageRating?.toFixed(1) ?? "5.0"} (
          {participant.totalRatings ?? 0} reseñas)
        </UIText>
      </View>
    </View>
  );
}

/**
 * Mini rating badge for quick display
 */
export function RatingBadge({
  rating = 5,
  count = 0,
  size = "md",
}: {
  rating?: number;
  count?: number;
  size?: "sm" | "md" | "lg";
}) {
  const colors = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const bgColor = rating >= 4.5 ? "bg-green-100" : rating >= 3.5 ? "bg-yellow-100" : "bg-red-100";
  const textColor =
    rating >= 4.5 ? "text-green-800" : rating >= 3.5 ? "text-yellow-800" : "text-red-800";

  return (
    <View className={`rounded-full ${bgColor} ${colors[size]}`}>
      <UIText className={`font-bold ${textColor}`}>
        ⭐ {rating.toFixed(1)} {count > 0 && `(${count})`}
      </UIText>
    </View>
  );
}
