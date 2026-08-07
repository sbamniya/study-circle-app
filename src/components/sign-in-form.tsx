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
import { Pressable, type TextInput, View } from 'react-native';

export function SignInForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const passwordInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      router.replace('/');
    } catch (caughtError) {
      console.log('Sign-in error:', caughtError);
      const message =
        caughtError instanceof ApiError ? caughtError.message : 'Unable to sign in right now.';

      setError(message);

      if (message.toLowerCase().includes('verify your email')) {
        router.push({ pathname: '/verify-email', params: { email: email.trim().toLowerCase() } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Sign in to your app</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome back! Please sign in to continue
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
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="web:h-fit ml-auto h-4 px-1 py-0 sm:h-4"
                  onPress={() => router.push('/forgot-password')}>
                  <Text className="font-normal leading-4">Forgot your password?</Text>
                </Button>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
            </View>
            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
            <Button className="w-full" disabled={isSubmitting} onPress={onSubmit}>
              <Text>{isSubmitting ? 'Signing in...' : 'Continue'}</Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Pressable onPress={() => router.push('/sign-up')}>
              <Text className="text-sm underline underline-offset-4">Sign up</Text>
            </Pressable>
          </Text>
          {/* Social login temporarily disabled */}
          {/*
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
          */}
        </CardContent>
      </Card>
    </View>
  );
}
