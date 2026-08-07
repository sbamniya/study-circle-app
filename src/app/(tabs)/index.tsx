import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { signOut, user } = useAuth();

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        <View className="mx-auto w-full max-w-md gap-4">
          <View className="gap-1">
            <Text className="text-2xl font-semibold">StudyCircle AI</Text>
            <Text className="text-muted-foreground">
              Welcome back{user?.name ? `, ${user.name}` : ''}.
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your current authenticated profile</CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              <View>
                <Text className="text-sm font-medium">Email</Text>
                <Text className="text-muted-foreground text-sm">{user?.email}</Text>
              </View>
              <View>
                <Text className="text-sm font-medium">Institute</Text>
                <Text className="text-muted-foreground text-sm">
                  {user?.institute || 'Not set'}
                </Text>
              </View>
              <Button variant="outline" onPress={signOut}>
                <Text>Sign out</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
