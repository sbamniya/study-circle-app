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
}: {
  onCheckIn?: () => void;
}) {
  const { token } = useAuth();
  const todayCheckInQuery = useQuery({
    queryKey: ['dashboard', 'today-checkin', token],
    queryFn: async () => dashboardApi.getTodayCheckIn(token as string),
    enabled: Boolean(token),
  });
  const hasCheckedIn = Boolean(todayCheckInQuery.data);

  const handleCheckIn =
    onCheckIn ?? (() => Alert.alert('Check-in', 'Check-in flow will be available in the mobile app soon.'));

  return (
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
        <Button size="sm" variant="outline" className="self-start" onPress={handleCheckIn}>
          <Feather name="plus" size={16} color="#a3a3a3" />
          <Text>Check-in</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
