import { DailyCheckinWidget } from '@/components/home/daily-checkin-widget';
import { HomeGreeting } from '@/components/home/home-greeting';
import { StatsCardsWidget } from '@/components/home/stats-cards-widget';
import { StudyStreakWidget } from '@/components/home/study-streak-widget';
import { TasksChartWidget } from '@/components/home/tasks-chart-widget';
import { useAuth } from '@/lib/auth';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const activeDashboardRequests = useIsFetching({ queryKey: ['dashboard'] });
  const isRefreshing = activeDashboardRequests > 0;

  function onRefresh() {
    void queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' });
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <View className="mx-auto w-full max-w-md gap-4 pb-8">
          <HomeGreeting name={user?.name} />

          <DailyCheckinWidget />

          <StatsCardsWidget />

          <TasksChartWidget />

          <StudyStreakWidget />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
