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

export type PaginatedApiResponse = {
  data: unknown[];
  pagination: {
    totalItems: number;
  };
};

export type DashboardCheckInChartPoint = {
  date: string;
  tasksCompleted: number;
  hoursStudied: number;
  hasCheckin: boolean;
};

export type DashboardStreak = {
  currentStreak: number;
  bestStreak: number;
  lastCheckinDate: string | null;
};

export type DashboardRecentActivityItem = {
  id: string;
  date: string;
  mood?: string;
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

function getTotalItems(payload: PaginatedApiResponse | null) {
  return payload?.pagination?.totalItems ?? 0;
}

export const dashboardApi = {
  async getStudyMaterialsCount(token: string) {
    const data = await request<PaginatedApiResponse>('/study-materials?page=1&limit=1', { token });
    return getTotalItems(data);
  },
  async getExamMaterialsCount(token: string) {
    const data = await request<PaginatedApiResponse>('/exam-papers?page=1&limit=1', { token });
    return getTotalItems(data);
  },
  async getQuizzesCount(token: string) {
    const data = await request<PaginatedApiResponse>('/quizzes?page=1&limit=1', { token });
    return getTotalItems(data);
  },
  async getStudyCirclesCount(token: string) {
    const data = await request<PaginatedApiResponse>('/study-circles?page=1&limit=1', { token });
    return getTotalItems(data);
  },
  async getTodayCheckIn(token: string) {
    try {
      return await request<{ id: string } | null>('/check-ins/today', { token });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
  async getChartData(
    token: string,
    params: {
      startDate: string;
      endDate: string;
    }
  ) {
    const query = new URLSearchParams(params).toString();
    return request<DashboardCheckInChartPoint[]>(`/check-ins/chart-data?${query}`, { token });
  },
  async getStreak(token: string) {
    return request<DashboardStreak>('/check-ins/streak', { token });
  },
  async getRecentActivity(token: string) {
    return request<DashboardRecentActivityItem[]>('/check-ins/recent-activity', { token });
  },
};
