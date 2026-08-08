import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
    dashboardApi,
    type DashboardRecentActivityItem,
    type DashboardStreak,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { View } from 'react-native';

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

export function StudyStreakWidget({
}: Record<string, never>) {
  const { token } = useAuth();
  const [streakQuery, recentActivityQuery] = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'streak', token],
        queryFn: async () => dashboardApi.getStreak(token as string),
        enabled: Boolean(token),
      },
      {
        queryKey: ['dashboard', 'recent-activity', token],
        queryFn: async () => dashboardApi.getRecentActivity(token as string),
        enabled: Boolean(token),
      },
    ],
  });

  const isLoading = streakQuery.isLoading || recentActivityQuery.isLoading;
  const streak: DashboardStreak | null = streakQuery.data ?? null;
  const currentStreak = getCurrentStreak(streak);
  const bestStreak = streak?.bestStreak ?? 0;
  const recentActivity: DashboardRecentActivityItem[] = recentActivityQuery.data ?? [];
  const hasNoStreak = currentStreak === 0 && bestStreak === 0;
  const progressToBest = bestStreak > 0 ? Math.min((currentStreak / bestStreak) * 100, 100) : 0;

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4 pb-2">
        <View className="flex-row items-center gap-2">
          <Feather name="activity" size={16} color="#f97316" />
          <CardTitle className="text-2xl">Study Streak</CardTitle>
        </View>
      </CardHeader>

      <CardContent className="gap-3 px-4">
        {isLoading ? (
          <View className="py-8">
            <Text className="text-muted-foreground text-center text-sm">Loading your streak data...</Text>
          </View>
        ) : hasNoStreak ? (
          <View className="gap-3 py-2">
            <View className="rounded-lg border border-orange-100 bg-orange-50 p-4">
              <Text className="text-muted-foreground text-sm">Current Streak</Text>
              <Text className="text-4xl font-bold text-orange-600">0 days</Text>
            </View>
            <View className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
              <Text className="text-muted-foreground text-sm">Best Streak</Text>
              <Text className="text-4xl font-bold text-yellow-600">0 days</Text>
            </View>
            <Text className="text-muted-foreground pt-1 text-center text-base">
              No streak yet. Begin your study streak now!
            </Text>
          </View>
        ) : (
          <>
            <View className="rounded-lg border border-orange-100 bg-orange-50 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Feather name="activity" size={24} color="#ea580c" />
                </View>
                <View>
                  <Text className="text-muted-foreground text-sm">Current Streak</Text>
                  <Text className="text-2xl font-bold text-orange-600">
                    {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <Feather name="award" size={24} color="#ca8a04" />
                </View>
                <View>
                  <Text className="text-muted-foreground text-sm">Best Streak</Text>
                  <Text className="text-2xl font-bold text-yellow-600">
                    {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
            </View>

            {bestStreak > 0 ? (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground text-sm">Progress to beat best</Text>
                  <Text className="font-semibold">
                    {currentStreak}/{bestStreak}
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-gray-200">
                  <View
                    className={cn(
                      'h-2 rounded-full',
                      currentStreak >= bestStreak
                        ? 'bg-linear-to-r from-green-400 to-green-600'
                        : 'bg-linear-to-r from-orange-400 to-red-500'
                    )}
                    style={{ width: `${progressToBest}%` }}
                  />
                </View>
              </View>
            ) : null}

            <View className="mt-2 gap-2">
              <View className="flex-row items-center gap-2">
                <Feather name="calendar" size={14} color="#a3a3a3" />
                <Text className="text-muted-foreground text-base">Recent Activity</Text>
              </View>

              {recentActivity.length === 0 ? (
                <Text className="text-muted-foreground py-4 text-center">No recent activity found</Text>
              ) : (
                recentActivity.slice(0, 5).map((activity) => (
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

            <View className="p-2">
              {currentStreak >= bestStreak && bestStreak > 0 ? (
                <Text className="text-center text-sm font-medium text-green-600">
                  Great work. You have matched or beaten your best streak.
                </Text>
              ) : currentStreak === 0 ? (
                <Text className="text-muted-foreground text-center text-sm">
                  Your streak has ended. Get back on track and start a new streak today!
                </Text>
              ) : (
                <Text className="text-muted-foreground text-center text-sm">
                  Only {bestStreak - currentStreak} more day{bestStreak - currentStreak === 1 ? '' : 's'} to
                  beat your best streak.
                </Text>
              )}
            </View>
          </>
        )}
      </CardContent>
    </Card>
  );
}
