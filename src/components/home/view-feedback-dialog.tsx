import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

function prettifyMood(value?: string) {
  if (!value) {
    return 'N/A';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ViewFeedbackDialog({
  open,
  onOpenChange,
  checkInId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInId: string | null;
}) {
  const { token } = useAuth();

  const feedbackQuery = useQuery({
    queryKey: ['dashboard', 'checkin-feedback', token, checkInId],
    queryFn: async () => dashboardApi.getCheckInById(token as string, checkInId as string),
    enabled: Boolean(open && token && checkInId),
  });

  const feedback = feedbackQuery.data;
  const aiFeedbacks = feedback?.aiFeedbacks ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="border-border border-b px-4 py-4">
          <View className="flex-row items-center gap-2">
            <Feather name="cpu" size={18} color="#9ca3af" />
            <DialogTitle>AI Mentor Feedback</DialogTitle>
          </View>
          <DialogDescription>Summary and AI feedback from your latest check-in.</DialogDescription>
        </DialogHeader>

        <View className="max-h-140 gap-4 px-4 py-4">
          {feedbackQuery.isLoading ? (
            <Text className="text-muted-foreground py-6 text-center">Loading feedback...</Text>
          ) : null}

          {!feedbackQuery.isLoading && feedbackQuery.isError ? (
            <Text className="text-destructive text-sm">
              {feedbackQuery.error instanceof Error
                ? feedbackQuery.error.message
                : 'Unable to load feedback right now.'}
            </Text>
          ) : null}

          {!feedbackQuery.isLoading && !feedbackQuery.isError && feedback ? (
            <View className="gap-4">
              <Card className="gap-2 py-3">
                <CardHeader className="px-3">
                  <CardTitle className="text-base">Check-in Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-3">
                  <View className="flex-row gap-2">
                    <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                      <Text className="text-muted-foreground text-xs">Study Hours</Text>
                      <Text className="text-lg font-semibold">{feedback.studyHours}</Text>
                    </View>
                    <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                      <Text className="text-muted-foreground text-xs">Tasks</Text>
                      <Text className="text-lg font-semibold">{feedback.completedTasks}</Text>
                    </View>
                    <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                      <Text className="text-muted-foreground text-xs">Mood</Text>
                      <Text className="text-lg font-semibold">{prettifyMood(feedback.mood)}</Text>
                    </View>
                  </View>

                  {feedback.todayGoals ? (
                    <View className="bg-muted/20 border-border mt-3 rounded-lg border p-3">
                      <Text className="text-muted-foreground text-xs">Goals Achieved</Text>
                      <Text className="mt-1 text-sm">{feedback.todayGoals}</Text>
                    </View>
                  ) : null}
                </CardContent>
              </Card>

              {aiFeedbacks.length > 0 ? (
                <View className="gap-3">
                  {aiFeedbacks.map((item, index) => (
                    <Card key={`${index}-${item.feedbackContent.slice(0, 12)}`} className="gap-2 py-3">
                      <CardHeader className="px-3">
                        <CardTitle className="text-base">Feedback #{index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="gap-3 px-3">
                        <View>
                          <Text className="text-muted-foreground text-xs">Summary</Text>
                          <Text className="mt-1 text-sm">{item.feedbackContent}</Text>
                        </View>

                        {item.keyInsights?.length ? (
                          <View>
                            <Text className="text-muted-foreground text-xs">Key Insights</Text>
                            {item.keyInsights.map((insight, insightIndex) => (
                              <Text key={`${index}-insight-${insightIndex}`} className="mt-1 text-sm">
                                - {insight}
                              </Text>
                            ))}
                          </View>
                        ) : null}

                        {item.recommendations?.length ? (
                          <View>
                            <Text className="text-muted-foreground text-xs">Recommendations</Text>
                            {item.recommendations.map((recommendation, recIndex) => (
                              <Text key={`${index}-rec-${recIndex}`} className="mt-1 text-sm">
                                - {recommendation}
                              </Text>
                            ))}
                          </View>
                        ) : null}

                        {item.encouragement ? (
                          <View className="bg-primary/10 rounded-lg p-3">
                            <Text className="text-sm">{item.encouragement}</Text>
                          </View>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </View>
              ) : (
                <Card className="py-3">
                  <CardContent className="px-3">
                    <Text className="text-muted-foreground text-sm">
                      No AI feedback is available for this check-in yet.
                    </Text>
                  </CardContent>
                </Card>
              )}
            </View>
          ) : null}
        </View>
      </DialogContent>
    </Dialog>
  );
}
