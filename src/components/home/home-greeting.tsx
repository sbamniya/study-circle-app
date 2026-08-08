import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export function HomeGreeting({ name }: { name?: string | null }) {
  return (
    <View className="gap-1">
      <Text className="text-muted-foreground text-sm">Welcome back</Text>
      <Text className="text-3xl font-semibold leading-tight">Hi, {name ?? 'there'}.</Text>
      <Text className="text-muted-foreground text-sm">Track your progress and keep the streak going.</Text>
    </View>
  );
}
