'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, HelpCircle } from 'lucide-react';
import { Topic, Subtopic } from '@/types';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);

  useEffect(() => {
    if (topicId) {
      loadTopicData();
    }
  }, [topicId]);

  const loadTopicData = async () => {
    setIsLoading(true);
    try {
      const [topicData, subtopicsData] = await Promise.all([
        apiService.get(`/admin/topics/${topicId}`),
        apiService.get(`/admin/topics/${topicId}/subtopics`)
      ]);
      
      // Handle topic data - it might be nested in a topic property
      if (topicData?.topic) {
        setTopic(topicData.topic);
      } else {
        setTopic(topicData);
      }
      
      // Handle subtopics data - it comes paginated with items property
      if (subtopicsData?.items && Array.isArray(subtopicsData.items)) {
        setSubtopics(subtopicsData.items);
      } else if (Array.isArray(subtopicsData)) {
        setSubtopics(subtopicsData);
      } else {
        setSubtopics([]);
      }
    } catch (error: any) {
      console.error('Error loading topic data:', error);
      toast.error('Failed to load topic data');
      // Don't redirect on error, just show empty state
      setTopic(null);
      setSubtopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubtopic = async (subtopicId: string) => {
    if (!confirm('Are you sure you want to delete this subtopic? This will also delete all associated questions.')) {
      return;
    }

    try {
      await apiService.delete(`/subtopics/${subtopicId}`);
      toast.success('Subtopic deleted successfully');
      loadTopicData();
    } catch (error: any) {
      console.error('Error deleting subtopic:', error);
      toast.error('Failed to delete subtopic');
    }
  };

  const handleEditSubtopic = (subtopic: Subtopic) => {
    setEditingSubtopic(subtopic);
    setShowEditModal(true);
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

  if (!topic) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Topic not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/topics')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Topics
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{topic.description}</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subtopic
            </button>
          </div>
        </div>

        {/* Topic Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Subtopics
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subtopics && Array.isArray(subtopics) ? subtopics.length : 0}
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
                  <HelpCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Questions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subtopics && Array.isArray(subtopics) ? 
                        subtopics.reduce((total, subtopic) => total + (subtopic.questionCount || 0), 0) 
                        : 0}
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
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">%</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Questions/Subtopic
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subtopics && Array.isArray(subtopics) && subtopics.length > 0 ? 
                        Math.round(subtopics.reduce((total, subtopic) => total + (subtopic.questionCount || 0), 0) / subtopics.length) 
                        : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtopics List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Subtopics</h3>
          </div>
          
          {subtopics && subtopics.length === 0 ? (
            <div className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subtopics yet</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first subtopic for this topic.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subtopic
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {subtopics && Array.isArray(subtopics) && subtopics.map((subtopic) => (
                <div key={subtopic.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">
                          {subtopic.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {subtopic.questionCount || 0} questions
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{subtopic.description}</p>
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/topics/${topicId}/subtopics/${subtopic.id}`)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View Questions
                      </button>
                      <button
                        onClick={() => handleEditSubtopic(subtopic)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubtopic(subtopic.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
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

      {/* Add Subtopic Modal */}
      <SubtopicModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadTopicData}
        title="Add Subtopic"
        topicId={topicId}
      />

      {/* Edit Subtopic Modal */}
      <SubtopicModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSubtopic(null);
        }}
        onSave={loadTopicData}
        title="Edit Subtopic"
        topicId={topicId}
        subtopic={editingSubtopic}
      />
    </AdminLayout>
  );
}

// Subtopic Modal Component
interface SubtopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  topicId: string;
  subtopic?: Subtopic | null;
}

function SubtopicModal({ isOpen, onClose, onSave, title, topicId, subtopic }: SubtopicModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subtopic) {
      setName(subtopic.name);
      setDescription(subtopic.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [subtopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const subtopicData = {
        name: name.trim(),
        description: description.trim(),
        topicId,
      };

      if (subtopic?.id) {
        await apiService.put(`/subtopics/${subtopic.id}`, subtopicData);
        toast.success('Subtopic updated successfully');
      } else {
        await apiService.post('/subtopics', subtopicData);
        toast.success('Subtopic created successfully');
      }

      onClose();
      onSave();
    } catch (error: any) {
      console.error('Error saving subtopic:', error);
      toast.error('Failed to save subtopic');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter subtopic name"
              disabled={isLoading}
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
              placeholder="Enter subtopic description"
              disabled={isLoading}
            />
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
