'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { questionsApi, categoriesApi, topicsApi, subtopicsApi, levelsApi } from '@/services/api';
import { Question, Topic, Subtopic, Category, Level } from '@/types';
import { ArrowLeft, BookOpen, ChevronRight, Layers, HelpCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params?.id as string;
  const subtopicId = params?.subtopicId as string;
  const categoryId = params?.categoryId as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    correctAnswer: '',
    choices: ['', '', '', ''], // Will include correct answer + wrong answers
    explanation: '',
    level_id: '', // Add level_id field
    tags: [] as string[],
    estimatedTime: 60,
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, [topicId, subtopicId, categoryId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [topicRes, subtopicRes, categoryRes, levelsRes] = await Promise.all([
        topicsApi.getById(topicId),
        subtopicsApi.getById(subtopicId),
        categoriesApi.getById(categoryId),
        levelsApi.getAll({ category_id: categoryId, limit: 100 })
      ]);

      setTopic(topicRes);
      setSubtopic(subtopicRes);
      setCategory(categoryRes);
      setLevels(levelsRes.data || []);
      
      // If no levels exist, create some default levels
      if (!levelsRes.data || levelsRes.data.length === 0) {
        await createDefaultLevels();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultLevels = async () => {
    try {
      const defaultLevels = [
        { level: 1, name: 'Beginner', totalQuestions: 10, passingScore: 70 },
        { level: 2, name: 'Intermediate', totalQuestions: 15, passingScore: 75 },
        { level: 3, name: 'Advanced', totalQuestions: 20, passingScore: 80 },
      ];

      const createdLevels = [];
      for (const levelData of defaultLevels) {
        try {
          const level = await levelsApi.create({
            topic_id: topicId,
            subtopic_id: subtopicId,
            category_id: categoryId,
            ...levelData,
            isActive: true
          });
          createdLevels.push(level);
        } catch (error) {
          // Skip failed level creation
        }
      }
      
      if (createdLevels.length > 0) {
        setLevels(createdLevels);
        toast.success(`Created ${createdLevels.length} default levels`);
      }
    } catch (error) {
      toast.error('Failed to create default levels');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation similar to bulk import
    const actualChoices = formData.choices.slice(1).filter(choice => choice.trim() !== '');
    
    // Basic field validation
    if (!formData.question.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    if (!formData.level_id.trim()) {
      toast.error('Please select a level');
      return;
    }
    
    if (!formData.correctAnswer.trim()) {
      toast.error('Correct answer is required');
      return;
    }
    
    if (actualChoices.length < 2) {
      toast.error('At least 2 additional choices are required');
      return;
    }
    
    // Validate correct answer is in choices
    const allChoices = [formData.correctAnswer, ...actualChoices];
    if (!allChoices.includes(formData.correctAnswer)) {
      toast.error('Correct answer must be one of the provided choices');
      return;
    }
    
    // Check for duplicates in existing questions
    try {
      const existingQuestions = await questionsApi.getAll({ 
        topicId, 
        subtopicId, 
        categoryId, 
        page: 1,
        limit: 1000  // For duplication checking, we might need all questions
      });
      
      let questionsArray: any[] = [];
      if (existingQuestions?.data && Array.isArray(existingQuestions.data)) {
        questionsArray = existingQuestions.data;
      } else if (existingQuestions?.items && Array.isArray(existingQuestions.items)) {
        questionsArray = existingQuestions.items;
      } else if (Array.isArray(existingQuestions)) {
        questionsArray = existingQuestions;
      }
      
      const existingQuestionTexts = questionsArray.map(q => q.question?.toLowerCase().trim()).filter(Boolean);
      const currentQuestionText = formData.question.toLowerCase().trim();
      
      if (existingQuestionTexts.includes(currentQuestionText)) {
        toast.error('A question with the same text already exists in this category');
        return;
      }
      
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      // Continue with creation if duplicate check fails
    }

    try {
      setIsSubmitting(true);
      
      // Get the selected level information
      const selectedLevel = levels.find(level => level.id === formData.level_id);
      
      await questionsApi.create({
        topic_id: topicId,
        subtopic_id: subtopicId,
        category_id: categoryId,
        level_id: formData.level_id,
        question: formData.question,
        choices: allChoices,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation,
        difficulty: selectedLevel?.level || 1, // Use the level's number as difficulty
        tags: formData.tags,
        estimatedTime: formData.estimatedTime,
        isActive: formData.isActive
      });
      
      toast.success('Question created successfully');
      router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions`);
    } catch (error: any) {
      console.error('Create question error:', error);
      toast.error('Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...formData.choices];
    newChoices[index] = value;
    setFormData(prev => ({ ...prev, choices: newChoices }));
  };

  const addChoice = () => {
    if (formData.choices.length < 6) {
      setFormData(prev => ({ 
        ...prev, 
        choices: [...prev.choices, ''] 
      }));
    }
  };

  const removeChoice = (index: number) => {
    if (formData.choices.length > 3) {
      const newChoices = formData.choices.filter((_: string, i: number) => i !== index);
      setFormData(prev => ({ ...prev, choices: newChoices }));
    }
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
              onClick={() => router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions`)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Questions
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
            <span className="font-medium text-gray-900">{category?.name}</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <HelpCircle className="h-4 w-4 mr-1" />
            <span>Create Question</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-bold text-gray-900">Create Question</h1>
              <p className="text-gray-600 mt-1">
                Add a new question to <span className="font-medium">{category?.name}</span>
              </p>
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question *
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => handleInputChange('question', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the question..."
                required
              />
            </div>

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <input
                type="text"
                value={formData.correctAnswer}
                onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the correct answer..."
                required
              />
            </div>

            {/* Wrong Answers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Other Answer Choices * (at least 2 additional choices required)
                </label>
                {formData.choices.length < 6 && (
                  <button
                    type="button"
                    onClick={addChoice}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Choice
                  </button>
                )}
              </div>
              {formData.choices.slice(1).map((choice, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index + 1, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Choice ${index + 2}...`}
                  />
                  {formData.choices.length > 3 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(index + 1)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.level_id}
                  onChange={(e) => handleInputChange('level_id', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    {levels.length === 0 ? 'No levels available - create levels first' : 'Select a level'}
                  </option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.level} - {level.name || `${level.totalQuestions} questions`}
                    </option>
                  ))}
                </select>
                {levels.length === 0 && (
                  <button
                    type="button"
                    onClick={createDefaultLevels}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                    disabled={isLoading}
                  >
                    Create Levels
                  </button>
                )}
              </div>
              {levels.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No levels found for this category. Click "Create Levels" to add default levels.
                </p>
              )}
            </div>

            {/* Estimated Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.estimatedTime}
                  onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (optional)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => handleInputChange('explanation', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain why this is the correct answer..."
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (question will be available for quizzes)
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions`)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Question'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
