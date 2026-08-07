import { useAuth } from '@/lib/auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthScreen({
  children,
  centerContent = false,
}: {
  children: React.ReactNode;
  centerContent?: boolean;
}) {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (token) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: centerContent ? 'center' : 'flex-start',
          paddingHorizontal: 16,
          paddingVertical: 32,
        }}>
        <View className="mx-auto w-full max-w-md">{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
