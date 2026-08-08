import { DailyCheckinScreen } from '@/components/home/daily-checkin-screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DailyCheckinRoute() {
  const { isLoading, token } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!token) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <View className="mx-auto w-full max-w-md gap-4 pb-8">
          <Button variant="outline" size="sm" className="self-start" onPress={() => router.back()}>
            <Text>Back</Text>
          </Button>
          <DailyCheckinScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
