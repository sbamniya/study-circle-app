import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        <View className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Explore</CardTitle>
              <CardDescription>Authentication is connected. Product screens can plug in next.</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground text-sm">
                This protected tab is available only after login or email verification.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
