import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type Option as SelectOption,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { dashboardApi, type DashboardCheckInChartPoint } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Alert, View } from 'react-native';

function getDateRange(days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

export function TasksChartWidget({
  onCheckIn,
}: {
  onCheckIn?: () => void;
}) {
  const { token } = useAuth();
  const rangeOptions = React.useMemo(
    () => [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 3 months' },
    ],
    []
  );
  const [selectedRange, setSelectedRange] = React.useState<SelectOption>(rangeOptions[0]);

  const selectedDays = React.useMemo(() => {
    switch (selectedRange?.value) {
      case '90d':
        return 90;
      case '30d':
        return 30;
      case '7d':
      default:
        return 7;
    }
  }, [selectedRange]);

  const { startDate, endDate } = React.useMemo(() => getDateRange(selectedDays), [selectedDays]);
  const chartDataQuery = useQuery({
    queryKey: ['dashboard', 'chart-data', token, startDate, endDate],
    queryFn: async () => dashboardApi.getChartData(token as string, { startDate, endDate }),
    enabled: Boolean(token),
  });

  const error = chartDataQuery.isError
    ? chartDataQuery.error instanceof Error
      ? chartDataQuery.error.message
      : 'Unable to load dashboard right now. Pull down to retry.'
    : null;

  const chartData: DashboardCheckInChartPoint[] = chartDataQuery.data ?? [];
  const totalTasks = chartData.reduce((sum, item) => sum + item.tasksCompleted, 0);
  const totalHours = chartData.reduce((sum, item) => sum + item.hoursStudied, 0);
  const daysWithCheckins = chartData.filter((item) => item.hasCheckin).length;
  const totalDays = chartData.length;
  const checkInRate = totalDays > 0 ? Math.round((daysWithCheckins / totalDays) * 100) : 0;
  const avgTasks = daysWithCheckins > 0 ? Number((totalTasks / daysWithCheckins).toFixed(1)) : 0;

  const handleCheckIn =
    onCheckIn ?? (() => Alert.alert('Check-in', 'Check-in flow will be available in the mobile app soon.'));

  return (
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
        <Select value={selectedRange} onValueChange={(option) => setSelectedRange(option ?? rangeOptions[0])}>
          <SelectTrigger className="w-40 self-start">
            <SelectValue placeholder="Last 7 days" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {rangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} label={option.label} />
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
              Start completing your daily check-ins to track your study progress and task completion over
              time. Your data will appear here once you begin submitting daily reports.
            </Text>
            <Button size="sm" variant="outline" className="mt-5" onPress={handleCheckIn}>
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
  );
}
