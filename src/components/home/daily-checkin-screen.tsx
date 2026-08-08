import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Alert, View } from 'react-native';

export function DailyCheckinScreen() {
  const moodOptions = React.useMemo(
    () => [
      { value: 'MOTIVATED', label: 'Motivated' },
      { value: 'FOCUSED', label: 'Focused' },
      { value: 'GOOD', label: 'Good' },
      { value: 'OKAY', label: 'Okay' },
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

    Alert.alert(
      'Check-in',
      'Check-in submit flow will be connected to the API next.\n\n' +
        `Hours: ${studyHours || '0'}\nTasks: ${completedTasks || '0'}\nMood: ${mood?.label ?? 'N/A'}\nGoals: ${goals || 'N/A'}`
    );
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <View className="flex-row items-center gap-2">
          <Feather name="calendar" size={18} color="#9ca3af" />
          <CardTitle className="text-xl">Daily Check-in</CardTitle>
        </View>
        <CardDescription>Share your progress for today and keep your streak active.</CardDescription>
      </CardHeader>

      <CardContent className="gap-4 px-4">
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
          <Label>Today&apos;s goals (optional)</Label>
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

        <Button onPress={submitCheckIn}>
          <Feather name="check" size={16} color="#ffffff" />
          <Text>Submit Check-in</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
