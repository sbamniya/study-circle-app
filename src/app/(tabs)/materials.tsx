import { AddMaterialDialog } from '@/components/add-material-dialog';
import {
  useConfirmDialog,
} from "@/components/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  studyMaterialsApi,
  type StudyMaterial,
  type StudyMaterialQuizStatus,
  type StudyMaterialStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Feather } from "@expo/vector-icons";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 8;

const STATUS_LABELS: Record<StudyMaterialStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PROCESSED: "Processed",
  PROCESSING_FAILED: "Failed",
  GENERATING_NOTES: "Generating Notes",
  NOTES_GENERATED: "Notes Ready",
  NOTES_GENERATION_FAILED: "Notes Failed",
  ARCHIVED: "Archived",
};

const QUIZ_STATUS_LABELS: Record<StudyMaterialQuizStatus, string> = {
  PENDING: "Pending",
  GENERATING: "Generating",
  GENERATED: "Generated",
  GENERATION_FAILED: "Failed",
};

function formatShortDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function summarizeStatuses(material: StudyMaterial) {
  const statuses = material.files.map((file) => file.status);
  if (statuses.length === 0) {
    return STATUS_LABELS[material.status];
  }

  const hasFailed = statuses.some(
    (status) =>
      status === "PROCESSING_FAILED" || status === "NOTES_GENERATION_FAILED",
  );
  if (hasFailed) {
    return "Needs Attention";
  }

  const hasProcessing = statuses.some(
    (status) => status === "PROCESSING" || status === "GENERATING_NOTES",
  );
  if (hasProcessing) {
    return "In Progress";
  }

  const hasReady = statuses.some(
    (status) => status === "PROCESSED" || status === "NOTES_GENERATED",
  );
  if (hasReady) {
    return "Ready";
  }

  return STATUS_LABELS[material.status];
}

function summarizeQuiz(material: StudyMaterial) {
  const quizStatuses = material.files.map((file) => file.quizStatus);

  if (quizStatuses.length === 0) {
    return QUIZ_STATUS_LABELS[material.quizStatus];
  }

  const generatedCount = quizStatuses.filter(
    (status) => status === "GENERATED",
  ).length;
  const failedCount = quizStatuses.filter(
    (status) => status === "GENERATION_FAILED",
  ).length;
  const generatingCount = quizStatuses.filter(
    (status) => status === "GENERATING",
  ).length;

  if (generatedCount === quizStatuses.length) {
    return "All Generated";
  }

  if (generatingCount > 0) {
    return "Generating";
  }

  if (failedCount > 0) {
    return "Some Failed";
  }

  return `${generatedCount}/${quizStatuses.length} Generated`;
}

