import axios from 'axios';
import { auth } from '@/lib/firebase';
import { 
  User, 
  Topic, 
  Subtopic, 
  Question, 
  TopicFormData, 
  SubtopicFormData, 
  QuestionFormData,
  PaginatedResponse,
  DashboardStats,
  LeaderboardEntry 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 API Request with Firebase token:', {
        url: config.url,
        method: config.method,
        userEmail: user.email,
        tokenPreview: token.substring(0, 50) + '...'
      });
    } else {
      console.log('🔐 API Request without authentication - no user');
    }
  } catch (error) {
    console.error('Error getting Firebase token:', error);
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response success:', {
      url: response.config.url,
      status: response.status,
      dataPreview: typeof response.data === 'object' ? Object.keys(response.data) : 'Not object'
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Auth API (these are not needed when using Firebase Auth directly)
// Keeping for reference or potential future use
export const authApi = {
  // These endpoints are not used with direct Firebase Auth
  login: async (email: string, password: string) => {
    console.warn('Using Firebase Auth directly, not custom login endpoint');
    throw new Error('Use Firebase Auth login instead');
  },
  logout: async () => {
    console.warn('Using Firebase Auth directly, not custom logout endpoint');
    throw new Error('Use Firebase Auth logout instead');
  },
  verifyToken: async () => {
    console.warn('Using Firebase Auth directly, not custom verify endpoint');
    throw new Error('Use Firebase Auth token verification instead');
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

// Topics API
export const topicsApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Topic>> => {
    const response = await api.get('/topics', { params });
    return response.data;
  },
  getById: async (id: string): Promise<Topic> => {
    const response = await api.get(`/topics/${id}`);
    return response.data;
  },
  create: async (data: TopicFormData): Promise<Topic> => {
    const response = await api.post('/topics', data);
    return response.data;
  },
  update: async (id: string, data: Partial<TopicFormData>): Promise<Topic> => {
    const response = await api.put(`/topics/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/topics/${id}`);
  },
  toggleStatus: async (id: string): Promise<Topic> => {
    const response = await api.patch(`/topics/${id}/toggle-status`);
    return response.data;
  },
};

// Subtopics API
export const subtopicsApi = {
  getAll: async (params?: { topicId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Subtopic>> => {
    const response = await api.get('/subtopics', { params });
    return response.data;
  },
  getById: async (id: string): Promise<Subtopic> => {
    const response = await api.get(`/subtopics/${id}`);
    return response.data;
  },
  create: async (data: SubtopicFormData): Promise<Subtopic> => {
    const response = await api.post('/subtopics', data);
    return response.data;
  },
  update: async (id: string, data: Partial<SubtopicFormData>): Promise<Subtopic> => {
    const response = await api.put(`/subtopics/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subtopics/${id}`);
  },
  toggleStatus: async (id: string): Promise<Subtopic> => {
    const response = await api.patch(`/subtopics/${id}/toggle-status`);
    return response.data;
  },
};

// Questions API
export const questionsApi = {
  getAll: async (params?: { 
    topicId?: string; 
    subtopicId?: string; 
    difficulty?: number; 
    page?: number; 
    limit?: number 
  }): Promise<PaginatedResponse<Question>> => {
    const response = await api.get('/questions', { params });
    return response.data;
  },
  getById: async (id: string): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },
  create: async (data: QuestionFormData): Promise<Question> => {
    const response = await api.post('/questions', data);
    return response.data;
  },
  update: async (id: string, data: Partial<QuestionFormData>): Promise<Question> => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },
  toggleStatus: async (id: string): Promise<Question> => {
    const response = await api.patch(`/questions/${id}/toggle-status`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  toggleStatus: async (id: string): Promise<User> => {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Leaderboard API
export const leaderboardApi = {
  getTop: async (limit: number = 100): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`/leaderboard/top/${limit}`);
    return response.data;
  },
};

export default api;
