'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Topic, Subtopic, Category, Question } from '@/types';
import { topicsApi, subtopicsApi, categoriesApi, questionsApi, levelsApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.id as string;
  const subtopicId = params?.subtopicId as string;
  const categoryId = params?.categoryId as string;
  const questionId = params?.questionId as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [levelId, setLevelId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (topicId && subtopicId && categoryId && questionId) {
      loadData();
    }
  }, [topicId, subtopicId, categoryId, questionId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [topicData, subtopicData, categoryData, questionData, levelsData] = await Promise.all([
        topicsApi.getById(topicId),
        subtopicsApi.getById(subtopicId),
        categoriesApi.getById(categoryId),
        questionsApi.getById(questionId),
        levelsApi.getAll({ category_id: categoryId, limit: 100 })
      ]);
      
      setTopic(topicData);
      setSubtopic(subtopicData);
      setCategory(categoryData);
      setQuestion(questionData);
      setLevels(levelsData.data || []);
      
      // Populate form with existing question data
      if (questionData) {
        setQuestionText(questionData.question || '');
        setChoices(questionData.choices || questionData.options || ['', '', '', '']);
        setCorrectAnswer(questionData.correctAnswer || '');
        setExplanation(questionData.explanation || '');
        setLevelId(questionData.level_id || '');
        setTags([]); // Default since not in Question type
        setEstimatedTime(30); // Default since not in Question type
        setIsActive(true); // Default since not in Question type
      }
      
    } catch (error: any) {
      console.error('Load data error:', error);
      toast.error('Failed to load question data');
      router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleSave = async () => {
    // Validation
    if (!questionText.trim()) {
      toast.error('Question text is required');
      return;
    }

    const validChoices = choices.filter(choice => choice.trim());
    if (validChoices.length < 2) {
      toast.error('At least 2 choices are required');
      return;
    }

    if (!correctAnswer.trim()) {
      toast.error('Correct answer is required');
      return;
    }

    if (!levelId) {
      toast.error('Please select a level');
      return;
    }

    if (!validChoices.includes(correctAnswer)) {
      toast.error('Correct answer must be one of the provided choices');
      return;
    }

    setIsSaving(true);
    try {
      // Get the selected level information
      const selectedLevel = levels.find(level => level.id === levelId);
      
      const questionData = {
        level_id: levelId,
        category_id: categoryId,
        subtopic_id: subtopicId,
        topic_id: topicId,
        question: questionText,
        choices: validChoices,
        correctAnswer,
        explanation,
        difficulty: selectedLevel?.level || 1, // Use the level's number as difficulty
        tags,
        estimatedTime,
        isActive
      };

      await questionsApi.update(questionId, questionData);
      toast.success('Question updated successfully');
      router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions`);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
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
              onClick={handleCancel}
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
            <span className="font-medium text-gray-900">{topic?.name}</span>
            <span className="mx-2">→</span>
            <span className="font-medium text-gray-900">{subtopic?.name}</span>
            <span className="mx-2">→</span>
            <span className="font-medium text-gray-900">{category?.name}</span>
            <span className="mx-2">→</span>
            <span>Edit Question</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Question</h1>
              <p className="text-gray-600">Update the question details below.</p>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question *
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your question here..."
              />
            </div>

            {/* Choices */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Choices *
              </label>
              <div className="space-y-3">
                {choices.map((choice, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500 w-8">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => handleChoiceChange(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select the correct answer</option>
                {choices
                  .filter(choice => choice.trim())
                  .map((choice, index) => (
                    <option key={index} value={choice}>
                      {String.fromCharCode(65 + index)}. {choice}
                    </option>
                  ))}
              </select>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide an explanation for the correct answer..."
              />
            </div>

            {/* Level and Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a level</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.level} - {level.name || `${level.totalQuestions} questions`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (seconds)
                </label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
                  min="10"
                  max="300"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Question is active
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
