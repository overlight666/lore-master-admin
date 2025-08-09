'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Plus, Download, Upload, Edit, Trash2, Target } from 'lucide-react';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question: string;
  choices: string[];
  options?: string[]; // Keep for backward compatibility
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  level: number;
  topic_id: string;
  subtopic_id: string;
  level_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface Level {
  id: string;
  level: number;
  name: string;
  description: string;
  subtopic_id: string;
  topic_id: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Subtopic {
  id: string;
  name: string;
  description: string;
  topic_id: string;
}

export default function SubtopicQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.id as string;
  const subtopicId = params?.subtopicId as string;
  
  // Early return if params are missing
  if (!topicId || !subtopicId) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-500">Invalid URL parameters</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (topicId && subtopicId) {
      loadData();
    }
  }, [topicId, subtopicId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [topicData, subtopicData, questionsData, levelsData] = await Promise.all([
        apiService.get(`/admin/topics/${topicId}`),
        apiService.get(`/admin/subtopics/${subtopicId}`),
        apiService.get(`/admin/questions?subtopicId=${subtopicId}`),
        apiService.get(`/admin/levels?subtopicId=${subtopicId}`)
      ]);
      
      setTopic(topicData?.topic || topicData);
      setSubtopic(subtopicData?.subtopic || subtopicData);
      
      // Handle questions data with defensive programming
      const questionsArray = questionsData?.data || questionsData?.items || questionsData || [];
      setQuestions(Array.isArray(questionsArray) ? questionsArray : []);
      
      // Handle levels data with defensive programming
      const levelsArray = levelsData?.data || levelsData?.items || levelsData || [];
      setLevels(Array.isArray(levelsArray) ? levelsArray : []);
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Group questions by level
  const questionsByLevel = questions.reduce((acc, question) => {
    const level = question.level || 1;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(question);
    return acc;
  }, {} as { [key: number]: Question[] });

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await apiService.delete(`/admin/questions/${questionId}`);
      toast.success('Question deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowAddModal(true);
  };

  const getDifficultyFromLevel = (level: number): string => {
    if (level <= 2) return 'easy';
    if (level >= 5) return 'hard';
    return 'medium';
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {subtopic?.name} Questions
              </h1>
              <p className="text-sm text-gray-600">
                {topic?.name} / {subtopic?.name}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowAddModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">E</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Easy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.filter(q => getDifficultyFromLevel(q.level) === 'easy').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold text-sm">M</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Medium</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.filter(q => getDifficultyFromLevel(q.level) === 'medium').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">H</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Hard</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.filter(q => getDifficultyFromLevel(q.level) === 'hard').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions by Level */}
        <div className="space-y-6">
          {Object.keys(questionsByLevel).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No questions found</div>
              <p className="text-gray-500 mt-2">Add questions to get started</p>
            </div>
          ) : (
            Object.entries(questionsByLevel)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, levelQuestions]) => (
                <div key={level} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Level {level}
                        <span className="ml-2 text-sm text-gray-500">
                          ({levelQuestions.length} questions)
                        </span>
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(getDifficultyFromLevel(parseInt(level)))}`}>
                        {getDifficultyFromLevel(parseInt(level))}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {levelQuestions.map((question, index) => (
                      <div key={question.id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="flex-shrink-0 text-sm font-medium text-gray-500">
                                #{index + 1}
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {question.question}
                              </p>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {(question.choices || question.options || []).map((option, optIndex) => {
                                // Handle both string correctAnswer and number correctAnswer
                                const isCorrect = typeof question.correctAnswer === 'string' 
                                  ? question.correctAnswer === option
                                  : question.correctAnswer === optIndex;
                                
                                return (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded text-xs ${
                                      isCorrect
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <strong>{String.fromCharCode(65 + optIndex)}:</strong> {option}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {question.explanation && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600">
                                  <strong>Explanation:</strong> {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {showAddModal && (
        <QuestionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            loadData();
            setShowAddModal(false);
            setEditingQuestion(null);
          }}
          question={editingQuestion}
          topicId={topicId}
          subtopicId={subtopicId}
          levels={levels}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSave={loadData}
          topicId={topicId}
          subtopicId={subtopicId}
        />
      )}
    </AdminLayout>
  );
}

// Question Modal Component
function QuestionModal({
  isOpen,
  onClose,
  onSave,
  question,
  topicId,
  subtopicId,
  levels
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  question: Question | null;
  topicId: string;
  subtopicId: string;
  levels: Level[];
}) {
  const [formData, setFormData] = useState({
    question: question?.question || '',
    options: question?.choices || question?.options || ['', '', '', ''],
    correctAnswer: (() => {
      if (!question) return 0;
      if (typeof question.correctAnswer === 'number') return question.correctAnswer;
      // If correctAnswer is a string, find its index in choices/options
      const choices = question.choices || question.options || [];
      const index = choices.findIndex(choice => choice === question.correctAnswer);
      return index >= 0 ? index : 0;
    })(),
    explanation: question?.explanation || '',
    level: question?.level || 1
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }

    if (formData.options.some(opt => !opt.trim())) {
      toast.error('All options are required');
      return;
    }

    setIsSaving(true);
    try {
      // Determine difficulty based on level
      const difficulty = formData.level <= 2 ? 'easy' : formData.level >= 5 ? 'hard' : 'medium';

      // Find or create a level_id based on the level number
      // For now, we'll use a simple approach - in a production app, you'd want proper level management
      const level_id = `level_${formData.level}_${subtopicId}`;

      const questionData = {
        level_id,
        subtopic_id: subtopicId,
        topic_id: topicId,
        question: formData.question,
        choices: formData.options,
        correctAnswer: formData.options[formData.correctAnswer], // Send the actual answer text
        explanation: formData.explanation,
        difficulty
      };

      if (question) {
        await apiService.put(`/admin/questions/${question.id}`, questionData);
        toast.success('Question updated successfully');
      } else {
        await apiService.post('/admin/questions', questionData);
        toast.success('Question created successfully');
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {question ? 'Edit Question' : 'Add New Question'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>
                  Level {level} ({level <= 2 ? 'Easy' : level >= 5 ? 'Hard' : 'Medium'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.options.map((option, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option {String.fromCharCode(65 + index)}
                  {index === formData.correctAnswer && (
                    <span className="text-green-600 ml-1">(Correct)</span>
                  )}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, correctAnswer: index })}
                    className={`px-3 py-2 rounded-md text-sm ${
                      index === formData.correctAnswer
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk Import Modal Component
function BulkImportModal({
  isOpen,
  onClose,
  onSave,
  topicId,
  subtopicId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  topicId: string;
  subtopicId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const downloadTemplate = () => {
    // correct_answer should be the letter (A/B/C/D) for user clarity, but will be converted to the answer text in import logic
    const csvContent = [
      'level,question,option_a,option_b,option_c,option_d,correct_answer,explanation',
      '1,"What is the capital of France?","London","Berlin","Paris","Madrid","C","Paris is the capital city of France"',
      '2,"Which planet is closest to the Sun?","Venus","Mercury","Earth","Mars","B","Mercury is the closest planet to the Sun"',
      '3,"What is the largest mammal?","Elephant","Whale","Giraffe","Hippo","B","The blue whale is the largest mammal"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const getColumnIndex = (columnName: string) => {
        const index = headers.findIndex(h => h.includes(columnName));
        return index >= 0 ? index : -1;
      };

      const levelCol = getColumnIndex('level');
      const questionCol = getColumnIndex('question');
      const optionACol = getColumnIndex('option_a');
      const optionBCol = getColumnIndex('option_b');
      const optionCCol = getColumnIndex('option_c');
      const optionDCol = getColumnIndex('option_d');
      const correctCol = getColumnIndex('correct');
      const explanationCol = getColumnIndex('explanation');

      if (questionCol === -1 || optionACol === -1 || optionBCol === -1 || optionCCol === -1 || optionDCol === -1 || correctCol === -1) {
        toast.error('CSV must contain: question, option_a, option_b, option_c, option_d, correct_answer columns');
        return;
      }

      const questionsData = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length < headers.length) continue;

        const correctAnswerLetter = columns[correctCol].toUpperCase();
        let correctAnswerIndex = 0;
        switch (correctAnswerLetter) {
          case 'A': correctAnswerIndex = 0; break;
          case 'B': correctAnswerIndex = 1; break;
          case 'C': correctAnswerIndex = 2; break;
          case 'D': correctAnswerIndex = 3; break;
          default: correctAnswerIndex = 0;
        }

        const level = levelCol >= 0 ? parseInt(columns[levelCol]) || 1 : 1;
        const difficulty = level <= 2 ? 'easy' : level >= 5 ? 'hard' : 'medium';
        
        const options = [
          columns[optionACol],
          columns[optionBCol],
          columns[optionCCol],
          columns[optionDCol]
        ];

        questionsData.push({
          level_id: `level_${level}_${subtopicId}`,
          subtopic_id: subtopicId,
          topic_id: topicId,
          question: columns[questionCol],
          choices: options,
          correctAnswer: options[correctAnswerIndex], // Send the actual answer text, not index
          explanation: explanationCol >= 0 ? columns[explanationCol] : '',
          difficulty
        });
      }

      // Send questions one by one to use the regular POST endpoint
      let created = 0;
      let errors = 0;

      for (const questionData of questionsData) {
        try {
          await apiService.post('/admin/questions', questionData);
          created++;
        } catch (error) {
          console.error('Error creating question:', error);
          errors++;
        }
      }

      if (created > 0) {
        toast.success(`Successfully imported ${created} questions`);
        if (errors > 0) {
          toast.error(`${errors} questions failed to import`);
        }
      } else {
        toast.error('No questions were imported');
      }

      onSave();
      onClose();
      setFile(null);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to import questions: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Bulk Import Questions
          </h3>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with questions. Use the template format with columns:
            </p>
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>• level (number)</li>
              <li>• question (text)</li>
              <li>• option_a, option_b, option_c, option_d (text)</li>
              <li>• correct_answer (A, B, C, or D)</li>
              <li>• explanation (optional text)</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Download CSV Template
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-800">
                Selected: {file.name}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Import Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}
