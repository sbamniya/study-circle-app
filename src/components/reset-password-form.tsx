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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { TextInput, View } from 'react-native';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { resetPassword } = useAuth();
  const emailInputRef = React.useRef<TextInput>(null);
  const codeInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState(params.email ?? '');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function onPasswordSubmitEditing() {
    confirmPasswordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!email.trim() || !code.trim() || !password || !confirmPassword) {
      setError('Enter your email, code, and new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
        confirmPassword,
      });
      router.replace('/');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Reset password</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter the code sent to your email and set a new password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
                id="email"
                value={email}
                onChangeText={setEmail}
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => codeInputRef.current?.focus()}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="code">Verification code</Label>
              <Input
                ref={codeInputRef}
                id="code"
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
                returnKeyType="next"
                keyboardType="numeric"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                submitBehavior="submit"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">New password</Label>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={onPasswordSubmitEditing}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                ref={confirmPasswordInputRef}
                id="confirmPassword"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
            </View>
            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
            <Button className="w-full" disabled={isSubmitting} onPress={onSubmit}>
              <Text>{isSubmitting ? 'Resetting...' : 'Reset Password'}</Text>
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
