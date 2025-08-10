// Core Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
  energy?: number;
  totalScore?: number;
  questionsAttempted?: number;
  currentStreak?: number;
  bestStreak?: number;
  lastLoginAt?: any;
  createdAt?: any;
  updatedAt?: string;
  isActive?: boolean;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  subtopicsCount?: number;
  questionCount?: number;
  created_at?: any;
  updated_at?: any;
}

export interface Subtopic {
  id: string;
  name: string;
  description: string;
  topic_id: string;
  icon_url?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
  totalLevels?: number;
  difficulty?: string;
  estimatedTime?: number;
  tags?: string[];
  requirements?: string[];
  questionCount?: number;
  categoriesCount?: number;
  created_at?: any;
  updated_at?: any;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  subtopic_id: string;
  topic_id: string;
  icon_url?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
  totalLevels?: number;
  difficulty?: string;
  estimatedTime?: number;
  tags?: string[];
  requirements?: string[];
  questionCount?: number;
  created_at?: any;
  updated_at?: any;
}

export interface Level {
  id: string;
  topic_id: string;
  subtopic_id: string;
  category_id: string;
  level: number;
  name?: string;
  description?: string;
  totalQuestions: number;
  passingScore: number;
  isActive: boolean;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  question: string;
  choices?: string[]; // New backend format
  options?: string[]; // Backward compatibility
  correctAnswer: string;
  explanation?: string;
  topic_id: string;
  subtopic_id: string;
  category_id: string;
  level_id?: string; // Level ID reference
  level: number;
  attempts?: number;
  created_at?: any;
  updated_at?: any;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  level_id: string;
  score: number;
  timesTaken: number;
  completedAt: string;
  used5050: boolean;
  usedAiHint: boolean;
  energyConsumed: boolean;
}

// Form Types
export interface TopicFormData {
  name: string;
  description: string;
  icon_url: string;
  color: string;
  order: number;
  tags: string[];
  requirements: string[];
  isActive: boolean;
}

export interface SubtopicFormData {
  topic_id: string;
  name: string;
  description: string;
  order: number;
  tags: string[];
  requirements: string[];
  isActive: boolean;
}

export interface CategoryFormData {
  subtopic_id: string;
  topic_id: string;
  name: string;
  description: string;
  order: number;
  tags: string[];
  requirements: string[];
  isActive: boolean;
}

export interface QuestionFormData {
  subtopic_id: string;
  category_id: string;
  topic_id: string;
  level_id: string; // Add required level_id field
  question: string; // Change from 'text' to 'question'
  choices: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: number; // 1-10 levels
  tags: string[];
  estimatedTime: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  isActive: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

// Dashboard Statistics
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    growth: number;
  };
  content: {
    topics: number;
    subtopics: number;
    questions: number;
    levels: number;
  };
  activity: {
    totalQuizzes: number;
    todayQuizzes: number;
    avgScore: number;
  };
}

// Authentication
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  streak: number;
  completedQuizzes: number;
}
