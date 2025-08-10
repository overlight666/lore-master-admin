'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Plus, Edit, Trash2, Layers, BookOpen, ChevronRight } from 'lucide-react';
import { Topic, Subtopic, Category } from '@/types';
import { apiService } from '@/services/apiService';
import { categoriesApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function SubtopicCategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.id as string;
  const subtopicId = params?.subtopicId as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (topicId && subtopicId) {
      loadData();
    }
  }, [topicId, subtopicId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [topicData, subtopicData, categoriesData] = await Promise.all([
        apiService.get(`/admin/topics/${topicId}`),
        apiService.get(`/admin/subtopics/${subtopicId}`),
        categoriesApi.getAll({ topic_id: topicId, subtopic_id: subtopicId })
      ]);
      
      // Handle topic data
      setTopic(topicData?.topic || topicData);
      
      // Handle subtopic data
      setSubtopic(subtopicData?.subtopic || subtopicData);
      
      // Handle categories data
      const categoryList = Array.isArray(categoriesData?.data) 
        ? categoriesData.data 
        : Array.isArray(categoriesData) 
        ? categoriesData 
        : [];
      setCategories(categoryList);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated levels and questions.')) {
      return;
    }

    try {
      await categoriesApi.delete(categoryId);
      toast.success('Category deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleViewQuestions = (categoryId: string) => {
    router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/topics/${topicId}`)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Topic
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="font-medium text-gray-900">{topic?.name}</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="font-medium text-gray-900">{subtopic?.name}</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Layers className="h-4 w-4 mr-1" />
            <span>Categories</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <p className="text-gray-600 mt-1">
                  Manage categories for <span className="font-medium">{subtopic?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Category
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="p-6">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Yet</h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first category for this subtopic.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{category.totalLevels || 0} levels</span>
                          <span>•</span>
                          <span>{category.questionCount || 0} questions</span>
                        </div>
                      </div>
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

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewQuestions(category.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Questions →
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <CategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadData}
        title="Add Category"
        topicId={topicId}
        subtopicId={subtopicId}
      />

      {/* Edit Category Modal */}
      <CategoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
        }}
        onSave={loadData}
        title="Edit Category"
        topicId={topicId}
        subtopicId={subtopicId}
        category={editingCategory}
      />
    </AdminLayout>
  );
}

// Category Modal Component
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  topicId: string;
  subtopicId: string;
  category?: Category | null;
}

function CategoryModal({ isOpen, onClose, onSave, title, topicId, subtopicId, category }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setIsActive(category.isActive || false);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsLoading(true);
    try {
      const categoryData = {
        name: name.trim(),
        description: description.trim(),
        topic_id: topicId,
        subtopic_id: subtopicId,
        isActive,
        order: category?.order ?? 0,
        tags: category?.tags ?? [],
        requirements: category?.requirements ?? []
      };

      if (category?.id) {
        await categoriesApi.update(category.id, categoryData);
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.create(categoryData);
        toast.success('Category created successfully');
      }

      onClose();
      onSave();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category name"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category description (optional)"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
