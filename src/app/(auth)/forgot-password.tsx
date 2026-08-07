import { AuthScreen } from '@/components/auth-screen';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export default function ForgotPasswordScreen() {
  return (
    <AuthScreen centerContent>
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
