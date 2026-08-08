import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, View } from 'react-native';

export function DailyCheckinWidget({
  onCheckIn,
  onViewFeedback,
}: {
  onCheckIn?: () => void;
  onViewFeedback?: (checkInId: string) => void;
}) {
  const { token, user } = useAuth();
  const todayCheckInQuery = useQuery({
    queryKey: ['dashboard', 'today-checkin', token],
    queryFn: async () => dashboardApi.getTodayCheckIn(token as string),
    enabled: Boolean(token),
  });
  const todayCheckIn = todayCheckInQuery.data;
  const hasCheckedIn = Boolean(todayCheckIn);
  const isPaidUser = Boolean(user?.subscriptionTier && user.subscriptionTier !== 'FREE');
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleCheckIn =
    onCheckIn ?? (() => Alert.alert('Check-in', 'Check-in flow will be available in the mobile app soon.'));
  const handleViewFeedback = () => {
    if (!todayCheckIn?.id) {
      return;
    }

    if (onViewFeedback) {
      onViewFeedback(todayCheckIn.id);
      return;
    }

    Alert.alert('AI Feedback', 'AI feedback view will be available in the mobile app soon.');
  };

  if (todayCheckInQuery.isLoading) {
    return (
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <View className="flex-row items-center gap-2">
            <Feather name="calendar" size={16} color="#9ca3af" />
            <CardTitle className="text-base">Loading...</CardTitle>
          </View>
          <CardDescription>Checking your daily status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (hasCheckedIn) {
    return (
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <View className="flex-row items-center gap-2">
            <Feather name="check-circle" size={16} color="#22c55e" />
            <CardTitle className="text-base">Daily Check-in Complete!</CardTitle>
          </View>
          <CardDescription>Great job completing your daily check-in for {todayLabel}.</CardDescription>
        </CardHeader>

        {isPaidUser ? (
          <CardContent className="px-4">
            <Button size="sm" className="self-start" onPress={handleViewFeedback}>
              <Feather name="cpu" size={16} color="#ffffff" />
              <Text>View AI Feedback</Text>
            </Button>
          </CardContent>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <View className="flex-row items-center gap-2">
          <Feather name="calendar" size={16} color="#9ca3af" />
          <CardTitle className="text-base">Daily Check-in Pending</CardTitle>
        </View>
        <CardDescription>You haven't completed your daily check-in yet</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <Button
          size="sm"
          variant="outline"
          className="self-start dark:border-white dark:bg-white dark:active:bg-white/90"
          onPress={handleCheckIn}>
          <Feather name="plus" size={16} color="#a3a3a3" />
          <Text className="dark:text-black">Check-in</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
