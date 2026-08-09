import { AddNoteDialog } from "@/components/add-note-dialog";
import { useConfirmDialog } from "@/components/confirm-dialog-provider";
import {
  AppBottomSheet,
  AppBottomSheetScrollView,
} from "@/components/ui/app-bottom-sheet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option as SelectOption,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { notesApi, subjectsApi, type Note, type Subject } from "@/lib/api";
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

function toSelectOptions(subjects: Subject[]): SelectOption[] {
  return subjects.map((subject) => ({
    value: String(subject.id),
    label: subject.name,
  }));
}

function decodeHtmlEntities(content: string) {
  return content
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function toPlainText(content: string) {
  return decodeHtmlEntities(content)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toMultilineText(content: string) {
  return decodeHtmlEntities(content)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<(p|div|li|h1|h2|h3|h4|h5|h6)(\s+[^>]*)?>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(content: string) {
  const normalized = toPlainText(content);
  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}

export default function NotesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();
  const [page, setPage] = React.useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState("");
  const [showNoteDialog, setShowNoteDialog] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [detailsNote, setDetailsNote] = React.useState<Note | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ["subjects", token],
    queryFn: async () =>
      subjectsApi.list(token as string, {
        page: 1,
        limit: 200,
      }),
    enabled: Boolean(token),
  });

  const subjectOptions = React.useMemo(
    () => toSelectOptions(subjectsQuery.data?.data ?? []),
    [subjectsQuery.data?.data],
  );

  const selectedSubject =
    subjectOptions.find((option) => option?.value === selectedSubjectId) ?? null;

  const notesQuery = useQuery({
    queryKey: ["notes", token, page, PAGE_SIZE, selectedSubjectId],
    queryFn: async () =>
      notesApi.list(token as string, {
        page,
        limit: PAGE_SIZE,
        subjectId: selectedSubjectId || undefined,
      }),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (payload: { content: string; subjectId: number }) => {
      return notesApi.create(token as string, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setPage(1);
      void notesQuery.refetch();
      Alert.alert("Success", "Note created successfully.");
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      content: string;
      subjectId: number;
    }) => {
      return notesApi.update(token as string, payload.id, {
        content: payload.content,
        subjectId: payload.subjectId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      void notesQuery.refetch();
      Alert.alert("Success", "Note updated successfully.");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return notesApi.delete(token as string, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      void notesQuery.refetch();
    },
  });

  const notes = notesQuery.data?.data ?? [];
  const totalItems = notesQuery.data?.pagination.totalItems ?? 0;
  const totalPages =
    notesQuery.data?.pagination.totalPages ??
    Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const isRefreshing = notesQuery.isFetching && !notesQuery.isLoading;

  const startIndex = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(page * PAGE_SIZE, totalItems);

  function onRefresh() {
    void notesQuery.refetch();
  }

  function onPreviousPage() {
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }

  function onNextPage() {
    setPage((currentPage) => Math.min(totalPages, currentPage + 1));
  }

  function onStartCreateNote() {
    setEditingNote(null);
    setShowNoteDialog(true);
  }

  function onStartEditNote(note: Note) {
    setEditingNote(note);
    setShowNoteDialog(true);
  }

  function onOpenNoteDetails(note: Note) {
    setDetailsNote(note);
  }

  async function onDeleteNote(note: Note) {
    const confirmed = await confirm({
      title: "Delete Note",
      description:
        "Are you sure you want to delete this note? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteNoteMutation.mutateAsync(note.id);
      Alert.alert("Deleted", "Note deleted successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete the note right now.";
      Alert.alert("Delete Failed", message);
    }
  }

  async function onSubmitNote(payload: { content: string; subjectId: number }) {
    if (editingNote?.id) {
      await updateNoteMutation.mutateAsync({
        id: editingNote.id,
        ...payload,
      });
      return;
    }

    await createNoteMutation.mutateAsync(payload);
  }

  const isSubmitting =
    createNoteMutation.isPending || updateNoteMutation.isPending;

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
              <Text className="text-2xl font-semibold">Notes</Text>
              <Text className="text-muted-foreground text-sm">
                Mobile uses a single-column card feed for fast browsing.
              </Text>
            </View>
            <Button
              size="icon"
              variant="outline"
              onPress={onRefresh}
              disabled={notesQuery.isLoading || notesQuery.isFetching}
            >
              {notesQuery.isLoading || notesQuery.isFetching ? (
                <ActivityIndicator size="small" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#a3a3a3" />
              )}
            </Button>
          </View>

          <View className="gap-2">
            <Text className="text-muted-foreground text-xs">
              Filter by subject
            </Text>
            <Select
              value={selectedSubject!}
              onValueChange={(option) => {
                setSelectedSubjectId(option?.value ?? "");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    subjectsQuery.isLoading
                      ? "Loading subjects..."
                      : "All subjects"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {subjectOptions.map((subject) => (
                    <SelectItem
                      key={subject?.value}
                      value={subject?.value!}
                      label={subject?.label!}
                    />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {subjectsQuery.isError ? (
              <Text className="text-destructive text-xs">
                Failed to load subjects for filtering.
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onPress={() => {
                setSelectedSubjectId("");
                setPage(1);
              }}
              disabled={!selectedSubjectId}
            >
              <Feather name="x-circle" size={16} color="#a3a3a3" />
              <Text>Clear Filter</Text>
            </Button>
            <Button className="flex-1" onPress={onStartCreateNote}>
              <Feather name="plus" size={16} color="#000000" />
              <Text>Add Note</Text>
            </Button>
          </View>

          {notesQuery.isLoading ? (
            <View className="gap-3">
              {[0, 1, 2, 3].map((item) => (
                <Card key={item} className="gap-3 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-base">Loading note...</CardTitle>
                    <CardDescription>Fetching latest notes</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </View>
          ) : null}

          {!notesQuery.isLoading && notes.length === 0 ? (
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle>No Notes Found</CardTitle>
                <CardDescription>
                  Add your first note to start tracking ideas and key points.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4">
                <Button
                  size="sm"
                  className="self-start"
                  onPress={onStartCreateNote}
                >
                  <Feather name="plus" size={16} color="#ffffff" />
                  <Text>Add Note</Text>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!notesQuery.isLoading && notes.length > 0 ? (
            <>
              <FlatList
                data={notes}
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
                          {item.subject?.name ?? "General"}
                        </CardTitle>
                        <View className="flex-row gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            onPress={() => onOpenNoteDetails(item)}
                            disabled={
                              isSubmitting || deleteNoteMutation.isPending
                            }
                          >
                            <Feather
                              name="more-horizontal"
                              size={14}
                              color="#a3a3a3"
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            onPress={() => onStartEditNote(item)}
                            disabled={
                              isSubmitting || deleteNoteMutation.isPending
                            }
                          >
                            <Feather name="edit-2" size={14} color="#a3a3a3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-9 w-9"
                            onPress={() => onDeleteNote(item)}
                            disabled={
                              isSubmitting || deleteNoteMutation.isPending
                            }
                          >
                            {deleteNoteMutation.isPending ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Feather
                                name="trash-2"
                                size={14}
                                color="#ffffff"
                              />
                            )}
                          </Button>
                        </View>
                      </View>
                      <CardDescription numberOfLines={6}>
                        {toPlainText(item.content)}
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

                      <View className="flex-row flex-wrap gap-1">
                        <View className="bg-muted rounded-full px-2 py-1">
                          <Text className="text-xs">
                            Words: {countWords(item.content)}
                          </Text>
                        </View>
                        <View className="rounded-full bg-orange-100 px-2 py-1">
                          <Text className="text-xs text-orange-700">
                            Type:{" "}
                            {item.type === "GENERATED"
                              ? "AI Generated"
                              : "Custom"}
                          </Text>
                        </View>
                        <View className="rounded-full bg-blue-100 px-2 py-1">
                          <Text className="text-xs text-blue-700">
                            Created: {formatShortDate(item.createdAt)}
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
                    Showing {startIndex}-{endIndex} of {totalItems} notes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-row items-center justify-between gap-2 px-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onPress={onPreviousPage}
                    disabled={page <= 1 || notesQuery.isFetching}
                  >
                    <Feather name="chevron-left" size={16} color="#a3a3a3" />
                    <Text>Previous</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onPress={onNextPage}
                    disabled={page >= totalPages || notesQuery.isFetching}
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

      <AddNoteDialog
        key={editingNote?.id ?? "create"}
        open={showNoteDialog}
        onOpenChange={(open) => {
          setShowNoteDialog(open);
          if (!open) {
            setEditingNote(null);
          }
        }}
        editingNote={editingNote}
        onSubmit={onSubmitNote}
        submitting={isSubmitting}
      />

      <AppBottomSheet
        open={Boolean(detailsNote)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsNote(null);
          }
        }}
        title="Note Details"
        description={
          detailsNote
            ? `Subject: ${detailsNote.subject?.name ?? "N/A"} • Created: ${formatShortDate(detailsNote.createdAt)}`
            : "Full note content and metadata."
        }
      >
        <AppBottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
        >
          <View className="gap-1">
            <Text className="text-muted-foreground text-xs">Content</Text>
            <Text className="text-sm leading-6">
              {detailsNote ? toMultilineText(detailsNote.content) : ""}
            </Text>
          </View>

          <View className="gap-1">
            <Text className="text-muted-foreground text-xs">Subject</Text>
            <Text className="text-sm font-medium">
              {detailsNote?.subject?.name ?? "N/A"}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-1">
            <View className="bg-muted rounded-full px-2 py-1">
              <Text className="text-xs">
                Words: {detailsNote ? countWords(detailsNote.content) : 0}
              </Text>
            </View>
            <View className="bg-muted rounded-full px-2 py-1">
              <Text className="text-xs text-muted-foreground">
                Type: {detailsNote?.type === "GENERATED" ? "AI Generated" : "Custom"}
              </Text>
            </View>
            <View className="bg-muted rounded-full px-2 py-1">
              <Text className="text-xs text-muted-foreground">
                Created: {detailsNote ? formatShortDate(detailsNote.createdAt) : "Unknown date"}
              </Text>
            </View>
          </View>
        </AppBottomSheetScrollView>

        <View className="pt-2">
          <Button variant="outline" onPress={() => setDetailsNote(null)}>
            <Text>Close</Text>
          </Button>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
}
