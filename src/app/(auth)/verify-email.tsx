import { AuthScreen } from '@/components/auth-screen';
import { VerifyEmailForm } from '@/components/verify-email-form';

export default function VerifyEmailScreen() {
  return (
    <AuthScreen centerContent>
      <VerifyEmailForm />
    </AuthScreen>
  );
}
