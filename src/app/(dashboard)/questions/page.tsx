'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Question, Topic, Subtopic } from '@/types';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

interface Level {
  id: string;
  level: number;
  name: string;
  subtopic_id: string;
}

// Helper function to parse levels response
const parseLevelsResponse = (levelsResponse: any): Level[] => {
  let levelsData = [];
  if (levelsResponse?.data && Array.isArray(levelsResponse.data)) {
    levelsData = levelsResponse.data;
  } else if (levelsResponse?.items && Array.isArray(levelsResponse.items)) {
    levelsData = levelsResponse.items;
  } else if (levelsResponse?.levels && Array.isArray(levelsResponse.levels)) {
    levelsData = levelsResponse.levels;
  } else if (Array.isArray(levelsResponse)) {
    levelsData = levelsResponse;
  }
  return levelsData;
};

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const urlTopic = searchParams?.get('topic');
  const urlSubtopic = searchParams?.get('subtopic');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsByDifficulty, setQuestionsByDifficulty] = useState<{[key: string]: Question[]}>({});
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(urlTopic || '');
  const [selectedSubtopic, setSelectedSubtopic] = useState(urlSubtopic || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedTopic, selectedSubtopic]);

  // Reset selected level when subtopic changes
  useEffect(() => {
    setSelectedLevel('');
  }, [selectedSubtopic]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedTopic, selectedSubtopic, selectedLevel]);

  // Helper function to load all questions across multiple pages
  const loadAllQuestions = async (): Promise<Question[]> => {
    let allQuestions: Question[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (selectedTopic) params.append('topicId', selectedTopic);
        if (selectedSubtopic) params.append('subtopicId', selectedSubtopic);
        params.append('page', currentPage.toString());
        params.append('limit', '100');
        
        const response = await apiService.get(`/admin/questions?${params.toString()}`);
        const questionsData = response?.items || response || [];
        
        if (Array.isArray(questionsData)) {
          allQuestions = [...allQuestions, ...questionsData];
        }
        
        // Update pagination info
        totalPages = response?.totalPages || 1;
        currentPage++;
        
        // Safety break to prevent infinite loops
        if (currentPage > 100) {
          console.warn('Reached maximum page limit (100). There might be an issue with pagination.');
          break;
        }
      } catch (error) {
        console.error(`Error loading questions page ${currentPage}:`, error);
        break;
      }
    } while (currentPage <= totalPages);

    return allQuestions;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all questions with pagination support
      const allQuestions = await loadAllQuestions();
      
      setQuestions(allQuestions);
      
      // Group questions by difficulty (using level property)
      const groupedByDifficulty = allQuestions.reduce((acc: {[key: string]: Question[]}, question: Question) => {
        const difficulty = question.level ? `Level ${question.level}` : 'Unspecified';
        if (!acc[difficulty]) {
          acc[difficulty] = [];
        }
        acc[difficulty].push(question);
        return acc;
      }, {});
      
      setQuestionsByDifficulty(groupedByDifficulty);
      
      // Load topics
      const topicsResponse = await apiService.get('/admin/topics?limit=1000');
      
      // Ensure topics is always an array
      let topicsData = [];
      if (topicsResponse?.data && Array.isArray(topicsResponse.data)) {
        topicsData = topicsResponse.data;
      } else if (topicsResponse?.items && Array.isArray(topicsResponse.items)) {
        topicsData = topicsResponse.items;
      } else if (topicsResponse?.topics && Array.isArray(topicsResponse.topics)) {
        topicsData = topicsResponse.topics;
      } else if (Array.isArray(topicsResponse)) {
        topicsData = topicsResponse;
      }
      setTopics(topicsData);
      
      // Load subtopics if topic is selected
      if (selectedTopic) {
        try {
          const subtopicsResponse = await apiService.get(`/admin/topics/${selectedTopic}/subtopics`);
          
          // Ensure subtopics is always an array
          let subtopicsData = [];
          if (subtopicsResponse?.data && Array.isArray(subtopicsResponse.data)) {
            subtopicsData = subtopicsResponse.data;
          } else if (subtopicsResponse?.items && Array.isArray(subtopicsResponse.items)) {
            subtopicsData = subtopicsResponse.items;
          } else if (subtopicsResponse?.subtopics && Array.isArray(subtopicsResponse.subtopics)) {
            subtopicsData = subtopicsResponse.subtopics;
          } else if (Array.isArray(subtopicsResponse)) {
            subtopicsData = subtopicsResponse;
          }
          
          setSubtopics(subtopicsData);
        } catch (error) {
          console.error('Error loading subtopics:', error);
          setSubtopics([]);
        }
      } else {
        setSubtopics([]);
      }

      // Load levels based on selected subtopic or all levels
      try {
        const levelsParams = new URLSearchParams();
        if (selectedSubtopic) levelsParams.append('subtopicId', selectedSubtopic);
        
        const levelsQueryString = levelsParams.toString();
        const levelsUrl = `/admin/levels${levelsQueryString ? `?${levelsQueryString}` : ''}`;
        
        const levelsResponse = await apiService.get(levelsUrl);
        
        // Use helper function to parse response
        const levelsData = parseLevelsResponse(levelsResponse);
        setLevels(levelsData);
      } catch (error) {
        console.error('Error loading levels:', error);
        setLevels([]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
      setQuestions([]);
      setQuestionsByDifficulty({});
      setTopics([]);
      setSubtopics([]);
      setLevels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.correctAnswer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTopic) {
      filtered = filtered.filter(q => q.topic_id === selectedTopic);
    }
    
    if (selectedSubtopic) {
      filtered = filtered.filter(q => q.subtopic_id === selectedSubtopic);
    }    if (selectedLevel) {
      filtered = filtered.filter(q => q.level === parseInt(selectedLevel));
    }

    setFilteredQuestions(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await apiService.delete(`/admin/questions/${id}`);
      toast.success('Question deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Unknown';
  };

  const getSubtopicName = (subtopicId: string) => {
    const subtopic = subtopics.find(s => s.id === subtopicId);
    return subtopic?.name || 'Unknown';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSelectedLevel('');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage quiz questions and answers
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
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
              {Array.isArray(topics) && topics.map(topic => (
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
              {subtopics
                .filter(subtopic => !selectedTopic || subtopic.topic_id === selectedTopic)
                .map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                ))}
            </select>
            
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedSubtopic}
            >
              <option value="">All Levels</option>
              {Array.isArray(levels) && levels
                .filter((level, index, self) => 
                  index === self.findIndex(l => l.level === level.level)
                )
                .sort((a, b) => a.level - b.level)
                .map(level => (
                  <option key={level.id} value={level.level.toString()}>
                    Level {level.level} - {level.name}
                  </option>
                ))}
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </div>
        </div>

        {/* Questions List */}
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
            {filteredQuestions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  {searchTerm || selectedTopic || selectedSubtopic || selectedLevel
                    ? 'No questions match your filters.'
                    : 'No questions found. Create your first question!'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Show grouped view when filtering by topic/subtopic */}
                {(urlTopic || urlSubtopic) && Object.keys(questionsByDifficulty).length > 0 ? (
                  <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Questions grouped by difficulty level
                      </h3>
                      <div className="text-sm text-gray-600">
                        {questions.length} total questions
                      </div>
                    </div>
                    
                    {Object.entries(questionsByDifficulty)
                      .sort(([a], [b]) => {
                        // Sort by level number (extract number from "Level X" format)
                        const aNum = parseInt(a.replace('Level ', '')) || 999;
                        const bNum = parseInt(b.replace('Level ', '')) || 999;
                        return aNum - bNum;
                      })
                      .map(([difficulty, difficultyQuestions]) => (
                        <div key={difficulty} className="border border-gray-200 rounded-lg">
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="text-md font-medium text-gray-900">
                                {difficulty}
                              </h4>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {difficultyQuestions.length} questions
                              </span>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-gray-100">
                            {difficultyQuestions.map((question) => (
                              <div key={question.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                      {question.question}
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>Topic: {getTopicName(question.topic_id)}</span>
                                      <span>•</span>
                                      <span>Subtopic: {getSubtopicName(question.subtopic_id)}</span>
                                      {question.attempts && (
                                        <>
                                          <span>•</span>
                                          <span>{question.attempts} attempts</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => handleEdit(question)}
                                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(question.id)}
                                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  /* Regular table view */
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Question
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Topic / Subtopic
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Correct Answer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attempts
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredQuestions.map((question) => (
                          <tr key={question.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {question.question}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getTopicName(question.topic_id)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {getSubtopicName(question.subtopic_id)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.level <= 3 ? 'bg-green-100 text-green-800' :
                                question.level <= 6 ? 'bg-yellow-100 text-yellow-800' :
                                question.level <= 8 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                Level {question.level}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {question.correctAnswer}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {question.attempts || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleEdit(question)}
                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(question.id)}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      <QuestionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadData}
        title="Add Question"
        topics={topics}
        subtopics={subtopics}
      />

      {/* Edit Question Modal */}
      <QuestionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingQuestion(null);
        }}
        onSave={loadData}
        title="Edit Question"
        topics={topics}
        subtopics={subtopics}
        question={editingQuestion}
      />
    </AdminLayout>
  );
}

// Question Modal Component
interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  topics: Topic[];
  subtopics: Subtopic[];
  question?: Question | null;
}

function QuestionModal({ isOpen, onClose, onSave, title, topics, subtopics, question }: QuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [level, setLevel] = useState(1);
  const [levels, setLevels] = useState<any[]>([]);
  const [levelId, setLevelId] = useState('');
  const [modalSubtopics, setModalSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize modal subtopics with the passed subtopics
  useEffect(() => {
    setModalSubtopics(subtopics);
  }, [subtopics]);

  useEffect(() => {
    if (question) {
      setQuestionText(question.question);
      // Handle both choices and options for backward compatibility
      const questionChoices = question.choices || question.options || ['', '', '', ''];
      setOptions(questionChoices);
      setCorrectAnswer(question.correctAnswer);
      setExplanation(question.explanation || '');
      setTopicId(question.topic_id);
      setSubtopicId(question.subtopic_id);
      setLevel(question.level);
      setLevelId(question.level_id || '');
    } else {
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('');
      setExplanation('');
      setTopicId('');
      setSubtopicId('');
      setLevel(1);
      setLevelId('');
      setLevels([]);
    }
  }, [question]);

  // Load subtopics when topic changes
  useEffect(() => {
    const loadSubtopics = async () => {
      if (topicId) {
        try {
          const subtopicsResponse = await apiService.get(`/admin/topics/${topicId}/subtopics`);
          // Handle different response formats
          let subtopicsData = [];
          if (subtopicsResponse?.data && Array.isArray(subtopicsResponse.data)) {
            subtopicsData = subtopicsResponse.data;
          } else if (subtopicsResponse?.items && Array.isArray(subtopicsResponse.items)) {
            subtopicsData = subtopicsResponse.items;
          } else if (subtopicsResponse?.subtopics && Array.isArray(subtopicsResponse.subtopics)) {
            subtopicsData = subtopicsResponse.subtopics;
          } else if (Array.isArray(subtopicsResponse)) {
            subtopicsData = subtopicsResponse;
          }
          
          // Update the modal's local subtopics state
          setModalSubtopics(subtopicsData);
        } catch (error) {
          console.error('Error loading subtopics for modal:', error);
          setModalSubtopics([]);
        }
      }
    };

    loadSubtopics();
  }, [topicId]);

  // Load levels when subtopic changes
  useEffect(() => {
    const loadLevels = async () => {
      if (subtopicId) {
        try {
          const levelsResponse = await apiService.get(`/admin/levels?subtopicId=${subtopicId}`);
          
          // Use helper function to parse response
          const levelsData = parseLevelsResponse(levelsResponse);
          setLevels(levelsData);
          
          // If editing a question with level_id, set it after levels are loaded
          if (question && question.level_id && levelsData.length > 0) {
            const foundLevel = levelsData.find((l: any) => l.id === question.level_id);
            if (foundLevel) {
              setLevelId(foundLevel.id);
            }
          }
        } catch (error) {
          console.error('Error loading levels:', error);
          setLevels([]);
        }
      } else {
        setLevels([]);
        setLevelId('');
      }
    };

    loadLevels();
  }, [subtopicId, question]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim() || !topicId || !subtopicId || !correctAnswer.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (options.some(option => !option.trim())) {
      toast.error('Please fill in all answer options');
      return;
    }

    if (!options.includes(correctAnswer)) {
      toast.error('Correct answer must be one of the options');
      return;
    }

    setIsLoading(true);
    try {
      // Determine difficulty based on level
      const difficulty = level <= 2 ? 'easy' : level >= 5 ? 'hard' : 'medium';
      
      // Create level_id if not provided (for new questions)
      const finalLevelId = levelId || `level_${level}_${subtopicId}`;

      const questionData = {
        question: questionText.trim(),
        choices: options.map(opt => opt.trim()),
        correctAnswer: correctAnswer.trim(),
        explanation: explanation.trim(),
        topic_id: topicId,
        subtopic_id: subtopicId,
        level_id: finalLevelId,
        difficulty
      };

      if (question?.id) {
        await apiService.put(`/admin/questions/${question.id}`, questionData);
        toast.success('Question updated successfully');
      } else {
        await apiService.post('/admin/questions', questionData);
        toast.success('Question created successfully');
      }

      onClose();
      onSave();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableSubtopics = Array.isArray(modalSubtopics) ? modalSubtopics.filter(s => s.topic_id === topicId) : [];

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
                  setLevelId(''); // Reset level when topic changes
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              >
                <option value="">Select a topic</option>
                {Array.isArray(topics) && topics.map(topic => (
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
                {Array.isArray(availableSubtopics) && availableSubtopics.map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="levelId" className="block text-sm font-medium text-gray-700">
              Level (Optional - will be auto-created if not selected)
            </label>
            <select
              id="levelId"
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading || !subtopicId}
            >
              <option value="">Auto-create level {level}</option>
              {levels.map((levelOption: any) => (
                <option key={levelOption.id} value={levelOption.id}>
                  {levelOption.name || `Level ${levelOption.level}`}
                </option>
              ))}
            </select>
            {levels.length === 0 && subtopicId && (
              <p className="mt-1 text-sm text-gray-500">
                No existing levels found. A new level will be created automatically.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              Level Number *
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(levelNum => (
                <option key={levelNum} value={levelNum}>
                  Level {levelNum} ({levelNum <= 2 ? 'Easy' : levelNum >= 5 ? 'Hard' : 'Medium'})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">
              Question *
            </label>
            <textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the question"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options *
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Option ${index + 1}`}
                  disabled={isLoading}
                  required
                />
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="correctAnswer" className="block text-sm font-medium text-gray-700">
              Correct Answer *
            </label>
            <select
              id="correctAnswer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select the correct answer</option>
              {options.filter(opt => opt.trim()).map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
              Explanation (Optional)
            </label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why this is the correct answer"
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
