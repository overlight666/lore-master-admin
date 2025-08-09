import axios from 'axios';
import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-pjqcolhhra-uc.a.run.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Get token (use cached version unless specifically refreshing)
        const forceRefresh = config.headers['X-Force-Token-Refresh'] === 'true';
        delete config.headers['X-Force-Token-Refresh']; // Remove the custom header
        
        const token = await currentUser.getIdToken(forceRefresh);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If we get 401 and haven't already tried refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Force refresh the token
          const newToken = await currentUser.getIdToken(true);
          
          if (newToken) {
            // Add the custom header to force refresh in the request interceptor
            originalRequest.headers['X-Force-Token-Refresh'] = 'true';
            
            // Retry the original request
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
      }
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized - only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.warn('Authentication failed after token refresh attempt');
        // Uncomment if you want automatic redirect: window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  get: async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  delete: async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },

  patch: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },

  postFormData: async <T = any>(url: string, formData: FormData, config?: any): Promise<T> => {
    const response = await apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default apiService;
