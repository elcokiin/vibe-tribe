import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Text as UIText } from "@/components/ui/text";
import { useAppTheme } from "@/contexts/app-theme-context";
import { getThemeColors } from "@/lib/theme";
import { orpc } from "@/utils/orpc";

export default function TodosScreen() {
  const [newTodoText, setNewTodoText] = useState("");
  const todos = useQuery(orpc.todo.getAll.queryOptions());
  const createMutation = useMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => {
        todos.refetch();
        setNewTodoText("");
      },
    }),
  );
  const toggleMutation = useMutation(
    orpc.todo.toggle.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    }),
  );
  const deleteMutation = useMutation(
    orpc.todo.delete.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    }),
  );

  const { isDark } = useAppTheme();
  const theme = getThemeColors(isDark);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      createMutation.mutate({ text: newTodoText });
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    toggleMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTodo = (id: number) => {
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id }),
      },
    ]);
  };

  const isLoading = todos?.isLoading;
  const completedCount = todos?.data?.filter((t) => t.completed).length || 0;
  const totalCount = todos?.data?.length || 0;

  return (
    <Container>
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <View className="py-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-semibold text-foreground tracking-tight">Tasks</Text>
            {totalCount > 0 && (
              <Badge variant="secondary">
                <UIText>
                  {completedCount}/{totalCount}
                </UIText>
              </Badge>
            )}
          </View>
        </View>

        <Card className="mb-4 p-3 rounded-lg bg-secondary border-secondary">
          <CardContent className="p-0">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  value={newTodoText}
                  onChangeText={setNewTodoText}
                  placeholder="Add a new task..."
                  editable={!createMutation.isPending}
                  onSubmitEditing={handleAddTodo}
                  returnKeyType="done"
                />
              </View>
              <Button
                variant={createMutation.isPending || !newTodoText.trim() ? "secondary" : "default"}
                disabled={createMutation.isPending || !newTodoText.trim()}
                onPress={handleAddTodo}
                size="sm"
                className="px-3"
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons
                    name="add"
                    size={20}
                    color={createMutation.isPending || !newTodoText.trim() ? theme.muted : theme.foreground}
                  />
                )}
              </Button>
            </View>
          </CardContent>
        </Card>

        {isLoading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={theme.foreground} />
            <Text className="text-muted-foreground text-sm mt-3">Loading tasks...</Text>
          </View>
        )}

        {todos?.data && todos.data.length === 0 && !isLoading && (
          <Card className="items-center justify-center py-10 rounded-lg bg-secondary border-secondary">
            <CardContent className="items-center justify-center p-0">
              <Ionicons name="checkbox-outline" size={40} color={theme.muted} />
              <Text className="text-foreground font-medium mt-3">No tasks yet</Text>
              <Text className="text-muted-foreground text-xs mt-1">Add your first task to get started</Text>
            </CardContent>
          </Card>
        )}

        {todos?.data && todos.data.length > 0 && (
          <View className="gap-2">
            {todos.data.map((todo) => (
              <Card key={todo.id} className="p-3 rounded-lg bg-secondary border-secondary">
                <CardContent className="p-0">
                  <View className="flex-row items-center gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                    />
                    <View className="flex-1">
                      <Text
                        className={`text-sm ${todo.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {todo.text}
                      </Text>
                    </View>
                    <Button
                      variant="ghost"
                      onPress={() => handleDeleteTodo(todo.id)}
                      size="sm"
                      className="px-2"
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
