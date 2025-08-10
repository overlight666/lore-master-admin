'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { categoriesApi, topicsApi, subtopicsApi } from '@/services/api';
import { Category, Topic, Subtopic, PaginatedResponse } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  BookOpen,
  ChevronRight
} from 'lucide-react';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const limit = 10;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params: any = { 
        page: currentPage, 
        limit,
        search: searchTerm || undefined
      };
      
      if (selectedTopic) params.topic_id = selectedTopic;
      if (selectedSubtopic) params.subtopic_id = selectedSubtopic;

      const response: PaginatedResponse<Category> = await categoriesApi.getAll(params);
      // Handle both response formats - some APIs return 'data', others return 'items'
      const categoriesData = response.items || response.data || [];
      setCategories(categoriesData);
      setTotal(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / limit));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await topicsApi.getAll({ limit: 100 });
      // Handle both response formats - some APIs return 'data', others return 'items'
      const topicsData = response.items || response.data || [];
      setTopics(topicsData);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      setTopics([]);
    }
  };

  const fetchSubtopics = async () => {
    try {
      const params: any = { limit: 100 };
      if (selectedTopic) params.topic_id = selectedTopic;
      
      const response = await subtopicsApi.getAll(params);
      // Handle both response formats - some APIs return 'data', others return 'items'
      const subtopicsData = response.items || response.data || [];
      setSubtopics(subtopicsData);
    } catch (error) {
      console.error('Failed to fetch subtopics:', error);
      setSubtopics([]);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchSubtopics();
  }, [selectedTopic]);

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm, selectedTopic, selectedSubtopic]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesApi.delete(id);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await categoriesApi.toggleStatus(id);
      fetchCategories();
    } catch (error) {
      console.error('Failed to toggle category status:', error);
    }
  };

  const getTopicName = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.name || 'Unknown Topic';
  };

  const getSubtopicName = (subtopicId: string) => {
    return subtopics.find(s => s.id === subtopicId)?.name || 'Unknown Subtopic';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Manage categories within subtopics</p>
          </div>
          <button
            onClick={() => router.push('/categories/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Category
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Layers className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedSubtopic(''); // Reset subtopic when topic changes
              }}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Topics</option>
              {topics && Array.isArray(topics) ? topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              )) : null}
            </select>

            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedTopic}
            >
              <option value="">All Subtopics</option>
              {subtopics && Array.isArray(subtopics) ? subtopics.map(subtopic => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
              )) : null}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTopic('');
                setSelectedSubtopic('');
                setCurrentPage(1);
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hierarchy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Levels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories && Array.isArray(categories) ? categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Layers className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {category.name}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {category.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {getTopicName(category.topic_id)}
                            <ChevronRight className="h-4 w-4 mx-1" />
                            {getSubtopicName(category.subtopic_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {category.totalLevels || 0} levels
                          </div>
                          <div className="text-sm text-gray-500">
                            {category.questionCount || 0} questions
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              category.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/categories/${category.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/categories/${category.id}/edit`)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(category.id)}
                              className={`${
                                category.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                              }`}
                              title={category.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          {loading ? 'Loading categories...' : 'No categories found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{((currentPage - 1) * limit) + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * limit, total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{total}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === i + 1
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
