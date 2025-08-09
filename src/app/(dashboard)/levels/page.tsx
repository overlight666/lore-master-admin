'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, Search, Filter, Target, Users, BookOpen } from 'lucide-react';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

interface Level {
  id: string;
  subtopic_id: string;
  topic_id: string;
  level: number;
  name: string;
  description: string;
  totalQuestions: number;
  passingScore: number;
  isActive: boolean;
  requirements: string[];
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Subtopic {
  id: string;
  name: string;
  topic_id: string;
}

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLevels, setTotalLevels] = useState(0);
  const itemsPerPage = 10;
  
  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Load data with filters
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load topics
      const topicsData = await apiService.get('/admin/topics');
      setTopics(topicsData.items || []);

      // Load subtopics
      const subtopicsData = await apiService.get('/admin/subtopics');
      setSubtopics(subtopicsData.data || []);

      // Build query parameters for levels
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (selectedTopic) {
        params.append('topic_id', selectedTopic);
      }
      
      if (selectedSubtopic) {
        params.append('subtopic_id', selectedSubtopic);
      }
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      // Load levels with filters
      const levelsData = await apiService.get(`/admin/levels?${params}`);
      setLevels(levelsData.data || []);
      setTotalLevels(levelsData.total || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedTopic, selectedSubtopic, debouncedSearchTerm, selectedStatus]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset currentPage when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopic, selectedSubtopic, debouncedSearchTerm, selectedStatus]);

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('Are you sure you want to delete this level? This will also delete all associated questions.')) {
      return;
    }

    try {
      await apiService.delete(`/admin/levels/${levelId}`);
      toast.success('Level deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting level:', error);
      toast.error(error.response?.data?.error || 'Failed to delete level');
    }
  };

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level);
    setShowEditModal(true);
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Unknown Topic';
  };

  const getSubtopicName = (subtopicId: string) => {
    const subtopic = subtopics.find(s => s.id === subtopicId);
    return subtopic?.name || 'Unknown Subtopic';
  };

  const getAvailableSubtopics = () => {
    return selectedTopic 
      ? subtopics.filter(s => s.topic_id === selectedTopic)
      : subtopics;
  };

  const getLevelStats = () => {
    const totalLevels = levels.length;
    const activeLevels = levels.filter(l => l.isActive).length;
    const totalQuestions = levels.reduce((sum, level) => sum + (level.questionCount || 0), 0);
    const avgQuestionsPerLevel = totalLevels > 0 ? Math.round(totalQuestions / totalLevels) : 0;

    return { totalLevels, activeLevels, totalQuestions, avgQuestionsPerLevel };
  };

  const stats = getLevelStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Level Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage difficulty levels for subtopics
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Target className="h-4 w-4 mr-2" />
              Bulk Create
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Level
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Levels</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalLevels}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Levels</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeLevels}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Questions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalQuestions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">Avg</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Questions/Level</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.avgQuestionsPerLevel}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search levels..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setSelectedSubtopic(''); // Reset subtopic when topic changes
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Topics</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
              
              <select
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedTopic}
              >
                <option value="">All Subtopics</option>
                {getAvailableSubtopics().map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="text-sm text-gray-600 flex items-center">
                Showing {levels.length} of {totalLevels} levels
              </div>
            </div>
          </div>
        </div>

        {/* Levels List */}
        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {levels.length === 0 ? (
              <div className="p-6 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No levels found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedTopic || selectedSubtopic || selectedStatus
                    ? 'No levels match your filters.'
                    : 'Get started by creating your first level.'
                  }
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Level
                </button>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topic / Subtopic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passing Score
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
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {level.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Level {level.level} • {level.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getTopicName(level.topic_id)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getSubtopicName(level.subtopic_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {level.questionCount || 0} / {level.totalQuestions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {level.totalQuestions > 0 ? 
                              Math.round(((level.questionCount || 0) / level.totalQuestions) * 100) : 0}% complete
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{level.passingScore}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            level.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {level.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditLevel(level)}
                              className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLevel(level.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
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
            )}
            
            {/* Pagination */}
            {totalLevels > itemsPerPage && levels.length > 0 && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalLevels)} to {Math.min(currentPage * itemsPerPage, totalLevels)} of {totalLevels} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage} of {Math.ceil(totalLevels / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalLevels / itemsPerPage)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Level Modal */}
      <LevelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadData}
        title="Add Level"
        topics={topics}
        subtopics={subtopics}
      />

      {/* Edit Level Modal */}
      <LevelModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLevel(null);
        }}
        onSave={loadData}
        title="Edit Level"
        topics={topics}
        subtopics={subtopics}
        level={editingLevel}
      />

      {/* Bulk Create Modal */}
      <BulkCreateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSave={loadData}
        topics={topics}
        subtopics={subtopics}
      />
    </AdminLayout>
  );
}

