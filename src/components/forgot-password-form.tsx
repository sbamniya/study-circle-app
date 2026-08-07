import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export function ForgotPasswordForm() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const responseMessage = await forgotPassword(email.trim().toLowerCase());
      setMessage(responseMessage);
      router.push({ pathname: '/reset-password', params: { email: email.trim().toLowerCase() } });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to send reset code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Forgot password?</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
            </View>
            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
            {message ? <Text className="text-muted-foreground text-sm">{message}</Text> : null}
            <Button className="w-full" disabled={isSubmitting} onPress={onSubmit}>
              <Text>{isSubmitting ? 'Sending code...' : 'Reset your password'}</Text>
            </Button>
            <Button variant="link" onPress={() => router.push('/sign-in')}>
              <Text>Back to sign in</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
