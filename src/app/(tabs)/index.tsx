import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  dashboardApi,
  type DashboardCheckInChartPoint,
  type DashboardRecentActivityItem,
  type DashboardStreak,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DashboardState = {
  studyMaterialsCount: number;
  examMaterialsCount: number;
  quizzesCount: number;
  studyCirclesCount: number;
  todayCheckIn: { id: string } | null;
  chartData: DashboardCheckInChartPoint[];
  streak: DashboardStreak | null;
  recentActivity: DashboardRecentActivityItem[];
};

const INITIAL_DASHBOARD_STATE: DashboardState = {
  studyMaterialsCount: 0,
  examMaterialsCount: 0,
  quizzesCount: 0,
  studyCirclesCount: 0,
  todayCheckIn: null,
  chartData: [],
  streak: null,
  recentActivity: [],
};

function getDateRange(days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getCurrentStreak(streak: DashboardStreak | null) {
  if (!streak || !streak.lastCheckinDate) {
    return 0;
  }

  const today = new Date();
  const lastCheckIn = new Date(streak.lastCheckinDate);
  const dayDifference = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())) /
      86400000
  );

  return dayDifference > 1 ? 0 : streak.currentStreak;
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = React.useState<DashboardState>(INITIAL_DASHBOARD_STATE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setError(null);

    try {
      const { startDate, endDate } = getDateRange(7);
      const [
        studyMaterialsCount,
        examMaterialsCount,
        quizzesCount,
        studyCirclesCount,
        todayCheckIn,
        chartData,
        streak,
        recentActivity,
      ] = await Promise.all([
        dashboardApi.getStudyMaterialsCount(token),
        dashboardApi.getExamMaterialsCount(token),
        dashboardApi.getQuizzesCount(token),
        dashboardApi.getStudyCirclesCount(token),
        dashboardApi.getTodayCheckIn(token),
        dashboardApi.getChartData(token, { startDate, endDate }),
        dashboardApi.getStreak(token),
        dashboardApi.getRecentActivity(token),
      ]);

      setDashboard({
        studyMaterialsCount,
        examMaterialsCount,
        quizzesCount,
        studyCirclesCount,
        todayCheckIn,
        chartData,
        streak,
        recentActivity,
      });
    } catch {
      setError('Unable to load dashboard right now. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    void loadDashboard();
  }, [loadDashboard]);

  const hasCheckedIn = Boolean(dashboard.todayCheckIn);
  const chartData = dashboard.chartData;
  const totalTasks = chartData.reduce((sum, item) => sum + item.tasksCompleted, 0);
  const totalHours = chartData.reduce((sum, item) => sum + item.hoursStudied, 0);
  const daysWithCheckins = chartData.filter((item) => item.hasCheckin).length;
  const totalDays = chartData.length;
  const checkInRate = totalDays > 0 ? Math.round((daysWithCheckins / totalDays) * 100) : 0;
  const avgTasks = daysWithCheckins > 0 ? Number((totalTasks / daysWithCheckins).toFixed(1)) : 0;
  const currentStreak = getCurrentStreak(dashboard.streak);
  const bestStreak = dashboard.streak?.bestStreak ?? 0;
  const progressToBest = bestStreak > 0 ? Math.min((currentStreak / bestStreak) * 100, 100) : 0;

  const statCards = [
    {
      id: 'study-materials',
      title: 'Uploaded Study Materials',
      value: dashboard.studyMaterialsCount,
      hint: 'Study materials uploaded by you',
    },
    {
      id: 'exam-materials',
      title: 'Uploaded Exam Materials',
      value: dashboard.examMaterialsCount,
      hint: 'Exam materials uploaded by you',
    },
    {
      id: 'quizzes',
      title: 'Available Quizzes',
      value: dashboard.quizzesCount,
      hint: 'Quizzes created by StudyCircleAI for you',
    },
    {
      id: 'study-circles',
      title: 'Study Circles Joined',
      value: dashboard.studyCirclesCount,
      hint: 'Circles you are a member of',
    },
  ];

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <View className="mx-auto w-full max-w-md gap-4 pb-8">
          <Text className="text-4xl font-semibold leading-10">
            Welcome to StudyCircleAI, <Text className="font-bold">{user?.name ?? 'there'}</Text>!
          </Text>

          <Card className="gap-4 py-4">
            <CardHeader className="px-4">
              <View className="flex-row items-center gap-2">
                <Feather name="calendar" size={16} color="#9ca3af" />
                <CardTitle className="text-base">
                  {hasCheckedIn ? 'Daily Check-in Complete!' : 'Daily Check-in Pending'}
                </CardTitle>
              </View>
              <CardDescription>
                {hasCheckedIn
                  ? 'Great job completing your daily check-in for today.'
                  : "You haven't completed your daily check-in yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <Button
                size="sm"
                variant="outline"
                className="self-start"
                onPress={() =>
                  Alert.alert('Check-in', 'Check-in flow will be available in the mobile app soon.')
                }>
                <Feather name="plus" size={16} color="#a3a3a3" />
                <Text>Check-in</Text>
              </Button>
            </CardContent>
          </Card>

          {statCards.map((card) => (
            <Card key={card.id} className="gap-4 py-4">
              <CardHeader className="px-4">
                <View className="flex-row items-center justify-between">
                  <CardDescription className="text-base">{card.title}</CardDescription>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm font-semibold">View</Text>
                    <Feather name="external-link" size={14} color="#a3a3a3" />
                  </View>
                </View>
                <CardTitle className="text-5xl leading-none">{isLoading ? '-' : card.value}</CardTitle>
                <Text className="text-base font-semibold">{card.hint}</Text>
              </CardHeader>
            </Card>
          ))}

          <Card className="gap-4 py-4">
            <CardHeader className="px-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Feather name="check-square" size={16} color="#a3a3a3" />
                    <CardTitle className="text-2xl">Tasks vs Study Hours</CardTitle>
                  </View>
                  <CardDescription>
                    Daily task completion (columns) and study hours (area) from check-ins
                  </CardDescription>
                </View>
              </View>
              <Button size="sm" variant="outline" className="self-start">
                <Text>Last 7 days</Text>
                <Feather name="chevron-down" size={14} color="#a3a3a3" />
              </Button>
            </CardHeader>

            <CardContent className="px-4">
              {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

              {!error && daysWithCheckins === 0 ? (
                <View className="items-center py-8">
                  <View className="bg-muted mb-5 h-20 w-20 items-center justify-center rounded-full">
                    <Feather name="check-square" size={34} color="#9ca3af" />
                  </View>
                  <Text className="text-center text-3xl font-bold">No Study Data Available</Text>
                  <Text className="text-muted-foreground mt-3 text-center text-base">
                    Start completing your daily check-ins to track your study progress and task completion
                    over time. Your data will appear here once you begin submitting daily reports.
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-5"
                    onPress={() =>
                      Alert.alert('Check-in', 'Check-in flow will be available in the mobile app soon.')
                    }>
                    <Feather name="plus" size={16} color="#a3a3a3" />
                    <Text>Check-in</Text>
                  </Button>

                  <View className="mt-5 w-full flex-row flex-wrap gap-2">
                    <View className="border-border flex-1 rounded-lg border p-3">
                      <Text className="text-center text-4xl font-bold">0</Text>
                      <Text className="text-muted-foreground text-center text-xs">Total Tasks</Text>
                    </View>
                    <View className="border-border flex-1 rounded-lg border p-3">
                      <Text className="text-center text-4xl font-bold">0h</Text>
                      <Text className="text-muted-foreground text-center text-xs">Total Hours</Text>
                    </View>
                    <View className="border-border flex-1 rounded-lg border p-3">
                      <Text className="text-center text-4xl font-bold">0</Text>
                      <Text className="text-muted-foreground text-center text-xs">Avg Tasks</Text>
                    </View>
                    <View className="border-border flex-1 rounded-lg border p-3">
                      <Text className="text-center text-4xl font-bold">0%</Text>
                      <Text className="text-muted-foreground text-center text-xs">Check-ins</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="gap-3">
                  <View className="flex-row flex-wrap gap-2">
                    <View className="bg-muted flex-1 rounded-lg p-3">
                      <Text className="text-center text-3xl font-bold">{totalTasks}</Text>
                      <Text className="text-muted-foreground text-center text-xs">Total Tasks</Text>
                    </View>
                    <View className="bg-muted flex-1 rounded-lg p-3">
                      <Text className="text-center text-3xl font-bold">{totalHours.toFixed(1)}h</Text>
                      <Text className="text-muted-foreground text-center text-xs">Total Hours</Text>
                    </View>
                    <View className="bg-muted flex-1 rounded-lg p-3">
                      <Text className="text-center text-3xl font-bold">{avgTasks}</Text>
                      <Text className="text-muted-foreground text-center text-xs">Avg Tasks</Text>
                    </View>
                    <View className="bg-muted flex-1 rounded-lg p-3">
                      <Text className="text-center text-3xl font-bold">{checkInRate}%</Text>
                      <Text className="text-muted-foreground text-center text-xs">Check-ins</Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-center text-sm">
                    Chart rendering for this section will be added in a follow-up mobile iteration.
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 py-4">
            <CardHeader className="px-4">
              <View className="flex-row items-center gap-2">
                <Feather name="activity" size={16} color="#f97316" />
                <CardTitle className="text-2xl">Study Streak</CardTitle>
              </View>
            </CardHeader>

            <CardContent className="gap-3 px-4">
              <View className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                <Text className="text-muted-foreground text-sm">Current Streak</Text>
                <Text className="text-4xl font-bold text-orange-600">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </Text>
              </View>

              <View className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
                <Text className="text-muted-foreground text-sm">Best Streak</Text>
                <Text className="text-4xl font-bold text-yellow-600">
                  {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                </Text>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">Progress to beat best</Text>
                  <Text className="font-semibold">
                    {currentStreak}/{bestStreak}
                  </Text>
                </View>
                <View className="bg-muted h-2 rounded-full">
                  <View
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${progressToBest}%` }}
                  />
                </View>
              </View>

              <View className="mt-2 gap-2">
                <View className="flex-row items-center gap-2">
                  <Feather name="calendar" size={14} color="#a3a3a3" />
                  <Text className="text-muted-foreground text-base">Recent Activity</Text>
                </View>

                {dashboard.recentActivity.length === 0 ? (
                  <Text className="text-muted-foreground py-4 text-center">No recent activity found</Text>
                ) : (
                  dashboard.recentActivity.slice(0, 5).map((activity) => (
                    <View
                      key={activity.id}
                      className="bg-muted/60 flex-row items-center justify-between rounded-md p-2">
                      <Text className="text-sm">{formatShortDate(activity.date)}</Text>
                      <Text className="text-muted-foreground text-xs capitalize">
                        {activity.mood?.toLowerCase() ?? 'checked in'}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              <Text className="text-muted-foreground pt-2 text-center text-base">
                {currentStreak === 0
                  ? 'Your streak has ended. Get back on track and start a new streak today!'
                  : `Only ${Math.max(bestStreak - currentStreak, 0)} ${
                      bestStreak - currentStreak === 1 ? 'more day' : 'more days'
                    } to beat your best streak.`}
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
