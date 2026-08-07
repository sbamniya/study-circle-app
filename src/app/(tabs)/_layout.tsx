import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/lib/auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/sign-in" />;
  }

  return <AppTabs />;
}
