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
import { type TextInput, type TextStyle, View } from 'react-native';

const RESEND_CODE_INTERVAL_SECONDS = 30;

const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ['tabular-nums'] };

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { resendVerification, verifyEmail } = useAuth();
  const { countdown, restartCountdown } = useCountdown(RESEND_CODE_INTERVAL_SECONDS);
  const codeInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState(params.email ?? '');
  const [code, setCode] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  async function onSubmit() {
    if (!email.trim() || code.trim().length !== 6) {
      setError('Enter your email and 6-digit verification code.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await verifyEmail({ email: email.trim().toLowerCase(), code: code.trim() });
      router.replace('/');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to verify email.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResend() {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }

    setError(null);
    setMessage(null);
    setIsResending(true);

    try {
      const responseMessage = await resendVerification(email.trim().toLowerCase());
      setMessage(responseMessage);
      restartCountdown();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to resend code.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border pb-4 shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Verify your email</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter the verification code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
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
                returnKeyType="send"
                keyboardType="numeric"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                onSubmitEditing={onSubmit}
              />
              <Button
                variant="link"
                size="sm"
                disabled={countdown > 0 || isResending}
                onPress={onResend}>
                <Text className="text-center text-xs">
                  {isResending ? 'Sending...' : "Didn't receive the code? Resend"}{' '}
                  {countdown > 0 ? (
                    <Text className="text-xs" style={TABULAR_NUMBERS_STYLE}>
                      ({countdown})
                    </Text>
                  ) : null}
                </Text>
              </Button>
            </View>
            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
            {message ? <Text className="text-muted-foreground text-sm">{message}</Text> : null}
            <View className="gap-3">
              <Button className="w-full" disabled={isSubmitting} onPress={onSubmit}>
                <Text>{isSubmitting ? 'Verifying...' : 'Continue'}</Text>
              </Button>
              <Button
                variant="link"
                className="mx-auto"
                onPress={() => router.push('/sign-up')}>
                <Text>Cancel</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = React.useState(seconds);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = React.useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = React.useCallback(() => {
    stopCountdown();
    setCountdown(seconds);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }, [seconds, stopCountdown]);

  React.useEffect(() => {
    startCountdown();

    return stopCountdown;
  }, [startCountdown, stopCountdown]);

  return { countdown, restartCountdown: startCountdown };
}
