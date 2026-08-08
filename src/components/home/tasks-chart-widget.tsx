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
import { BarChart } from 'react-native-gifted-charts';

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
  const isLoading = chartDataQuery.isLoading;
  const totalTasks = chartData.reduce((sum, item) => sum + item.tasksCompleted, 0);
  const totalHours = chartData.reduce((sum, item) => sum + item.hoursStudied, 0);
  const daysWithCheckins = chartData.filter((item) => item.hasCheckin).length;
  const totalDays = chartData.length;
  const checkInRate = totalDays > 0 ? Math.round((daysWithCheckins / totalDays) * 100) : 0;
  const avgTasks = daysWithCheckins > 0 ? Number((totalTasks / daysWithCheckins).toFixed(1)) : 0;
  const avgHours = daysWithCheckins > 0 ? Number((totalHours / daysWithCheckins).toFixed(1)) : 0;

  const visibleChartData = chartData.slice(-10);
  const maxTasks = Math.max(...visibleChartData.map((item) => item.tasksCompleted), 1);
  const maxHours = Math.max(...visibleChartData.map((item) => item.hoursStudied), 1);
  const barData = visibleChartData.map((item, index) => {
    const labelDate = new Date(item.date);
    const shortLabel = labelDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      value: item.tasksCompleted,
      frontColor: '#f97316',
      label: visibleChartData.length > 7 && index % 2 === 1 ? '' : shortLabel,
    };
  });
  const lineData = visibleChartData.map((item) => ({ value: item.hoursStudied }));

  const handleCheckIn =
    onCheckIn ?? (() => Alert.alert('Check-in', 'Check-in flow will be available in the mobile app soon.'));

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="gap-2 px-4">
        <View className="w-full gap-2">
          <CardTitle className="flex-row items-center gap-2 text-xl">
            <Feather name="check-square" size={18} color="#a3a3a3" />
            <Text className="text-xl font-semibold">Tasks vs Study Hours</Text>
          </CardTitle>
          <CardDescription className="text-sm">
            Daily task completion (columns) and study hours (area) from check-ins
          </CardDescription>
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
        {isLoading ? <Text className="text-muted-foreground py-12 text-center">Loading chart data...</Text> : null}
        {!isLoading && error ? <Text className="text-destructive text-sm">{error}</Text> : null}

        {!isLoading && !error && daysWithCheckins === 0 ? (
          <View className="items-center py-8">
            <View className="bg-muted mb-5 h-20 w-20 items-center justify-center rounded-full">
              <Feather name="check-square" size={34} color="#9ca3af" />
            </View>
            <Text className="text-center text-3xl font-bold">No Study Data Available</Text>
            <Text className="text-muted-foreground mt-3 text-center text-base">
              Start completing your daily check-ins to track your study progress and task completion over
              time. Your data will appear here once you begin submitting daily reports.
            </Text>
            <Button
              size="sm"
              variant="outline"
              className="mt-5 dark:border-white dark:bg-white dark:active:bg-white/90"
              onPress={handleCheckIn}>
              <Feather name="plus" size={16} color="#a3a3a3" />
              <Text className="dark:text-black">Check-in</Text>
            </Button>

            <View className="mt-5 w-full flex-row flex-wrap gap-2">
              <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                <Text className="text-muted-foreground text-center text-xl font-bold">0</Text>
                <Text className="text-muted-foreground text-center text-xs">Total Tasks</Text>
              </View>
              <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                <Text className="text-muted-foreground text-center text-xl font-bold">0h</Text>
                <Text className="text-muted-foreground text-center text-xs">Total Hours</Text>
              </View>
              <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                <Text className="text-muted-foreground text-center text-xl font-bold">0</Text>
                <Text className="text-muted-foreground text-center text-xs">Avg Tasks</Text>
              </View>
              <View className="bg-muted/30 border-border flex-1 rounded-lg border p-3">
                <Text className="text-muted-foreground text-center text-xl font-bold">0%</Text>
                <Text className="text-muted-foreground text-center text-xs">Check-ins</Text>
              </View>
            </View>
          </View>
        ) : null}

        {!isLoading && !error && daysWithCheckins > 0 ? (
          <View className="gap-4">
            <View className="mb-1 flex-row gap-3">
              <View className="flex-1 gap-3">
                <View className="bg-muted/30 rounded-lg p-4">
                  <Text className="text-center text-2xl font-bold text-green-600">{totalTasks}</Text>
                  <Text className="text-muted-foreground text-center text-xs">Total Tasks</Text>
                </View>
                <View className="bg-muted/30 rounded-lg p-4">
                  <Text className="text-center text-2xl font-bold text-green-500">{avgTasks}</Text>
                  <Text className="text-muted-foreground text-center text-xs">Avg Tasks/Day</Text>
                </View>
              </View>

              <View className="flex-1 gap-3">
                <View className="bg-muted/30 rounded-lg p-4">
                  <Text className="text-center text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</Text>
                  <Text className="text-muted-foreground text-center text-xs">Total Hours</Text>
                </View>
                <View className="bg-muted/30 rounded-lg p-4">
                  <Text className="text-center text-2xl font-bold text-blue-500">{avgHours}h</Text>
                  <Text className="text-muted-foreground text-center text-xs">Avg Hours/Day</Text>
                </View>
              </View>
            </View>

            <View className="items-center">
              <View className="bg-primary/10 flex-row items-center gap-2 rounded-lg px-4 py-2">
                <Text className="text-primary text-lg font-bold">{checkInRate}%</Text>
                <Text className="text-muted-foreground text-sm">Check-in Rate</Text>
              </View>
            </View>

            <View className="gap-4">
              <View className="flex-row items-center justify-center gap-5">
                <View className="flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded bg-orange-500" />
                  <Text className="text-xs">Tasks (bars)</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded bg-cyan-500/70" />
                  <Text className="text-xs">Hours (points)</Text>
                </View>
              </View>

              <View className="bg-muted/20 border-border rounded-lg border px-2 py-3">
                <BarChart
                  data={barData}
                  lineData={lineData}
                  showLine
                  lineConfig={{
                    isSecondary: true,
                    color: '#06b6d4',
                    thickness: 2,
                    curved: true,
                    dataPointsColor: '#06b6d4',
                    dataPointsRadius: 3,
                    hideDataPoints: false,
                  }}
                  secondaryYAxis={{
                    maxValue: Math.max(maxHours, 1),
                    noOfSections: 4,
                    yAxisOffset: 0,
                  }}
                  height={220}
                  barWidth={16}
                  spacing={18}
                  initialSpacing={10}
                  endSpacing={10}
                  roundedTop
                  hideRules={false}
                  rulesColor="rgba(115,115,115,0.25)"
                  rulesType="solid"
                  yAxisThickness={0}
                  xAxisThickness={0}
                  yAxisTextStyle={{ color: '#8a8a8a', fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: '#8a8a8a', fontSize: 10 }}
                  noOfSections={4}
                  maxValue={Math.max(maxTasks, 1)}
                  formatYLabel={(label) => `${Math.round(Number(label))}`}
                  renderTooltip={(item: { value?: number }, index: number) => {
                    const activity = visibleChartData[index];
                    return (
                      <View className="border-border bg-popover min-w-36 gap-1 rounded-md border px-2 py-1.5">
                        <Text className="text-xs font-semibold">
                          {activity
                            ? new Date(activity.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </Text>
                        <Text className="text-xs">Tasks: {item.value ?? 0}</Text>
                        <Text className="text-xs">Hours: {activity?.hoursStudied?.toFixed(1) ?? '0.0'}</Text>
                        {!activity?.hasCheckin ? (
                          <Text className="text-muted-foreground text-[10px]">No check-in submitted</Text>
                        ) : null}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        ) : null}
      </CardContent>
    </Card>
  );
}
