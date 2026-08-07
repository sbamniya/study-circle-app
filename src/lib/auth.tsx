import { authApi, type AuthResponse, type LoginPayload, type SignupPayload, type User } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';

const TOKEN_KEY = 'studycircle.auth_token';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  signIn(payload: LoginPayload): Promise<void>;
  signUp(payload: SignupPayload): Promise<string>;
  verifyEmail(payload: { email: string; code: string }): Promise<void>;
  resendVerification(email: string): Promise<string>;
  forgotPassword(email: string): Promise<string>;
  resetPassword(payload: {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
  }): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

async function getStoredToken() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setStoredToken(token: string) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function deleteStoredToken() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);

  const applyAuthResponse = React.useCallback(async (response: AuthResponse) => {
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();

        if (!storedToken) {
          return;
        }

        const currentUser = await authApi.me(storedToken);

        if (mounted) {
          setToken(storedToken);
          setUser(currentUser);
        }
      } catch {
        await deleteStoredToken();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      isLoading,
      token,
      user,
      async signIn(payload) {
        const response = await authApi.login(payload);
        await applyAuthResponse(response);
      },
      async signUp(payload) {
        const response = await authApi.signup(payload);
        return response.message ?? 'Please check your email for verification code';
      },
      async verifyEmail(payload) {
        const response = await authApi.verifyEmail(payload);
        await applyAuthResponse(response);
      },
      async resendVerification(email) {
        const response = await authApi.resendVerification(email);
        return response.message ?? 'Verification code sent successfully';
      },
      async forgotPassword(email) {
        const response = await authApi.forgotPassword(email);
        return response.message ?? 'Verification code sent successfully';
      },
      async resetPassword(payload) {
        const response = await authApi.resetPassword(payload);
        await applyAuthResponse(response);
      },
      async signOut() {
        await deleteStoredToken();
        setToken(null);
        setUser(null);
      },
    }),
    [applyAuthResponse, isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
