import { DailyCheckinDialog } from '@/components/home/daily-checkin-dialog';
import { DailyCheckinWidget } from '@/components/home/daily-checkin-widget';
import { HomeGreeting } from '@/components/home/home-greeting';
import { StatsCardsWidget } from '@/components/home/stats-cards-widget';
import { StudyStreakWidget } from '@/components/home/study-streak-widget';
import { TasksChartWidget } from '@/components/home/tasks-chart-widget';
import { ViewFeedbackDialog } from '@/components/home/view-feedback-dialog';
import { useAuth } from '@/lib/auth';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = React.useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = React.useState(false);
  const [selectedFeedbackCheckInId, setSelectedFeedbackCheckInId] = React.useState<string | null>(null);
  const activeDashboardRequests = useIsFetching({ queryKey: ['dashboard'] });
  const isRefreshing = activeDashboardRequests > 0;

  function onRefresh() {
    void queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' });
  }

  function openDailyCheckIn() {
    setIsCheckInDialogOpen(true);
  }

  function openFeedback(checkInId: string) {
    setSelectedFeedbackCheckInId(checkInId);
    setIsFeedbackDialogOpen(true);
  }

  function onFeedbackOpenChange(open: boolean) {
    setIsFeedbackDialogOpen(open);
    if (!open) {
      setSelectedFeedbackCheckInId(null);
    }
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <View className="mx-auto w-full max-w-md gap-4 pb-8">
          <HomeGreeting name={user?.name} />

          <DailyCheckinWidget onCheckIn={openDailyCheckIn} onViewFeedback={openFeedback} />

          <StatsCardsWidget />

          <TasksChartWidget onCheckIn={openDailyCheckIn} />

          <StudyStreakWidget />
        </View>
      </ScrollView>

      <DailyCheckinDialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen} />
      <ViewFeedbackDialog
        open={isFeedbackDialogOpen}
        onOpenChange={onFeedbackOpenChange}
        checkInId={selectedFeedbackCheckInId}
      />
    </SafeAreaView>
  );
}
