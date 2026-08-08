import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { dashboardApi, type DashboardCheckInMood } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Alert, View } from 'react-native';

export function DailyCheckinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const moodOptions = React.useMemo(
    () => [
      { value: 'GREAT', label: 'Great' },
      { value: 'EXCITED', label: 'Excited' },
      { value: 'MOTIVATED', label: 'Motivated' },
      { value: 'FOCUSED', label: 'Focused' },
      { value: 'GOOD', label: 'Good' },
      { value: 'OKAY', label: 'Okay' },
      { value: 'STRUGGLING', label: 'Struggling' },
      { value: 'TIRED', label: 'Tired' },
    ],
    []
  );

  const [studyHours, setStudyHours] = React.useState('');
  const [completedTasks, setCompletedTasks] = React.useState('');
  const [mood, setMood] = React.useState<Option>(moodOptions[0]);
  const [goals, setGoals] = React.useState('');
  const [hoursError, setHoursError] = React.useState<string | null>(null);
  const [tasksError, setTasksError] = React.useState<string | null>(null);

  const createCheckInMutation = useMutation({
    mutationFn: async (payload: {
      studyHours: number;
      completedTasks: number;
      mood: DashboardCheckInMood;
      todayGoals?: string;
    }) => {
      if (!token) {
        throw new Error('Please sign in again to submit your check-in.');
      }

      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);

      return dashboardApi.createCheckIn(token, {
        date: localDate,
        studyHours: payload.studyHours,
        completedTasks: payload.completedTasks,
        mood: payload.mood,
        todayGoals: payload.todayGoals,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setStudyHours('');
      setCompletedTasks('');
      setMood(moodOptions[0]);
      setGoals('');
      setHoursError(null);
      setTasksError(null);
      onOpenChange(false);
      Alert.alert('Success', 'Daily check-in submitted.');
    },
  });

  function submitCheckIn() {
    setHoursError(null);
    setTasksError(null);

    const rawHours = studyHours.trim();
    const rawTasks = completedTasks.trim();
    let hasError = false;

    if (!rawHours) {
      setHoursError('Study hours is required.');
      hasError = true;
    }

    if (!rawTasks) {
      setTasksError('Completed tasks is required.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const parsedHours = Number(studyHours);
    const parsedTasks = Number(completedTasks);
    hasError = false;

    if (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 24) {
      setHoursError('Study hours must be a number between 0 and 24.');
      hasError = true;
    }

    if (!Number.isInteger(parsedTasks) || parsedTasks < 0) {
      setTasksError('Completed tasks must be a whole number greater than or equal to 0.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    createCheckInMutation.mutate(
      {
        studyHours: parsedHours,
        completedTasks: parsedTasks,
        mood: (mood?.value ?? moodOptions[0].value) as DashboardCheckInMood,
        todayGoals: goals.trim() ? goals.trim() : undefined,
      },
      {
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Unable to submit check-in right now.';
          Alert.alert('Check-in failed', message);
        },
      }
    );
  }

  const isSubmitting = createCheckInMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="border-border border-b px-4 py-4">
          <View className="flex-row items-center gap-2">
            <Feather name="calendar" size={18} color="#9ca3af" />
            <DialogTitle>Daily Check-in</DialogTitle>
          </View>
          <DialogDescription>
            Share your progress for today and keep your streak active.
          </DialogDescription>
        </DialogHeader>

        <View className="gap-4 px-4 py-4">
          <View className="gap-2">
            <Label>Study hours today</Label>
            <Input
              value={studyHours}
              onChangeText={(value) => {
                setStudyHours(value);
                if (hoursError) {
                  setHoursError(null);
                }
              }}
              keyboardType="decimal-pad"
              placeholder="e.g. 2.5"
            />
            {hoursError ? <Text className="text-destructive text-xs">{hoursError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Tasks completed</Label>
            <Input
              value={completedTasks}
              onChangeText={(value) => {
                setCompletedTasks(value);
                if (tasksError) {
                  setTasksError(null);
                }
              }}
              keyboardType="number-pad"
              placeholder="e.g. 6"
            />
            {tasksError ? <Text className="text-destructive text-xs">{tasksError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Mood</Label>
            <Select value={mood} onValueChange={(option) => setMood(option ?? moodOptions[0])}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {moodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} label={option.label} />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>

          <View className="gap-2">
            <Label>Today's goals (optional)</Label>
            <Input
              value={goals}
              onChangeText={setGoals}
              placeholder="What did you focus on today?"
              multiline
              numberOfLines={3}
              className="h-24 items-start py-3"
              textAlignVertical="top"
            />
          </View>
        </View>

        <DialogFooter className="border-border border-t px-4 py-4">
          <Button variant="outline" disabled={isSubmitting} onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button disabled={isSubmitting} onPress={submitCheckIn}>
            <Feather name="check" size={16} color="#ffffff" />
            <Text>{isSubmitting ? 'Submitting...' : 'Submit Check-in'}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
