import { useConfirmDialog } from "@/components/confirm-dialog-provider";
import {
    AppBottomSheet,
    AppBottomSheetScrollView,
} from "@/components/ui/app-bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
    quizzesApi,
    type QuizAttempt,
    type QuizQuestion,
    type QuizQuestionType,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ActivityIndicator, View } from "react-native";

type AnswerState = Record<string, { answer: string; saved: boolean }>;

function normalizeAnswerOption(option: string) {
  return option.trim().toLowerCase();
}

function trueFalseOptions() {
  return [
    { label: "True", value: "true" },
    { label: "False", value: "false" },
  ];
}

function QuestionOptions({
  type,
  options,
  value,
  onChange,
  autoAdvanceOnSelect,
}: {
  type: QuizQuestionType;
  options: string[];
  value: string;
  onChange: (next: string) => void;
  autoAdvanceOnSelect?: boolean;
}) {
  if (type === "SHORT_ANSWER") {
    return (
      <Input
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={6}
        className="h-32 py-3"
        textAlignVertical="top"
        placeholder="Type your answer here"
      />
    );
  }

  const renderedOptions =
    type === "TRUE_FALSE"
      ? trueFalseOptions()
      : options.map((option) => ({ label: option, value: option }));

  return (
    <View className="gap-2">
      {renderedOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <Button
            key={option.value}
            variant="outline"
            className={cn(
              "justify-start",
              isSelected && "border-primary bg-muted",
            )}
            onPress={() => {
              onChange(option.value);
              if (autoAdvanceOnSelect) {
                return;
              }
            }}
          >
            <Text>{option.label}</Text>
          </Button>
        );
      })}
    </View>
  );
}

