'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { levelsApi, topicsApi, subtopicsApi, categoriesApi } from '@/services/api';
import { Level, Topic, Subtopic, Category, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Target,
  BookOpen,
  ChevronRight,
  Layers
} from 'lucide-react';

export default function LevelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [levels, setLevels] = useState<Level[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(searchParams?.get('topicId') || '');
  const [selectedSubtopic, setSelectedSubtopic] = useState(searchParams?.get('subtopicId') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('categoryId') || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams?.get('level') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const limit = 10;

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const params: any = { 
        page: currentPage, 
        limit,
        search: searchTerm || undefined
      };
      
      // Use correct parameter names with underscores
      if (selectedTopic) params.topic_id = selectedTopic;
      if (selectedSubtopic) params.subtopic_id = selectedSubtopic;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedLevel) params.level = selectedLevel;

      const response: PaginatedResponse<Level> = await levelsApi.getAll(params);
      // Handle both response formats - some APIs return 'data', others return 'items'
      const levelsData = response.items || response.data || [];
      setLevels(levelsData);
      setTotal(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / limit));
    } catch (error) {
      console.error('Failed to fetch levels:', error);
      setLevels([]); // Set empty array on error to prevent crashes
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
      setTopics([]); // Set empty array on error to prevent crashes
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
      setSubtopics([]); // Set empty array on error to prevent crashes
    }
  };

  const fetchCategories = async () => {
    try {
      const params: any = { limit: 100 };
      if (selectedTopic) params.topic_id = selectedTopic;
      if (selectedSubtopic) params.subtopic_id = selectedSubtopic;
      
      const response = await categoriesApi.getAll(params);
      // Handle both response formats - some APIs return 'data', others return 'items'
      const categoriesData = response.items || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]); // Set empty array on error to prevent crashes
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchSubtopics();
    setSelectedSubtopic('');
    setSelectedCategory('');
  }, [selectedTopic]);

  useEffect(() => {
    fetchCategories();
    setSelectedCategory('');
  }, [selectedTopic, selectedSubtopic]);

  useEffect(() => {
    fetchLevels();
  }, [currentPage, searchTerm, selectedTopic, selectedSubtopic, selectedCategory, selectedLevel]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;
    
    try {
      await levelsApi.delete(id);
      fetchLevels();
    } catch (error) {
      console.error('Failed to delete level:', error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await levelsApi.toggleStatus(id);
      fetchLevels();
    } catch (error) {
      console.error('Failed to toggle level status:', error);
    }
  };

  const getTopicName = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.name || 'Unknown Topic';
  };

  const getSubtopicName = (subtopicId: string) => {
    return subtopics.find(s => s.id === subtopicId)?.name || 'Unknown Subtopic';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown Category';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Levels</h1>
            <p className="text-gray-600 mt-1">Manage levels within categories</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Level
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Levels</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search levels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>

            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedTopic}
            >
              <option value="">All Subtopics</option>
              {subtopics.map(subtopic => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedSubtopic}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {[1, 2, 3, 4, 5].map(levelNum => (
                <option key={levelNum} value={levelNum.toString()}>Level {levelNum}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTopic('');
                setSelectedSubtopic('');
                setSelectedCategory('');
                setSelectedLevel('');
                setCurrentPage(1);
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Levels Table */}
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
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hierarchy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions
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
                    {levels.map((level) => (
                      <tr key={level.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Target className="h-6 w-6 text-green-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Level {level.level}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {level.name || level.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {getTopicName(level.topic_id)}
                            <ChevronRight className="h-4 w-4 mx-1" />
                            {getSubtopicName(level.subtopic_id)}
                            <ChevronRight className="h-4 w-4 mx-1" />
                            <Layers className="h-4 w-4 mr-1" />
                            {getCategoryName(level.category_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {level.totalQuestions || 0} total
                          </div>
                          <div className="text-sm text-gray-500">
                            Pass: {level.passingScore || 80}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              level.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {level.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/levels/${level.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLevel(level);
                                setShowEditModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(level.id)}
                              className={`${
                                level.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                              }`}
                              title={level.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {level.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(level.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

      {/* Edit Level Modal */}
      {showEditModal && editingLevel && (
        <EditLevelModal
          level={editingLevel}
          topics={topics}
          subtopics={subtopics}
          categories={categories}
          existingLevels={levels}
          onClose={() => {
            setShowEditModal(false);
            setEditingLevel(null);
          }}
          onSave={(updatedLevel: Level) => {
            // Update the level in the list
            setLevels(prevLevels => 
              prevLevels.map(level => 
                level.id === updatedLevel.id ? updatedLevel : level
              )
            );
            setShowEditModal(false);
            setEditingLevel(null);
          }}
        />
      )}

      {/* Create Level Modal */}
      {showCreateModal && (
        <CreateLevelModal
          topics={topics}
          subtopics={subtopics}
          categories={categories}
          existingLevels={levels}
          onClose={() => setShowCreateModal(false)}
          onSave={(newLevel: Level) => {
            setLevels(prevLevels => [...prevLevels, newLevel]);
            setShowCreateModal(false);
            setTotal(prevTotal => prevTotal + 1);
          }}
        />
      )}
    </AdminLayout>
  );
}

// Edit Level Modal Component
interface EditLevelModalProps {
  level: Level;
  topics: Topic[];
  subtopics: Subtopic[];
  categories: Category[];
  existingLevels: Level[];
  onClose: () => void;
  onSave: (updatedLevel: Level) => void;
}

function EditLevelModal({ level, topics, subtopics, categories, existingLevels, onClose, onSave }: EditLevelModalProps) {
  const [formData, setFormData] = useState({
    level: level.level.toString(),
    name: level.name || '',
    description: level.description || '',
    totalQuestions: level.totalQuestions.toString(),
    passingScore: level.passingScore.toString(),
    isActive: level.isActive,
    topic_id: level.topic_id,
    subtopic_id: level.subtopic_id,
    category_id: level.category_id,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateLevelUniqueness = (categoryId: string, levelNumber: number) => {
    // Allow the current level to keep its number, but check for conflicts with others
    return !existingLevels.some(existingLevel => 
      existingLevel.category_id === categoryId && 
      existingLevel.level === levelNumber &&
      existingLevel.id !== level.id  // Exclude current level from check
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setIsLoading(true);

    const levelNumber = parseInt(formData.level);
    
    // Validate level uniqueness within the category
    if (!validateLevelUniqueness(formData.category_id, levelNumber)) {
      setValidationError(`Level ${levelNumber} already exists for this category. Each level must be unique within a category.`);
      setIsLoading(false);
      return;
    }

    try {
      const updatedLevel = await levelsApi.update(level.id, {
        level: parseInt(formData.level),
        name: formData.name,
        description: formData.description,
        totalQuestions: parseInt(formData.totalQuestions),
        passingScore: parseInt(formData.passingScore),
        isActive: formData.isActive,
        topic_id: formData.topic_id,
        subtopic_id: formData.subtopic_id,
        category_id: formData.category_id,
      });

      toast.success('Level updated successfully');
      onSave(updatedLevel);
    } catch (error: any) {
      console.error('Error updating level:', error);
      if (error.message?.includes('already exists')) {
        setValidationError('This level already exists for the selected category. Each level must be unique within a category.');
      } else {
        toast.error('Failed to update level');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user makes changes
    if (validationError) setValidationError('');
  };

  const filteredSubtopics = subtopics.filter(s => s.topic_id === formData.topic_id);
  const filteredCategories = categories.filter(c => c.subtopic_id === formData.subtopic_id);

  // Get existing levels for the selected category to show what's already taken
  const existingLevelsForCategory = formData.category_id 
    ? existingLevels.filter(existingLevel => 
        existingLevel.category_id === formData.category_id && existingLevel.id !== level.id
      ).map(existingLevel => existingLevel.level)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Level</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}

        {/* Show existing levels for selected category */}
        {formData.category_id && existingLevelsForCategory.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Other levels for this category:</strong> {existingLevelsForCategory.sort((a, b) => a - b).join(', ')}
            </p>
            <p className="text-xs text-yellow-600">
              Make sure your level number doesn't conflict with existing ones.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <select
              value={formData.topic_id}
              onChange={(e) => {
                handleInputChange('topic_id', e.target.value);
                handleInputChange('subtopic_id', '');
                handleInputChange('category_id', '');
              }}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>

          {/* Subtopic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtopic *
            </label>
            <select
              value={formData.subtopic_id}
              onChange={(e) => {
                handleInputChange('subtopic_id', e.target.value);
                handleInputChange('category_id', '');
              }}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.topic_id}
              required
            >
              <option value="">Select Subtopic</option>
              {filteredSubtopics.map(subtopic => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.subtopic_id}
              required
            >
              <option value="">Select Category</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Level Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level Number *
              </label>
              <input
                type="number"
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
                required
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%) *
              </label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={(e) => handleInputChange('passingScore', e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Questions *
              </label>
              <input
                type="number"
                value={formData.totalQuestions}
                onChange={(e) => handleInputChange('totalQuestions', e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isActive}
                    onChange={() => handleInputChange('isActive', true)}
                    className="mr-2"
                  />
                  Active
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isActive}
                    onChange={() => handleInputChange('isActive', false)}
                    className="mr-2"
                  />
                  Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional level name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Level'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Level Modal Component
interface CreateLevelModalProps {
  topics: Topic[];
  subtopics: Subtopic[];
  categories: Category[];
  existingLevels: Level[];
  onClose: () => void;
  onSave: (newLevel: Level) => void;
}

function CreateLevelModal({ topics, subtopics, categories, existingLevels, onClose, onSave }: CreateLevelModalProps) {
  const [formData, setFormData] = useState({
    level: '',
    name: '',
    description: '',
    totalQuestions: '10',
    passingScore: '80',
    isActive: true,
    topic_id: '',
    subtopic_id: '',
    category_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateLevelUniqueness = (categoryId: string, levelNumber: number) => {
    return !existingLevels.some(level => 
      level.category_id === categoryId && level.level === levelNumber
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setIsLoading(true);

    const levelNumber = parseInt(formData.level);
    
    // Validate required fields
    if (!formData.topic_id || !formData.subtopic_id || !formData.category_id || !formData.level) {
      setValidationError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    // Validate level uniqueness within the category
    if (!validateLevelUniqueness(formData.category_id, levelNumber)) {
      setValidationError(`Level ${levelNumber} already exists for this category. Each level must be unique within a category.`);
      setIsLoading(false);
      return;
    }

    try {
      const newLevel = await levelsApi.create({
        level: levelNumber,
        name: formData.name || undefined,
        description: formData.description || undefined,
        totalQuestions: parseInt(formData.totalQuestions),
        passingScore: parseInt(formData.passingScore),
        isActive: formData.isActive,
        topic_id: formData.topic_id,
        subtopic_id: formData.subtopic_id,
        category_id: formData.category_id,
      });

      toast.success('Level created successfully');
      onSave(newLevel);
    } catch (error: any) {
      console.error('Error creating level:', error);
      if (error.message?.includes('already exists')) {
        setValidationError('This level already exists for the selected category. Each level must be unique within a category.');
      } else {
        toast.error('Failed to create level');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user makes changes
    if (validationError) setValidationError('');
  };

  const filteredSubtopics = subtopics.filter(s => s.topic_id === formData.topic_id);
  const filteredCategories = categories.filter(c => c.subtopic_id === formData.subtopic_id);

  // Get existing levels for the selected category to show what's already taken
  const existingLevelsForCategory = formData.category_id 
    ? existingLevels.filter(level => level.category_id === formData.category_id).map(level => level.level)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Level</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <select
              value={formData.topic_id}
              onChange={(e) => {
                handleInputChange('topic_id', e.target.value);
                handleInputChange('subtopic_id', '');
                handleInputChange('category_id', '');
              }}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>

          {/* Subtopic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtopic *
            </label>
            <select
              value={formData.subtopic_id}
              onChange={(e) => {
                handleInputChange('subtopic_id', e.target.value);
                handleInputChange('category_id', '');
              }}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.topic_id}
              required
            >
              <option value="">Select Subtopic</option>
              {filteredSubtopics.map(subtopic => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.subtopic_id}
              required
            >
              <option value="">Select Category</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Show existing levels for selected category */}
          {formData.category_id && existingLevelsForCategory.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Existing levels for this category:</strong> {existingLevelsForCategory.sort((a, b) => a - b).join(', ')}
              </p>
              <p className="text-xs text-yellow-600">
                Choose a level number that isn't already used.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Level Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level Number *
              </label>
              <input
                type="number"
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
                required
                placeholder="e.g. 1, 2, 3..."
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%) *
              </label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={(e) => handleInputChange('passingScore', e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Questions *
              </label>
              <input
                type="number"
                value={formData.totalQuestions}
                onChange={(e) => handleInputChange('totalQuestions', e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isActive}
                    onChange={() => handleInputChange('isActive', true)}
                    className="mr-2"
                  />
                  Active
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isActive}
                    onChange={() => handleInputChange('isActive', false)}
                    className="mr-2"
                  />
                  Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional level name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Level'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
