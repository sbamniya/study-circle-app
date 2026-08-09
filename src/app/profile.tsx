import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const profileFields = [
    { label: 'Name', value: user?.name },
    { label: 'Email', value: user?.email },
    { label: 'Phone', value: user?.phone },
    { label: 'Institute', value: user?.institute },
    { label: 'Level', value: user?.level },
    { label: 'Class/Standard', value: user?.classOrStandard },
    { label: 'City', value: user?.city },
    { label: 'State', value: user?.state },
    { label: 'Country', value: user?.country },
    { label: 'Zipcode', value: user?.zipcode },
    { label: 'Subscription', value: user?.subscriptionTier },
  ] as const;

  function onRequestSignOut() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void onSignOut();
        },
      },
    ]);
  }

  async function onSignOut() {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to logout right now. Please try again.';
      Alert.alert('Logout Failed', message);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView className="bg-background flex-1" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        <View className="mx-auto w-full max-w-md gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account details and session actions.</CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              {profileFields.map((field) => (
                <View key={field.label} className="gap-1">
                  <Text className="text-muted-foreground text-xs">{field.label}</Text>
                  <Text className="text-sm font-medium">
                    {field.value?.toString().trim() || 'N/A'}
                  </Text>
                </View>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your active session.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onPress={onRequestSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Feather name="log-out" size={16} color="#ffffff" />
                )}
                <Text>{isSigningOut ? 'Logging out...' : 'Logout'}</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