export default function MaterialsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();
  const [page, setPage] = React.useState(1);
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      return studyMaterialsApi.delete(token as string, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["study-materials"],
      });
      void materialsQuery.refetch();
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      subjectId: string;
      file: {
        uri: string;
        name: string;
        type: string;
      };
    }) => {
      return studyMaterialsApi.create(token as string, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['study-materials'],
      });
      setPage(1);
      void materialsQuery.refetch();
      Alert.alert('Success', 'Study material created successfully.');
    },
  });

  const materialsQuery = useQuery({
    queryKey: ["study-materials", token, page, PAGE_SIZE],
    queryFn: async () =>
      studyMaterialsApi.list(token as string, {
        page,
        limit: PAGE_SIZE,
      }),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const materials = materialsQuery.data?.data ?? [];
  const totalItems = materialsQuery.data?.pagination.totalItems ?? 0;
  const totalPages =
    materialsQuery.data?.pagination.totalPages ??
    Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const isRefreshing = materialsQuery.isFetching && !materialsQuery.isLoading;

  const startIndex = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(page * PAGE_SIZE, totalItems);

  function onRefresh() {
    void materialsQuery.refetch();
  }

  function onPreviousPage() {
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }

  function onNextPage() {
    setPage((currentPage) => Math.min(totalPages, currentPage + 1));
  }

  async function onDeleteMaterial(material: StudyMaterial) {
    const confirmed = await confirm({
      title: "Delete Study Material",
      description: `Are you sure you want to delete \"${material.title}\"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteMaterialMutation.mutateAsync(material.id);
      Alert.alert("Deleted", "Study material deleted successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete the study material right now.";
      Alert.alert("Delete Failed", message);
    }
  }

  async function onCreateMaterial(payload: {
    title: string;
    description?: string;
    subjectId: string;
    file: {
      uri: string;
      name: string;
      type: string;
    };
  }) {
    await createMaterialMutation.mutateAsync(payload);
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
      >
        <View className="mx-auto w-full max-w-md gap-4 pb-8">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-semibold">Study Materials</Text>
              <Text className="text-muted-foreground text-sm">
                Mobile uses a card grid for fast browsing.
              </Text>
            </View>
            <Button
              size="icon"
              variant="outline"
              onPress={onRefresh}
              disabled={materialsQuery.isLoading || materialsQuery.isFetching}
            >
              {materialsQuery.isLoading || materialsQuery.isFetching ? (
                <ActivityIndicator size="small" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#a3a3a3" />
              )}
            </Button>
          </View>

          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Buy from Library will be available soon.",
                )
              }
            >
              <Feather name="shopping-bag" size={16} color="#a3a3a3" />
              <Text>Buy from Library</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={() => setShowAddDialog(true)}
            >
              <Feather name="plus" size={16} color="#000000" />
              <Text>Add Material</Text>
            </Button>
          </View>

          {materialsQuery.isLoading ? (
            <View className="gap-3">
              {[0, 1, 2, 3].map((item) => (
                <Card key={item} className="gap-3 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-base">
                      Loading material...
                    </CardTitle>
                    <CardDescription>Fetching latest materials</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </View>
          ) : null}

          {!materialsQuery.isLoading && materials.length === 0 ? (
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle>No Materials Found</CardTitle>
                <CardDescription>
                  Upload your first study material to start organizing your
                  learning content.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4">
                <Button
                  size="sm"
                  className="self-start"
                  onPress={() => setShowAddDialog(true)}
                >
                  <Feather name="plus" size={16} color="#ffffff" />
                  <Text>Upload Material</Text>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!materialsQuery.isLoading && materials.length > 0 ? (
            <>
              <FlatList
                data={materials}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerClassName="gap-3"
                renderItem={({ item }) => (
                  <Card className="gap-3 py-4">
                    <CardHeader className="gap-2 px-4">
                      <View className="flex-row items-start justify-between gap-2">
                        <CardTitle
                          className="text-base flex-1"
                          numberOfLines={2}
                        >
                          {item.title}
                        </CardTitle>
                        <Button
                          size="icon"
                          variant="destructive"
                          onPress={() => onDeleteMaterial(item)}
                          disabled={deleteMaterialMutation.isPending}
                        >
                          {deleteMaterialMutation.isPending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Feather name="trash-2" size={16} color="#ffffff" />
                          )}
                        </Button>
                      </View>
                      <CardDescription numberOfLines={3}>
                        {item.description?.trim() || "No description provided"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="gap-2 px-4">
                      <View className="gap-1">
                        <Text className="text-muted-foreground text-xs">
                          Subject
                        </Text>
                        <Text className="text-sm font-medium" numberOfLines={1}>
                          {item.subject?.name ?? "N/A"}
                        </Text>
                      </View>

                      <View className="gap-1">
                        <Text className="text-muted-foreground text-xs">
                          Created
                        </Text>
                        <Text className="text-sm">
                          {formatShortDate(item.createdAt)}
                        </Text>
                      </View>

                      <View className="flex-row flex-wrap gap-1">
                        <View className="bg-muted rounded-full px-2 py-1">
                          <Text className="text-xs">
                            Files: {item._count?.files ?? item.files.length}
                          </Text>
                        </View>
                        <View className="rounded-full bg-orange-100 px-2 py-1">
                          <Text className="text-xs text-orange-700">
                            {summarizeStatuses(item)}
                          </Text>
                        </View>
                        <View className="rounded-full bg-blue-100 px-2 py-1">
                          <Text className="text-xs text-blue-700">
                            Quiz: {summarizeQuiz(item)}
                          </Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                )}
              />

              <Card className="gap-3 py-4">
                <CardHeader className="gap-2 px-4">
                  <CardTitle className="text-base">Page {page}</CardTitle>
                  <CardDescription>
                    Showing {startIndex}-{endIndex} of {totalItems} materials.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-row items-center justify-between gap-2 px-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onPress={onPreviousPage}
                    disabled={page <= 1 || materialsQuery.isFetching}
                  >
                    <Feather name="chevron-left" size={16} color="#a3a3a3" />
                    <Text>Previous</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onPress={onNextPage}
                    disabled={page >= totalPages || materialsQuery.isFetching}
                  >
                    <Text>Next</Text>
                    <Feather name="chevron-right" size={16} color="#a3a3a3" />
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}
        </View>
      </ScrollView>

      <AddMaterialDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={onCreateMaterial}
        submitting={createMaterialMutation.isPending}
      />
    </SafeAreaView>
  );
}