export function StartQuizSheet({
  open,
  onOpenChange,
  attempt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempt: QuizAttempt | null;
}) {
  const { token } = useAuth();
  const confirm = useConfirmDialog();

  const quizQuery = useQuery({
    queryKey: ["quiz-details", token, attempt?.quizId],
    queryFn: async () =>
      quizzesApi.getById(token as string, attempt?.quizId as string),
    enabled: open && Boolean(token) && Boolean(attempt?.quizId),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      quizId: string;
      attemptId: string;
      answers: { questionId: string; answer: string }[];
    }) => {
      return quizzesApi.saveAnswers(
        token as string,
        payload.quizId,
        payload.attemptId,
        {
          answers: payload.answers,
        },
      );
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = quizQuery.data?.quizQuestions ?? [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<AnswerState>({});
  const [isShowingSolution, setIsShowingSolution] = React.useState(false);
  const [saveNotice, setSaveNotice] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!attempt) {
      return;
    }

    const initialAnswers: AnswerState = {};
    for (const answer of attempt.quizAttemptAnswers ?? []) {
      initialAnswers[answer.questionId] = {
        answer: answer.userAnswer,
        saved: true,
      };
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(initialAnswers);
    setCurrentQuestionIndex(
      Math.max((attempt.quizAttemptAnswers?.length ?? 1) - 1, 0),
    );
    setIsShowingSolution(false);
    setSaveNotice(null);
    setLastSavedAt(null);
  }, [attempt, attempt?.id]);

  const currentQuestion: QuizQuestion | null =
    questions.length > 0 ? (questions[currentQuestionIndex] ?? null) : null;

  const questionTypeById = React.useMemo(() => {
    const entries = questions.map(
      (question) => [question.id, question.type] as const,
    );
    return new Map(entries);
  }, [questions]);

  const currentAnswer = currentQuestion
    ? (answers[currentQuestion.id]?.answer ?? "")
    : "";
  const currentAnswerState = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const totalQuestions = questions.length;
  const isFirstQuestion = currentQuestionIndex <= 0;
  const isLastQuestion =
    totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1;
  const hasUnsavedAnswers = React.useMemo(
    () =>
      Object.values(answers).some(
        (value) => !value.saved && value.answer.trim().length > 0,
      ),
    [answers],
  );

  const progressPercent =
    totalQuestions > 0
      ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
      : 0;

  const currentSaveStateLabel = React.useMemo(() => {
    if (!currentQuestion) {
      return null;
    }

    if (!currentAnswerState?.answer?.trim()) {
      return "Not answered";
    }

    if (saveMutation.isPending) {
      return "Saving...";
    }

    if (currentAnswerState.saved) {
      return "Saved";
    }

    return "Unsaved";
  }, [currentQuestion, currentAnswerState, saveMutation.isPending]);

  const currentSaveStateIcon = React.useMemo(() => {
    switch (currentSaveStateLabel) {
      case "Saved":
        return "check-circle";
      case "Saving...":
        return "loader";
      case "Unsaved":
        return "clock";
      default:
        return "minus-circle";
    }
  }, [currentSaveStateLabel]);

  const saveAllDraftAnswers = React.useCallback(
    async (answersSnapshot?: AnswerState) => {
      if (!attempt) {
        return true;
      }

      const sourceAnswers = answersSnapshot ?? answers;

      const draftAnswers = Object.entries(sourceAnswers)
        .filter(([, value]) => value.answer.trim().length > 0)
        .map(([questionId, value]) => ({
          questionId,
          answer:
            questionTypeById.get(questionId) === "TRUE_FALSE"
              ? normalizeAnswerOption(value.answer)
              : value.answer,
        }));

      if (draftAnswers.length === 0) {
        return true;
      }

      try {
        setSaveNotice("Saving answers...");
        await saveMutation.mutateAsync({
          quizId: attempt.quizId,
          attemptId: attempt.id,
          answers: draftAnswers,
        });
        setAnswers((previous) => {
          const next: AnswerState = { ...previous };
          for (const key of Object.keys(next)) {
            next[key] = {
              ...next[key],
              saved: true,
            };
          }
          return next;
        });
        setSaveNotice("Saved");
        setLastSavedAt(new Date());
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save answers.";
        setSaveNotice(message);
        return false;
      }
    },
    [answers, attempt, questionTypeById, saveMutation],
  );

  React.useEffect(() => {
    if (!open || !hasUnsavedAnswers || saveMutation.isPending) {
      return;
    }

    const timeout = setTimeout(() => {
      void saveAllDraftAnswers();
    }, 800);

    return () => clearTimeout(timeout);
  }, [open, hasUnsavedAnswers, saveMutation.isPending, saveAllDraftAnswers]);

  async function onAttemptExit() {
    if (!hasUnsavedAnswers) {
      onOpenChange(false);
      return;
    }

    const confirmed = await confirm({
      title: "Discard Unsaved Answers?",
      description:
        "You have unsaved answers. Leaving now may lose your latest changes. Do you still want to exit?",
      confirmText: "Exit Quiz",
      cancelText: "Stay",
    });

    if (!confirmed) {
      return;
    }

    onOpenChange(false);
  }

  const goToNextQuestion = React.useCallback(
    async (answersSnapshot?: AnswerState) => {
      const saved = await saveAllDraftAnswers(answersSnapshot);
      if (!saved) {
        return;
      }

      setIsShowingSolution(false);

      if (isLastQuestion) {
        onOpenChange(false);
        return;
      }

      setCurrentQuestionIndex((value) => value + 1);
    },
    [isLastQuestion, onOpenChange, saveAllDraftAnswers],
  );

  async function onNext() {
    await goToNextQuestion();
  }

  function onPrevious() {
    if (isFirstQuestion) {
      return;
    }

    setIsShowingSolution(false);
    setCurrentQuestionIndex((value) => Math.max(0, value - 1));
  }

  function onAnswerChange(nextValue: string) {
    if (!currentQuestion) {
      return;
    }

    const nextAnswers: AnswerState = {
      ...answers,
      [currentQuestion.id]: {
        answer: nextValue,
        saved: false,
      },
    };

    setAnswers(nextAnswers);
    if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(currentQuestion.type)) {
      void goToNextQuestion(nextAnswers);
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        answer: nextValue,
        saved: false,
      },
    }));
  }

  return (
    <AppBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void onAttemptExit();
          return;
        }
        onOpenChange(nextOpen);
      }}
      title={
        quizQuery.data ? `Take Quiz: ${quizQuery.data.title}` : "Take Quiz"
      }
      description={
        totalQuestions > 0
          ? `Question ${Math.min(currentQuestionIndex + 1, totalQuestions)} of ${totalQuestions}`
          : "Loading quiz details"
      }
      snapPoints={["85%", "95%"]}
      enablePanDownToClose={false}
      backdropPressBehavior="none"
    >
      <View className="gap-2 pb-2">
        <View className="bg-muted h-2 w-full rounded-full">
          <View
            className="bg-primary h-2 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground text-xs">Progress</Text>
          <Text className="text-muted-foreground text-xs">
            {progressPercent}%
          </Text>
        </View>
        {saveNotice ? (
          <Text className="text-muted-foreground text-xs">{saveNotice}</Text>
        ) : null}
        {lastSavedAt ? (
          <Text className="text-muted-foreground text-xs">
            Last autosaved at {lastSavedAt.toLocaleTimeString()}
          </Text>
        ) : null}
        {hasUnsavedAnswers ? (
          <Text className="text-amber-600 text-xs">
            Unsaved changes pending auto-save...
          </Text>
        ) : null}
      </View>

      <AppBottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
      >
        {quizQuery.isLoading ? (
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">Loading quiz...</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ActivityIndicator size="small" />
            </CardContent>
          </Card>
        ) : null}

        {quizQuery.isError ? (
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">Failed to load quiz</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Text className="text-destructive text-sm">
                Please close and try again.
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {!quizQuery.isLoading && !quizQuery.isError && totalQuestions === 0 ? (
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">No Questions Found</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Text className="text-muted-foreground text-sm">
                There are no questions available for this quiz yet.
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {currentQuestion ? (
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </CardTitle>
              {currentSaveStateLabel ? (
                <View className="pt-1">
                  <View className="bg-muted self-start flex-row items-center gap-1 rounded-full px-2 py-1">
                    <Feather
                      name={currentSaveStateIcon as any}
                      size={12}
                      color="#737373"
                    />
                    <Text className="text-muted-foreground text-xs">
                      Status: {currentSaveStateLabel}
                    </Text>
                  </View>
                </View>
              ) : null}
            </CardHeader>
            <CardContent className="gap-3 px-4">
              <QuestionOptions
                type={currentQuestion.type}
                options={currentQuestion.options ?? []}
                value={currentAnswer}
                onChange={onAnswerChange}
                autoAdvanceOnSelect={currentQuestion.type === "MULTIPLE_CHOICE"}
              />

              {isShowingSolution ? (
                <View className="bg-muted/60 border-border gap-1 rounded-lg border p-3">
                  <Text className="text-sm font-semibold">
                    Answer: {currentQuestion.answer ?? "N/A"}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Explanation:{" "}
                    {currentQuestion.explanation ?? "No explanation available."}
                  </Text>
                </View>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </AppBottomSheetScrollView>

      <View className="gap-2 pt-2">
        <Button size="sm" variant="outline" onPress={onAttemptExit}>
          <Feather name="x" size={14} color="#a3a3a3" />
          <Text>Exit Quiz</Text>
        </Button>
        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onPress={onPrevious}
            disabled={
              isFirstQuestion || saveMutation.isPending || !currentQuestion
            }
          >
            <Feather name="chevron-left" size={16} color="#a3a3a3" />
            <Text>Previous</Text>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onPress={() => setIsShowingSolution((value) => !value)}
            disabled={!currentQuestion}
          >
            <Feather
              name={isShowingSolution ? "eye-off" : "eye"}
              size={16}
              color="#a3a3a3"
            />
            <Text>{isShowingSolution ? "Hide Answer" : "Show Answer"}</Text>
          </Button>
        </View>

        <Button
          size="sm"
          onPress={onNext}
          disabled={
            !currentAnswer.trim() || saveMutation.isPending || !currentQuestion
          }
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Feather
              name={isLastQuestion ? "check" : "chevron-right"}
              size={16}
              color="#ffffff"
            />
          )}
          <Text>{isLastQuestion ? "Submit" : "Next"}</Text>
        </Button>
      </View>
    </AppBottomSheet>
  );
}
