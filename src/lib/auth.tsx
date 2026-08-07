import { authApi, type AuthResponse, type LoginPayload, type SignupPayload, type User } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';

const TOKEN_KEY = 'studycircle.auth_token';
const AUTH_QUERY_KEYS = {
  me: (token: string) => ['auth', 'me', token] as const,
};

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
  const queryClient = useQueryClient();
  const [isRestoringSession, setIsRestoringSession] = React.useState(true);
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);

  const applyAuthResponse = React.useCallback(async (response: AuthResponse) => {
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
    queryClient.setQueryData(AUTH_QUERY_KEYS.me(response.token), response.user);
  }, [queryClient]);

  const meQuery = useQuery({
    queryKey: token ? AUTH_QUERY_KEYS.me(token) : ['auth', 'me', 'anonymous'],
    queryFn: async () => authApi.me(token as string),
    enabled: Boolean(token) && !isRestoringSession,
    retry: 1,
  });

  React.useEffect(() => {
    if (!meQuery.isError || !token) {
      return;
    }

    async function clearInvalidSession() {
      await deleteStoredToken();
      setToken(null);
      setUser(null);
    }

    void clearInvalidSession();
  }, [meQuery.isError, token]);

  React.useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();

        if (mounted && storedToken) {
          setToken(storedToken);
        }
      } catch {
        await deleteStoredToken();
      } finally {
        if (mounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signInMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      await applyAuthResponse(response);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: authApi.signup,
  });

  const verifyEmailMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: async (response) => {
      await applyAuthResponse(response);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: authApi.resendVerification,
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: async (response) => {
      await applyAuthResponse(response);
    },
  });

  const isLoading = isRestoringSession || (Boolean(token) && meQuery.isLoading);
  const resolvedUser = user ?? meQuery.data ?? null;

  const value = React.useMemo<AuthContextValue>(
    () => ({
      isLoading,
      token,
      user: resolvedUser,
      async signIn(payload) {
        await signInMutation.mutateAsync(payload);
      },
      async signUp(payload) {
        const response = await signUpMutation.mutateAsync(payload);
        return response.message ?? 'Please check your email for verification code';
      },
      async verifyEmail(payload) {
        await verifyEmailMutation.mutateAsync(payload);
      },
      async resendVerification(email) {
        const response = await resendVerificationMutation.mutateAsync(email);
        return response.message ?? 'Verification code sent successfully';
      },
      async forgotPassword(email) {
        const response = await forgotPasswordMutation.mutateAsync(email);
        return response.message ?? 'Verification code sent successfully';
      },
      async resetPassword(payload) {
        await resetPasswordMutation.mutateAsync(payload);
      },
      async signOut() {
        await deleteStoredToken();
        if (token) {
          queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me(token) });
        }
        setToken(null);
        setUser(null);
      },
    }),
    [
      forgotPasswordMutation,
      isLoading,
      queryClient,
      resendVerificationMutation,
      resolvedUser,
      resetPasswordMutation,
      signInMutation,
      signUpMutation,
      token,
      verifyEmailMutation,
    ]
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
