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

export type StudyMaterialQuizStatus =
  | 'PENDING'
  | 'GENERATING'
  | 'GENERATED'
  | 'GENERATION_FAILED';

export type StudyMaterialStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'PROCESSING_FAILED'
  | 'GENERATING_NOTES'
  | 'NOTES_GENERATED'
  | 'NOTES_GENERATION_FAILED'
  | 'ARCHIVED';

export type StudyMaterialFile = {
  id: string;
  fileName: string;
  status: StudyMaterialStatus;
  quizStatus: StudyMaterialQuizStatus;
  errorMessage: string | null;
};

export type StudyMaterial = {
  id: string;
  title: string;
  description: string;
  status: StudyMaterialStatus;
  userId: string;
  subjectId: string;
  processedNotes: string | null;
  subject: {
    id: string;
    name: string;
  } | null;
  _count: {
    files: number;
  };
  quizStatus: StudyMaterialQuizStatus;
  files: StudyMaterialFile[];
  createdAt: string;
  updatedAt: string;
};

export type StudyMaterialsResponse = {
  data: StudyMaterial[];
  pagination: {
    totalItems: number;
    totalPages?: number;
    page?: number;
    limit?: number;
  };
};

export type Subject = {
  id: string;
  name: string;
  description?: string;
  userId?: string;
};

export type NoteType = 'GENERATED' | 'CUSTOM';

export type Note = {
  id: string;
  content: string;
  type: NoteType;
  subjectId: number | string;
  subject: {
    id: number | string;
    name: string;
  } | null;
  studyMaterialId?: string | null;
  studyMaterial?: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type NotesResponse = {
  data: Note[];
  pagination: {
    totalItems: number;
    totalPages?: number;
    page?: number;
    limit?: number;
  };
};

export type SubjectsResponse = {
  data: Subject[];
  pagination: {
    totalItems: number;
    totalPages?: number;
    page?: number;
    limit?: number;
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

export type DashboardCheckInMood =
  | 'GREAT'
  | 'GOOD'
  | 'OKAY'
  | 'STRUGGLING'
  | 'MOTIVATED'
  | 'FOCUSED'
  | 'TIRED'
  | 'EXCITED';

export type CreateDashboardCheckInPayload = {
  date: string;
  studyHours: number;
  completedTasks: number;
  mood: DashboardCheckInMood;
  todayGoals?: string;
  challenges?: string;
  notes?: string;
};

export type DashboardCheckInRecord = {
  id: string;
  userId: number;
  date: string;
  studyHours: number;
  completedTasks: number;
  todayGoals?: string;
  challenges?: string;
  mood: DashboardCheckInMood;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardAIFeedback = {
  feedbackContent: string;
  keyInsights: string[];
  recommendations: string[];
  encouragement: string;
};

export type DashboardCheckInDetail = DashboardCheckInRecord & {
  aiFeedbacks?: DashboardAIFeedback[];
};

export type CreateDashboardCheckInResponse = {
  checkIn: DashboardCheckInRecord;
  streak: {
    current: number;
    best: number;
  };
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
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(endpoint(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body
      ? isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
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
  async createCheckIn(token: string, payload: CreateDashboardCheckInPayload) {
    return request<CreateDashboardCheckInResponse>('/check-ins', {
      method: 'POST',
      token,
      body: payload,
    });
  },
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
  async getCheckInById(token: string, checkInId: string) {
    return request<DashboardCheckInDetail>(`/check-ins/${checkInId}`, { token });
  },
  async getChartData(
    token: string,
    params: {
      startDate: string;
      endDate: string;
    }
  ) {
    const query = new URLSearchParams(params).toString();
    try {
      return await request<DashboardCheckInChartPoint[]>(`/check-ins/chart-data?${query}`, { token });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },
  async getStreak(token: string) {
    return request<DashboardStreak>('/check-ins/streak', { token });
  },
  async getRecentActivity(token: string) {
    return request<DashboardRecentActivityItem[]>('/check-ins/recent-activity', { token });
  },
};

export const studyMaterialsApi = {
  async list(
    token: string,
    params: {
      page: number;
      limit: number;
      search?: string;
    }
  ) {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      ...(params.search ? { search: params.search } : {}),
    }).toString();

    return request<StudyMaterialsResponse>(`/study-materials?${query}`, {
      token,
    });
  },
  async delete(token: string, id: string) {
    return request<MessageResponse | null>(`/study-materials/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  async create(
    token: string,
    payload: {
      title: string;
      description?: string;
      subjectId: string;
      file: {
        uri: string;
        name: string;
        type: string;
      };
    }
  ) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description ?? '');
    formData.append('subjectId', payload.subjectId);
    formData.append('file', payload.file as unknown as Blob);

    return request<StudyMaterial>('/study-materials', {
      method: 'POST',
      token,
      body: formData,
    });
  },
};

export const subjectsApi = {
  async list(
    token: string,
    params: {
      page: number;
      limit: number;
      search?: string;
    }
  ) {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      ...(params.search ? { search: params.search } : {}),
    }).toString();

    return request<SubjectsResponse>(`/subjects?${query}`, {
      token,
    });
  },
  async create(
    token: string,
    payload: {
      name: string;
      description?: string;
      userId?: string;
    }
  ) {
    return request<Subject>('/subjects', {
      method: 'POST',
      token,
      body: {
        name: payload.name,
        description: payload.description ?? '',
        userId: payload.userId ?? '',
      },
    });
  },
};

export const notesApi = {
  async list(
    token: string,
    params: {
      page: number;
      limit: number;
      search?: string;
      subjectId?: string;
    }
  ) {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      ...(params.search ? { search: params.search } : {}),
      ...(params.subjectId ? { subjectId: params.subjectId } : {}),
    }).toString();

    return request<NotesResponse>(`/notes?${query}`, {
      token,
    });
  },
  async create(
    token: string,
    payload: {
      content: string;
      subjectId: number;
    }
  ) {
    return request<Note>('/notes', {
      method: 'POST',
      token,
      body: payload,
    });
  },
  async update(
    token: string,
    id: string,
    payload: {
      content?: string;
      subjectId?: number;
    }
  ) {
    return request<Note>(`/notes/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },
  async delete(token: string, id: string) {
    return request<MessageResponse | null>(`/notes/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
