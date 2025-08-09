'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Search, User, Mail, Calendar, Trophy } from 'lucide-react';
import { User as UserType } from '@/types';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.get('/admin/users');
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getInitials = (name: string, email: string) => {
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
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage registered users
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Total Users: {users.length}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Users List */}
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
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No users match your search.' : 'No users registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions Attempted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.photoURL ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.photoURL}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {getInitials(user.displayName || '', user.email || '')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName || 'Anonymous User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                            {user.totalScore || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.questionsAttempted || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.lastLoginAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* User Statistics */}
        {!isLoading && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Registered Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {users.length}
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
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Users (with scores)
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {users.filter(u => (u.totalScore || 0) > 0).length}
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
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        New Users (Last 30 Days)
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {users.filter(u => {
                          if (!u.createdAt) return false;
                          const userDate = u.createdAt.seconds ? 
                            new Date(u.createdAt.seconds * 1000) : 
                            new Date(u.createdAt);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return userDate > thirtyDaysAgo;
                        }).length}
                      </dd>
                    </dl>
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