// Level Modal Component
interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  topics: Topic[];
  subtopics: Subtopic[];
  level?: Level | null;
}

function LevelModal({ isOpen, onClose, onSave, title, topics, subtopics, level }: LevelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [levelNumber, setLevelNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [passingScore, setPassingScore] = useState(70);
  const [isActive, setIsActive] = useState(true);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (level) {
      setName(level.name);
      setDescription(level.description);
      setTopicId(level.topic_id);
      setSubtopicId(level.subtopic_id);
      setLevelNumber(level.level);
      setTotalQuestions(level.totalQuestions);
      setPassingScore(level.passingScore);
      setIsActive(level.isActive);
      setRequirements(level.requirements || []);
    } else {
      setName('');
      setDescription('');
      setTopicId('');
      setSubtopicId('');
      setLevelNumber(1);
      setTotalQuestions(20);
      setPassingScore(70);
      setIsActive(true);
      setRequirements([]);
    }
  }, [level]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim() || !topicId || !subtopicId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const levelData = {
        name: name.trim(),
        description: description.trim(),
        topic_id: topicId,
        subtopic_id: subtopicId,
        level: levelNumber,
        totalQuestions,
        passingScore,
        isActive,
        requirements
      };

      if (level?.id) {
        await apiService.put(`/admin/levels/${level.id}`, levelData);
        toast.success('Level updated successfully');
      } else {
        await apiService.post('/admin/levels', levelData);
        toast.success('Level created successfully');
      }

      onClose();
      onSave();
    } catch (error: any) {
      console.error('Error saving level:', error);
      toast.error(error.response?.data?.error || 'Failed to save level');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSubtopics = () => {
    return topicId 
      ? subtopics.filter(s => s.topic_id === topicId)
      : subtopics;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="topicId" className="block text-sm font-medium text-gray-700">
                Topic *
              </label>
              <select
                id="topicId"
                value={topicId}
                onChange={(e) => {
                  setTopicId(e.target.value);
                  setSubtopicId(''); // Reset subtopic when topic changes
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              >
                <option value="">Select a topic</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="subtopicId" className="block text-sm font-medium text-gray-700">
                Subtopic *
              </label>
              <select
                id="subtopicId"
                value={subtopicId}
                onChange={(e) => setSubtopicId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading || !topicId}
                required
              >
                <option value="">Select a subtopic</option>
                {getAvailableSubtopics().map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Level Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Level 1, Beginner, Expert"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="levelNumber" className="block text-sm font-medium text-gray-700">
                Level Number *
              </label>
              <input
                type="number"
                id="levelNumber"
                value={levelNumber}
                onChange={(e) => setLevelNumber(parseInt(e.target.value))}
                min="1"
                max="100"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the difficulty and content of this level"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalQuestions" className="block text-sm font-medium text-gray-700">
                Total Questions *
              </label>
              <input
                type="number"
                id="totalQuestions"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                min="1"
                max="1000"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700">
                Passing Score (%) *
              </label>
              <input
                type="number"
                id="passingScore"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                min="0"
                max="100"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (visible to users)
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

// Bulk Create Modal Component
interface BulkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  topics: Topic[];
  subtopics: Subtopic[];
}

function BulkCreateModal({ isOpen, onClose, onSave, topics, subtopics }: BulkCreateModalProps) {
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [totalLevels, setTotalLevels] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicId || !subtopicId) {
      toast.error('Please select both topic and subtopic');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.post(`/admin/levels/bulk/${subtopicId}`, {
        topicId,
        totalLevels
      });
      
      toast.success(`Created ${totalLevels} levels successfully`);
      onClose();
      onSave();
    } catch (error: any) {
      console.error('Error creating levels:', error);
      toast.error(error.response?.data?.error || 'Failed to create levels');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSubtopics = () => {
    return topicId 
      ? subtopics.filter(s => s.topic_id === topicId)
      : subtopics;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Create Levels</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bulkTopicId" className="block text-sm font-medium text-gray-700">
              Topic *
            </label>
            <select
              id="bulkTopicId"
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setSubtopicId(''); // Reset subtopic when topic changes
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select a topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="bulkSubtopicId" className="block text-sm font-medium text-gray-700">
              Subtopic *
            </label>
            <select
              id="bulkSubtopicId"
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading || !topicId}
              required
            >
              <option value="">Select a subtopic</option>
              {getAvailableSubtopics().map(subtopic => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="totalLevels" className="block text-sm font-medium text-gray-700">
              Number of Levels *
            </label>
            <input
              type="number"
              id="totalLevels"
              value={totalLevels}
              onChange={(e) => setTotalLevels(parseInt(e.target.value))}
              min="1"
              max="50"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This will create levels 1 through {totalLevels} for the selected subtopic.
            </p>
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
              {isLoading ? 'Creating...' : `Create ${totalLevels} Levels`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
