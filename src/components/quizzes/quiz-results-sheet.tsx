import { AppBottomSheet, AppBottomSheetScrollView } from '@/components/ui/app-bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  quizzesApi,
  type QuizAnswerCorrectness,
  type QuizAnswerGrading,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

const MAX_QUIZ_ATTEMPTS = 10;

const CORRECTNESS_LABELS: Record<QuizAnswerCorrectness, string> = {
  CORRECT: 'Correct',
  INCORRECT: 'Incorrect',
  PARTIALLY_CORRECT: 'Partially Correct',
  NONE: 'Not Answered',
};

const GRADER_LABELS: Record<QuizAnswerGrading, string> = {
  EMBEDDING: 'Embedding',
  GPT: 'GPT',
  NONE: 'None',
  MATCH: 'Match',
};

function correctnessChipClass(correctness: QuizAnswerCorrectness) {
  switch (correctness) {
    case 'CORRECT':
      return 'bg-emerald-100 text-emerald-700';
    case 'PARTIALLY_CORRECT':
      return 'bg-amber-100 text-amber-700';
    case 'INCORRECT':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function graderChipClass(grader: QuizAnswerGrading) {
  switch (grader) {
    case 'GPT':
      return 'bg-blue-100 text-blue-700';
    case 'EMBEDDING':
      return 'bg-violet-100 text-violet-700';
    case 'MATCH':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function QuizResultsSheet({
  open,
  onOpenChange,
  quizId,
  totalQuestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string | null;
  totalQuestions: number;
}) {
  const { token } = useAuth();
  const [selectedAttemptId, setSelectedAttemptId] = React.useState('');
  const [showAnswerById, setShowAnswerById] = React.useState<Record<string, boolean>>({});

  const attemptsQuery = useQuery({
    queryKey: ['quiz-attempts', token, quizId],
    queryFn: async () =>
      quizzesApi.getAttempts(token as string, quizId as string, {
        page: 1,
        limit: MAX_QUIZ_ATTEMPTS,
      }),
    enabled: open && Boolean(token) && Boolean(quizId),
  });

  React.useEffect(() => {
    if (!open) {
      setSelectedAttemptId('');
      setShowAnswerById({});
      return;
    }

    const firstAttempt = attemptsQuery.data?.data?.[0];
    if (firstAttempt && !selectedAttemptId) {
      setSelectedAttemptId(firstAttempt.id);
    }
  }, [open, attemptsQuery.data?.data, selectedAttemptId]);

  const resultsLimit = Math.max(totalQuestions, 1);

  const resultsQuery = useQuery({
    queryKey: ['quiz-attempt-results', token, quizId, selectedAttemptId, resultsLimit],
    queryFn: async () =>
      quizzesApi.getAttemptResults(token as string, quizId as string, selectedAttemptId, {
        page: 1,
        limit: resultsLimit,
      }),
    enabled: open && Boolean(token) && Boolean(quizId) && Boolean(selectedAttemptId),
  });

  const results = resultsQuery.data?.data ?? [];

  const correctnessStats = React.useMemo(() => {
    const initial = {
      CORRECT: 0,
      INCORRECT: 0,
      PARTIALLY_CORRECT: 0,
      NONE: 0,
    } as Record<QuizAnswerCorrectness, number>;

    for (const result of results) {
      initial[result.correctness] += 1;
    }

    return initial;
  }, [results]);

  const graderStats = React.useMemo(() => {
    const initial = {
      EMBEDDING: 0,
      GPT: 0,
      NONE: 0,
      MATCH: 0,
    } as Record<QuizAnswerGrading, number>;

    for (const result of results) {
      initial[result.gradingMethod] += 1;
    }

    return initial;
  }, [results]);

  function toggleAnswer(id: string) {
    setShowAnswerById((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  return (
    <AppBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Practice Set Results"
      description="Review attempts and see answer-level grading details."
      snapPoints={['85%', '95%']}
    >
      <AppBottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
        <View className="gap-2">
          <Text className="text-muted-foreground text-xs">Attempts</Text>
          <View className="flex-row flex-wrap gap-2">
            {attemptsQuery.isLoading ? <ActivityIndicator size="small" /> : null}
            {!attemptsQuery.isLoading && attemptsQuery.data?.data.length === 0 ? (
              <Text className="text-muted-foreground text-sm">No attempts yet.</Text>
            ) : null}
            {(attemptsQuery.data?.data ?? []).map((attempt, index) => {
              const label = `Attempt ${(attemptsQuery.data?.data.length ?? 0) - index}`;
              const isSelected = attempt.id === selectedAttemptId;
              return (
                <Button
                  key={attempt.id}
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onPress={() => setSelectedAttemptId(attempt.id)}
                >
                  <Feather
                    name={attempt.completedAt ? 'check' : 'clock'}
                    size={14}
                    color={isSelected ? '#ffffff' : '#a3a3a3'}
                  />
                  <Text>{label}</Text>
                </Button>
              );
            })}
          </View>
        </View>

        {resultsQuery.isLoading ? (
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">Loading results...</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ActivityIndicator size="small" />
            </CardContent>
          </Card>
        ) : null}

        {resultsQuery.isError ? (
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">Failed to load results</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Text className="text-destructive text-sm">Please try a different attempt.</Text>
            </CardContent>
          </Card>
        ) : null}

        {!resultsQuery.isLoading && !resultsQuery.isError && results.length > 0 ? (
          <>
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-base">Quick Stats</CardTitle>
                <CardDescription>Answer correctness and grading distribution.</CardDescription>
              </CardHeader>
              <CardContent className="gap-2 px-4">
                <View className="flex-row flex-wrap gap-1">
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">Correct: {correctnessStats.CORRECT}</Text>
                  </View>
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">Partial: {correctnessStats.PARTIALLY_CORRECT}</Text>
                  </View>
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">Incorrect: {correctnessStats.INCORRECT}</Text>
                  </View>
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">Unanswered: {correctnessStats.NONE}</Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">GPT: {graderStats.GPT}</Text>
                  </View>
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">Embedding: {graderStats.EMBEDDING}</Text>
                  </View>
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">Match: {graderStats.MATCH}</Text>
                  </View>
                  <View className="bg-muted rounded-full px-2 py-1">
                    <Text className="text-xs">None: {graderStats.NONE}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {results.map((result, index) => (
              <Card key={result.id} className="gap-3 py-4">
                <CardHeader className="gap-2 px-4">
                  <CardTitle className="text-base">
                    {index + 1}. {result.question.question}
                  </CardTitle>
                  <CardDescription>
                    Your answer: {result.userAnswer?.trim() || 'Not answered'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="gap-2 px-4">
                  <View className="flex-row flex-wrap gap-1">
                    <View className={`rounded-full px-2 py-1 ${correctnessChipClass(result.correctness)}`}>
                      <Text className="text-xs">{CORRECTNESS_LABELS[result.correctness]}</Text>
                    </View>
                    <View className={`rounded-full px-2 py-1 ${graderChipClass(result.gradingMethod)}`}>
                      <Text className="text-xs">{GRADER_LABELS[result.gradingMethod]}</Text>
                    </View>
                  </View>
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    onPress={() => toggleAnswer(result.id)}
                  >
                    <Feather
                      name={showAnswerById[result.id] ? 'eye-off' : 'eye'}
                      size={14}
                      color="#a3a3a3"
                    />
                    <Text>{showAnswerById[result.id] ? 'Hide' : 'Show'} Answer</Text>
                  </Button>

                  {showAnswerById[result.id] ? (
                    <View className="bg-muted/60 border-border gap-1 rounded-lg border p-3">
                      <Text className="text-sm font-semibold">
                        Answer: {result.question.answer ?? 'N/A'}
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        Explanation: {result.question.explanation ?? 'No explanation available.'}
                      </Text>
                    </View>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </>
        ) : null}
      </AppBottomSheetScrollView>
    </AppBottomSheet>
  );
}
