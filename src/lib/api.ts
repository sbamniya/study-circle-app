export type EducationLevel = 'School' | 'College' | 'Coaching' | 'CompetitiveExams';

export type User = {
  id: number | string;
  email: string;
  name: string;
  phone?: string | null;
  institute?: string | null;
  level?: EducationLevel | null;
  classOrStandard?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipcode?: string | null;
  subscriptionTier?: string | null;
  referralCode?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  phone: string;
  institute: string;
  level: EducationLevel;
  classOrStandard: string;
  password: string;
  confirmPassword: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  referralCode?: string | null;
  sessionId?: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
  message?: string;
};

export type MessageResponse = {
  message: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/v1';

function endpoint(path: string) {
  const base = API_BASE_URL.replace(/\/$/, '');
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${base}${route}`;
}

function errorMessage(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    token?: string | null;
  } = {}
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(endpoint(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(errorMessage(data, 'Something went wrong'), response.status, data);
  }

  return data as T;
}

export const authApi = {
  login(payload: LoginPayload) {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: payload });
  },
  signup(payload: SignupPayload) {
    return request<MessageResponse & Partial<User>>('/auth/signup', {
      method: 'POST',
      body: payload,
    });
  },
  me(token: string) {
    return request<User>('/auth/me', { token });
  },
  verifyEmail(payload: { email: string; code: string }) {
    return request<AuthResponse>('/auth/verify-email', { method: 'POST', body: payload });
  },
  resendVerification(email: string) {
    return request<MessageResponse>('/auth/resend-verification', {
      method: 'POST',
      body: { email },
    });
  },
  forgotPassword(email: string) {
    return request<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },
  resetPassword(payload: {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
  }) {
    return request<AuthResponse>('/auth/reset-password', { method: 'POST', body: payload });
  },
};
