'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Trophy, Medal, Award, User, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  user_id: string;
  username?: string;
  email: string;
  avatar?: string | null;
  total_score: number;
  questions_attempted: number;
  current_streak?: number;
  best_streak?: number;
  last_active?: any;
  rank: number;
  averageScore?: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.get('/admin/leaderboard');
      // Handle paginated response
      const items = data.items || data || [];
      // Add rank and calculate average score
      const rankedData = items.map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        rank: entry.rank || index + 1,
        averageScore: entry.questions_attempted > 0 ? 
          Math.round((entry.total_score / entry.questions_attempted) * 10) / 10 : 0
      }));
      setLeaderboard(rankedData);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Top performing users and their quiz statistics
            </p>
          </div>
          <button
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Leaderboard Stats */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Highest Score
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.max(...leaderboard.map(entry => entry.total_score))}
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
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Players
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {leaderboard.length}
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
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Average Score
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {leaderboard.length > 0 ? 
                          Math.round(leaderboard.reduce((sum, entry) => sum + entry.total_score, 0) / leaderboard.length) 
                          : 0
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leaderboard Data</h3>
            <p className="text-gray-500">
              No users have attempted questions yet. The leaderboard will appear once users start playing!
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Players</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors border ${getRankBackground(entry.rank!)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getRankIcon(entry.rank!)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            <span className="text-sm font-medium">
                              {getInitials(entry.username, entry.email)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {entry.username || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {entry.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {entry.total_score} pts
                        </p>
                        <p className="text-gray-500">
                          {entry.questions_attempted} questions
                        </p>
                      </div>
                      
                      {entry.averageScore !== undefined && (
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">Avg Score</p>
                          <p className="font-medium text-gray-900">
                            {entry.averageScore}/10
                          </p>
                        </div>
                      )}
                      
                      {entry.rank! <= 3 && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          #{entry.rank}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Performance Insights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {leaderboard.filter(e => e.total_score > 0).length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Users with scores
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {leaderboard.filter(e => e.questions_attempted >= 10).length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Active players (10+ questions)
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.max(...leaderboard.map(e => e.questions_attempted), 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Most questions attempted
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {leaderboard.length > 0 ? 
                      Math.max(...leaderboard.map(e => e.averageScore || 0)).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Highest average score
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
