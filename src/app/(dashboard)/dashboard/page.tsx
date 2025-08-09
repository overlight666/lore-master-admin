'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Users, 
  BookOpen, 
  HelpCircle, 
  Trophy,
  Activity,
  Target
} from 'lucide-react';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  totalTopics: number;
  totalSubtopics?: number;
  totalLevels?: number;
  totalQuestions: number;
  totalAttempts: number;
  recentUsers: Array<{
    id: string;
    email: string;
    displayName: string;
    createdAt: any;
  }>;
  topPerformers: Array<{
    userId: string;
    userEmail: string;
    userDisplayName: string;
    totalScore: number;
    questionsAttempted: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

    const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load data from the API endpoint
      const dashboardResponse = await apiService.get('/admin/dashboard');
      setStats(dashboardResponse);

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      // Use mock data as fallback when API is not available
      const mockStats = {
        totalUsers: 247,
        totalTopics: 12,
        totalSubtopics: 48,
        totalLevels: 120,
        totalQuestions: 156,
        totalAttempts: 1423,
        recentUsers: [
          {
            id: 'mock1',
            email: 'admin@loremaster.com',
            displayName: 'Admin User',
            createdAt: new Date()
          },
          {
            id: 'mock2',
            email: 'user@example.com',
            displayName: 'Test User',
            createdAt: new Date(Date.now() - 86400000) // 1 day ago
          }
        ],
        topPerformers: [
          {
            userId: 'mock1',
            userEmail: 'top.player@example.com',
            userDisplayName: 'Top Player',
            totalScore: 2450,
            questionsAttempted: 89
          },
          {
            userId: 'mock2',
            userEmail: 'good.player@example.com',
            userDisplayName: 'Good Player',
            totalScore: 1890,
            questionsAttempted: 67
          }
        ]
      };
      
      setStats(mockStats);
      toast.error('Using demo data - API not available');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your Lore Master application
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalUsers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Topics
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalTopics || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Levels
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalLevels || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Questions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalQuestions || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Attempts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalAttempts || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Users
              </h3>
              <div className="space-y-3">
                {stats?.recentUsers?.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {(user.displayName || user.email)?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {user.displayName || 'Anonymous User'}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                ))}
                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No users found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Top Performers
              </h3>
              <div className="space-y-3">
                {stats?.topPerformers?.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          <span className="text-sm font-medium">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {user.userDisplayName || 'Anonymous User'}
                        </p>
                        <p className="text-sm text-gray-500">{user.userEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user.totalScore} pts
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.questionsAttempted} questions
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.topPerformers || stats.topPerformers.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No leaderboard data found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/topics'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Topics
              </button>
              <button 
                onClick={() => window.location.href = '/questions'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Manage Questions
              </button>
              <button 
                onClick={() => window.location.href = '/users'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                View Users
              </button>
              <button 
                onClick={() => window.location.href = '/leaderboard'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
