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
import { ApiError, type EducationLevel } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';

const EDUCATION_LEVELS: EducationLevel[] = ['School', 'College', 'Coaching', 'CompetitiveExams'];

const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  School: 'School',
  College: 'College',
  Coaching: 'Coaching',
  CompetitiveExams: 'Competitive',
};

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const phoneInputRef = React.useRef<TextInput>(null);
  const instituteInputRef = React.useRef<TextInput>(null);
  const classInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [institute, setInstitute] = React.useState('');
  const [level, setLevel] = React.useState<EducationLevel>('School');
  const [classOrStandard, setClassOrStandard] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function onEmailSubmitEditing() {
    phoneInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim() || !institute.trim() || !classOrStandard.trim()) {
      setError('Fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        institute: institute.trim(),
        level,
        classOrStandard: classOrStandard.trim(),
        password,
        confirmPassword,
      });
      router.push({ pathname: '/verify-email', params: { email: email.trim().toLowerCase() } });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoComplete="name"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                ref={phoneInputRef}
                id="phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => instituteInputRef.current?.focus()}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="institute">Institute</Label>
              <Input
                ref={instituteInputRef}
                id="institute"
                value={institute}
                onChangeText={setInstitute}
                placeholder="School, college, or institute"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => classInputRef.current?.focus()}
              />
            </View>
            <View className="gap-2">
              <Label>Level</Label>
              <View className="flex-row flex-wrap gap-2">
                {EDUCATION_LEVELS.map((item) => (
                  <Button
                    key={item}
                    variant={level === item ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setLevel(item)}>
                    <Text>{EDUCATION_LEVEL_LABELS[item]}</Text>
                  </Button>
                ))}
              </View>
            </View>
            <View className="gap-1.5">
              <Label htmlFor="classOrStandard">Class or standard</Label>
              <Input
                ref={classInputRef}
                id="classOrStandard"
                value={classOrStandard}
                onChangeText={setClassOrStandard}
                placeholder="10th, B.Tech, UPSC, etc."
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="confirmPassword">Confirm password</Label>
              </View>
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
              <Text>{isSubmitting ? 'Creating account...' : 'Continue'}</Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Already have an account?{' '}
            <Pressable onPress={() => router.push('/sign-in')}>
              <Text className="text-sm underline underline-offset-4">Sign in</Text>
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
