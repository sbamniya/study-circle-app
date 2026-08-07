import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MoreScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        <View className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>More</CardTitle>
              <CardDescription>Your more tab is now available.</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground text-sm">
                Add profile, settings, and account actions here.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
