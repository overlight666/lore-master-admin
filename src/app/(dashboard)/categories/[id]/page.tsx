'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { categoriesApi, topicsApi, subtopicsApi } from '@/services/api';
import { Category, Topic, Subtopic } from '@/types';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers,
  BookOpen,
  ChevronRight,
  Target,
  HelpCircle
} from 'lucide-react';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = (params?.id as string) || '';
  
  const [category, setCategory] = useState<Category | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const categoryData = await categoriesApi.getById(categoryId);
      setCategory(categoryData);
      
      // Fetch related topic and subtopic
      if (categoryData.topic_id) {
        const topicData = await topicsApi.getById(categoryData.topic_id);
        setTopic(topicData);
      }
      
      if (categoryData.subtopic_id) {
        const subtopicData = await subtopicsApi.getById(categoryData.subtopic_id);
        setSubtopic(subtopicData);
      }
    } catch (error) {
      console.error('Failed to fetch category:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesApi.delete(categoryId);
      router.push('/categories');
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleToggleStatus = async () => {
    if (!category) return;
    
    try {
      await categoriesApi.toggleStatus(categoryId);
      fetchCategory(); // Refresh data
    } catch (error) {
      console.error('Failed to toggle category status:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!category) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h2>
          <button
            onClick={() => router.push('/categories')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Categories
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <BookOpen className="h-4 w-4 mr-1" />
                {topic?.name}
                <ChevronRight className="h-4 w-4 mx-1" />
                {subtopic?.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/categories/${categoryId}/edit`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                category.isActive
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {category.isActive ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Category Info */}
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Layers className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h2>
                <p className="text-gray-600 mb-4">
                  {category.description || 'No description available.'}
                </p>
                
                {/* Status and Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Levels</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {category.totalLevels || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Questions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {category.questionCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {category.order || 0}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {category.tags && category.tags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {category.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {category.requirements && category.requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Requirements</p>
                    <div className="flex flex-wrap gap-2">
                      {category.requirements.map((requirement, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm"
                        >
                          {requirement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push(`/levels?categoryId=${categoryId}`)}
            className="bg-white border rounded-lg p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Levels</h3>
                <p className="text-sm text-gray-500">
                  View and edit levels in this category
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push(`/questions?categoryId=${categoryId}`)}
            className="bg-white border rounded-lg p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Questions</h3>
                <p className="text-sm text-gray-500">
                  View and edit questions in this category
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push(`/categories/${categoryId}/edit`)}
            className="bg-white border rounded-lg p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Edit Category</h3>
                <p className="text-sm text-gray-500">
                  Update category information
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">Category ID</p>
              <p className="text-gray-900 font-mono">{category.id}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Topic ID</p>
              <p className="text-gray-900 font-mono">{category.topic_id}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Subtopic ID</p>
              <p className="text-gray-900 font-mono">{category.subtopic_id}</p>
            </div>
            {category.created_at && (
              <div>
                <p className="font-medium text-gray-500">Created At</p>
                <p className="text-gray-900">
                  {new Date(category.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
