'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, ChevronRight, Layers, Target, HelpCircle, Upload, FileText, AlertTriangle, Search } from 'lucide-react';
import { Topic, Subtopic, Category, Question } from '@/types';
import { topicsApi, subtopicsApi, categoriesApi, questionsApi, levelsApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function CategoryQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.id as string;
  const subtopicId = params?.subtopicId as string;
  const categoryId = params?.categoryId as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [levels, setLevels] = useState<number[]>([]);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  
  // Bulk import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<Question[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'processing'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [textValidation, setTextValidation] = useState<{
    isValid: boolean;
    questionCount: number;
    duplicateCount: number;
    errors: string[];
    duplicateInfo?: {
      questionNumber: number;
      questionPreview: string;
      type: 'database' | 'internal' | 'both';
      action: 'removed' | 'kept';
    }[];
  } | null>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (topicId && subtopicId && categoryId) {
      loadData();
    }
  }, [topicId, subtopicId, categoryId, currentPage]);

  useEffect(() => {
    filterQuestions();
    // Reset to first page when filters change
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [questions, searchTerm, selectedLevel]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [topicData, subtopicData, categoryData, questionsData, levelsData] = await Promise.all([
        topicsApi.getById(topicId),
        subtopicsApi.getById(subtopicId),
        categoriesApi.getById(categoryId),
        questionsApi.getAll({ 
          topicId, 
          subtopicId, 
          categoryId, 
          page: currentPage,
          limit: questionsPerPage
        }),
        levelsApi.getAll({ category_id: categoryId, limit: 100 })
      ]);
      
      // Handle data responses
      setTopic(topicData);
      setSubtopic(subtopicData);
      setCategory(categoryData);
      
      // Handle questions data using our consistent data extraction
      let questionsArray: Question[] = [];
      let total = 0;
      
      if (questionsData?.data && Array.isArray(questionsData.data)) {
        questionsArray = questionsData.data;
        total = questionsData.total || questionsData.data.length;
      } else if (questionsData?.items && Array.isArray(questionsData.items)) {
        questionsArray = questionsData.items;
        total = questionsData.total || questionsData.items.length;
      } else if (Array.isArray(questionsData)) {
        questionsArray = questionsData;
        total = questionsData.length;
      }
      
      // Create a map of level_id to level number
      const levelsMap = new Map();
      if (levelsData?.data && Array.isArray(levelsData.data)) {
        levelsData.data.forEach((level: any) => {
          levelsMap.set(level.id, level.level);
        });
      }
      
      // Enhance questions with correct level information
      const enhancedQuestions = questionsArray.map(question => ({
        ...question,
        level: levelsMap.get(question.level_id) || (question as any).difficulty || 1
      }));
      
      setQuestions(enhancedQuestions);
      setTotalQuestions(total);
      
      // Extract unique levels from questions
      const uniqueLevels = Array.from(new Set<number>(enhancedQuestions.map((q: Question) => q.level))).sort((a, b) => a - b);
      setLevels(uniqueLevels);
      
    } catch (error: any) {
      console.error('Load data error:', error);
      toast.error('Failed to load data');
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

    if (selectedLevel) {
      filtered = filtered.filter(q => q.level === parseInt(selectedLevel));
    }

    setFilteredQuestions(filtered);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await questionsApi.delete(questionId);
      toast.success('Question deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete question');
    }
  };

  const handleAddQuestion = () => {
    router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions/create`);
  };

  const handleEditQuestion = (questionId: string) => {
    router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories/${categoryId}/questions/${questionId}/edit`);
  };

  // Bulk import functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'json'].includes(fileExtension || '')) {
      toast.error('Please upload a CSV or JSON file');
      return;
    }

    try {
      const content = await file.text();
      let parsedData: any[] = [];

      if (fileExtension === 'json') {
        const jsonData = JSON.parse(content);
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else if (fileExtension === 'csv') {
        parsedData = parseCSV(content);
      }

      // Apply the same duplication handling as text import
      const existingQuestionsResponse = await questionsApi.getAll({ 
        topicId, 
        subtopicId, 
        categoryId, 
        limit: 1000 
      });
      
      let existingQuestions: any[] = [];
      if (existingQuestionsResponse?.data && Array.isArray(existingQuestionsResponse.data)) {
        existingQuestions = existingQuestionsResponse.data;
      } else if (existingQuestionsResponse?.items && Array.isArray(existingQuestionsResponse.items)) {
        existingQuestions = existingQuestionsResponse.items;
      } else if (Array.isArray(existingQuestionsResponse)) {
        existingQuestions = existingQuestionsResponse;
      }

      const processedQuestions = await handleDuplicationRules(parsedData, existingQuestions);
      const finalQuestions = processedQuestions.filter(q => !q.status?.includes('removed'));

      // Collect detailed duplicate information
      const dbDuplicates: string[] = [];
      const parsedDuplicates: string[] = [];
      const bothDuplicates: string[] = [];

      processedQuestions.forEach((question, index) => {
        const questionNumber = index + 1;
        const questionPreview = question.question?.substring(0, 50) + (question.question?.length > 50 ? '...' : '');
        
        if (question.status === 'removed_db_duplicate') {
          dbDuplicates.push(`Question ${questionNumber}: "${questionPreview}"`);
        } else if (question.status === 'removed_parsed_duplicate') {
          parsedDuplicates.push(`Question ${questionNumber}: "${questionPreview}"`);
        } else if (question.status === 'removed_both_duplicate') {
          bothDuplicates.push(`Question ${questionNumber}: "${questionPreview}"`);
        }
      });

      // Show detailed results
      const totalDuplicatesRemoved = dbDuplicates.length + parsedDuplicates.length + bothDuplicates.length;
      
      let message = `File processed: ${finalQuestions.length} questions ready for import`;
      if (totalDuplicatesRemoved > 0) {
        message += `, ${totalDuplicatesRemoved} duplicates removed`;
      }
      toast.success(message);

      // Show detailed duplicate information if any
      if (dbDuplicates.length > 0) {
        console.log(`${dbDuplicates.length} questions removed (already exist in database):`, dbDuplicates);
      }
      if (parsedDuplicates.length > 0) {
        console.log(`${parsedDuplicates.length} duplicate questions removed from import data:`, parsedDuplicates);
      }
      if (bothDuplicates.length > 0) {
        console.log(`${bothDuplicates.length} questions removed (duplicates in both database and import):`, bothDuplicates);
      }

      setImportData(parsedData);
      processImportData(finalQuestions);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to process file. Please check the format.');
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      try {
        let data: any[] = [];
        
        if (fileExtension === 'json') {
          const jsonData = JSON.parse(content);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } else if (fileExtension === 'csv') {
          data = parseCSV(content);
        }

        setImportData(data);
        processImportData(data);
      } catch (error) {
        toast.error('Error parsing file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).filter((line: string) => line.trim());

    return rows.map((line: string) => {
      const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header: string, index: number) => {
        if (values[index] !== undefined) {
          row[header] = values[index];
        }
      });
      return row;
    });
  };

  const parseText = (text: string): any[] => {
    // First try to parse as JSON
    try {
      const jsonData = JSON.parse(text.trim());
      if (Array.isArray(jsonData)) {
        // If levels are not defined, randomly distribute across levels 1-3
        return jsonData.map(item => ({
          ...item,
          level: item.level || Math.floor(Math.random() * 3) + 1
        }));
      } else if (typeof jsonData === 'object') {
        // Single object, convert to array
        return [{
          ...jsonData,
          level: jsonData.level || Math.floor(Math.random() * 3) + 1
        }];
      }
    } catch (error) {
      // Not JSON, continue with text parsing
    }

    // Text parsing logic for the structured format
    const data: any[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentQuestion: any = null;
    let hasDefinedLevels = false;
    
    // Check if any questions have defined difficulty levels
    for (const line of lines) {
      if (line.match(/^Question\s+\d+\s*[–-]\s*\((\w+)\)/i)) {
        hasDefinedLevels = true;
        break;
      }
    }
    
    for (const line of lines) {
      // Match question pattern: "Question X – (Difficulty)" or just "Question X"
      const questionMatchWithDifficulty = line.match(/^Question\s+\d+\s*[–-]\s*\((\w+)\)/i);
      const questionMatchSimple = line.match(/^Question\s+\d+/i);
      
      if (questionMatchWithDifficulty || questionMatchSimple) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.question && currentQuestion.correctAnswer) {
          data.push(currentQuestion);
        }
        
        // Start new question
        let level = 1;
        if (questionMatchWithDifficulty) {
          const difficulty = questionMatchWithDifficulty[1].toLowerCase();
          if (difficulty === 'medium') level = 2;
          else if (difficulty === 'hard') level = 3;
        } else if (!hasDefinedLevels) {
          // If no levels are defined in the entire text, randomly assign
          level = Math.floor(Math.random() * 3) + 1;
        }
        
        currentQuestion = {
          level,
          question: '',
          choices: [],
          correctAnswer: '',
          explanation: ''
        };
        continue;
      }
      
      // Match answer pattern: "Answer: X) Answer text" or "Answer: X) Answer text  Explanation: ..."
      const answerMatch = line.match(/^Answer:\s*([A-D])\)\s*(.+?)(?:\s+(?:Image:|Explanation:)\s*(.*))?$/i);
      if (answerMatch && currentQuestion) {
        const answerLetter = answerMatch[1].toUpperCase();
        const answerText = answerMatch[2].trim();
        const explanation = answerMatch[3] ? answerMatch[3].trim() : '';
        
        currentQuestion.correctAnswer = answerText;
        if (explanation && explanation !== 'Image:' && !explanation.startsWith('Image:')) {
          currentQuestion.explanation = explanation;
        }
        continue;
      }
      
      // Extract question text and choices from the same line or separate lines
      if (currentQuestion && !currentQuestion.question) {
        // Check if this line contains both question and choices
        const questionWithChoicesMatch = line.match(/^(.+?)\s+A\)\s*(.+?)\s+B\)\s*(.+?)\s+C\)\s*(.+?)\s+D\)\s*(.+?)$/);
        if (questionWithChoicesMatch) {
          currentQuestion.question = questionWithChoicesMatch[1].trim();
          currentQuestion.choices = [
            questionWithChoicesMatch[2].trim(),
            questionWithChoicesMatch[3].trim(),
            questionWithChoicesMatch[4].trim(),
            questionWithChoicesMatch[5].trim()
          ];
          continue;
        }
        
        // Otherwise, this might be just the question text
        if (!line.includes('A)') && !line.includes('Answer:')) {
          currentQuestion.question = line;
          continue;
        }
      }
      
      // Extract choices if question is set but choices are empty
      if (currentQuestion && currentQuestion.question && currentQuestion.choices.length === 0) {
        const choicesMatch = line.match(/A\)\s*(.+?)\s+B\)\s*(.+?)\s+C\)\s*(.+?)\s+D\)\s*(.+?)$/);
        if (choicesMatch) {
          currentQuestion.choices = [
            choicesMatch[1].trim(),
            choicesMatch[2].trim(),
            choicesMatch[3].trim(),
            choicesMatch[4].trim()
          ];
          continue;
        }
      }
    }
    
    // Don't forget the last question
    if (currentQuestion && currentQuestion.question && currentQuestion.correctAnswer) {
      data.push(currentQuestion);
    }
    
    return data;
  };

  const validatePastedText = async (text: string) => {
    if (!text.trim()) {
      setTextValidation(null);
      return;
    }

    try {
      const parsed = parseText(text);
      const errors: string[] = [];
      let validQuestionCount = 0;
      
      // Basic validation for each question
      parsed.forEach((item, index) => {
        const questionNum = index + 1;
        
        if (!item.question) {
          errors.push(`Question ${questionNum}: Missing question text`);
        }
        
        if (!item.choices || item.choices.length < 2) {
          errors.push(`Question ${questionNum}: Must have at least 2 choices`);
        }
        
        if (!item.correctAnswer) {
          errors.push(`Question ${questionNum}: Missing correct answer`);
        } else if (item.choices && !item.choices.includes(item.correctAnswer)) {
          errors.push(`Question ${questionNum}: Correct answer not found in choices`);
        }
        
        if (errors.filter(e => e.startsWith(`Question ${questionNum}:`)).length === 0) {
          validQuestionCount++;
        }
      });

      // Get existing questions for duplicate checking
      const existingQuestionsResponse = await questionsApi.getAll({ 
        topicId, 
        subtopicId, 
        categoryId, 
        limit: 1000 
      });
      
      let existingQuestions: any[] = [];
      if (existingQuestionsResponse?.data && Array.isArray(existingQuestionsResponse.data)) {
        existingQuestions = existingQuestionsResponse.data;
      } else if (existingQuestionsResponse?.items && Array.isArray(existingQuestionsResponse.items)) {
        existingQuestions = existingQuestionsResponse.items;
      } else if (Array.isArray(existingQuestionsResponse)) {
        existingQuestions = existingQuestionsResponse;
      }

      // Apply duplication handling rules
      const processedQuestions = await handleDuplicationRules(parsed, existingQuestions);
      
      // Collect detailed duplicate information
      const duplicateInfo: {
        questionNumber: number;
        questionPreview: string;
        type: 'database' | 'internal' | 'both';
        action: 'removed' | 'kept';
      }[] = [];
      
      const validQuestions: any[] = [];

      processedQuestions.forEach((question, index) => {
        const questionNumber = index + 1;
        const questionPreview = question.question?.substring(0, 60) + (question.question?.length > 60 ? '...' : '');
        
        if (question.status === 'removed_db_duplicate') {
          duplicateInfo.push({
            questionNumber,
            questionPreview,
            type: 'database',
            action: 'removed'
          });
        } else if (question.status === 'removed_parsed_duplicate') {
          duplicateInfo.push({
            questionNumber,
            questionPreview,
            type: 'internal',
            action: 'removed'
          });
        } else if (question.status === 'removed_both_duplicate') {
          duplicateInfo.push({
            questionNumber,
            questionPreview,
            type: 'both',
            action: 'removed'
          });
        } else {
          validQuestions.push(question);
        }
      });

      const totalDuplicatesRemoved = duplicateInfo.length;

      setTextValidation({
        isValid: errors.length === 0,
        questionCount: validQuestions.length,
        duplicateCount: totalDuplicatesRemoved,
        errors: errors,
        duplicateInfo: duplicateInfo
      });

      if (errors.length === 0 && validQuestions.length > 0) {
        processImportData(validQuestions);
      }
      
    } catch (error) {
      console.error('Validation error:', error);
      setTextValidation({
        isValid: false,
        questionCount: 0,
        duplicateCount: 0,
        errors: ['Failed to parse text format or check duplicates'],
        duplicateInfo: []
      });
    }
  };

  const handleDuplicationRules = async (parsedQuestions: any[], existingQuestions: any[]) => {
    const existingQuestionTexts = new Set(
      existingQuestions.map(q => q.question?.toLowerCase().trim()).filter(Boolean)
    );
    
    const processedQuestions: any[] = [];
    const seenInParsed = new Map(); // Track questions we've seen in parsed data
    
    for (let i = 0; i < parsedQuestions.length; i++) {
      const question = parsedQuestions[i];
      const questionText = question.question?.toLowerCase().trim();
      
      if (!questionText) {
        processedQuestions.push(question);
        continue;
      }
      
      const isInDatabase = existingQuestionTexts.has(questionText);
      const isInParsed = seenInParsed.has(questionText);
      
      // Rule c: If question is duplicate in both database and parsed data, completely remove
      if (isInDatabase && isInParsed) {
        question.status = 'removed_both_duplicate';
        processedQuestions.push(question);
        continue;
      }
      
      // Rule a: If question is duplicate from database only, remove but allow user to know
      if (isInDatabase && !isInParsed) {
        question.status = 'removed_db_duplicate';
        processedQuestions.push(question);
        seenInParsed.set(questionText, i);
        continue;
      }
      
      // Rule b: If question is duplicate in parsed data only, keep first occurrence
      if (!isInDatabase && isInParsed) {
        question.status = 'removed_parsed_duplicate';
        processedQuestions.push(question);
        continue;
      }
      
      // No duplicate, keep the question
      seenInParsed.set(questionText, i);
      processedQuestions.push(question);
    }
    
    return processedQuestions;
  };

  const handleTextImport = async () => {
    if (!pastedText.trim()) {
      toast.error('Please paste some text to import');
      return;
    }
    await validatePastedText(pastedText);
  };

  const processImportData = (data: any[]) => {
    const processedQuestions: Question[] = [];

    data.forEach((item, index) => {
      try {
        // Expected format: question, choices (comma-separated), correctAnswer, level, explanation (optional)
        const question = item.question || item.Question || '';
        const choicesString = item.choices || item.Choices || '';
        const correctAnswer = item.correctAnswer || item.CorrectAnswer || item.correct_answer || '';
        const level = parseInt(item.level || item.Level || '1');
        const explanation = item.explanation || item.Explanation || '';

        if (!question || !correctAnswer) {
          return; // Skip invalid rows silently
        }

        // Parse choices - handle both array format and comma-separated string
        let choices: string[] = [];
        if (Array.isArray(choicesString)) {
          choices = choicesString;
        } else if (Array.isArray(item.choices)) {
          choices = item.choices;
        } else if (typeof choicesString === 'string') {
          if (choicesString.startsWith('[') && choicesString.endsWith(']')) {
            // JSON array format
            choices = JSON.parse(choicesString);
          } else {
            // Comma-separated format
            choices = choicesString.split('|').map(c => c.trim()).filter(c => c);
          }
        }

        if (choices.length < 2) {
          return; // Skip rows with insufficient choices
        }

        processedQuestions.push({
          id: `temp-${index}`, // Temporary ID for preview
          question: question.trim(),
          choices,
          correctAnswer: correctAnswer.trim(),
          level: isNaN(level) ? 1 : level,
          explanation: explanation.trim(),
          topic_id: topicId,
          subtopic_id: subtopicId,
          category_id: categoryId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Question);
      } catch (error) {
        // Skip problematic rows silently
      }
    });

    setImportPreview(processedQuestions);
    if (processedQuestions.length > 0) {
      setImportStep('preview');
    } else {
      toast.error('No valid questions found in the file');
    }
  };

  const handleBulkImport = async () => {
    if (importPreview.length === 0) return;

    setIsProcessingImport(true);
    setImportStep('processing');

    try {
      // Load levels data to map level numbers to level_ids
      const levelsResponse = await levelsApi.getAll({ category_id: categoryId, limit: 100 });
      const levels = levelsResponse.data || [];
      
      // Create a map from level number to level_id
      const levelMap = new Map();
      levels.forEach((level: any) => {
        levelMap.set(level.level, level.id);
      });
      
      // Prepare questions data for bulk import endpoint
      const questionsData = importPreview.map(question => ({
        question: question.question,
        choices: question.choices || [],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        difficulty: question.level,
        tags: [],
        estimatedTime: 30, // Default 30 seconds
        isActive: true,
        // Map level number to level_id, or use existing level_id if available
        level_id: levelMap.get(question.level) || question.level_id || undefined
      }));

      // Use the bulk-create endpoint through the API service
      const result = await questionsApi.bulkCreate({
        topicId,
        subtopicId,
        categoryId,
        questionsData
      });

      // Handle the response from bulk-create endpoint
      const successCount = result.createdQuestions?.length || importPreview.length;
      const failCount = result.errors?.length || 0;

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} questions`);
        loadData(); // Reload the questions list
      }
      
      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} questions`);
        // Optionally show detailed errors
        if (result.errors?.length > 0) {
          console.error('Import errors:', result.errors);
        }
      }

      // Reset bulk import state
      resetBulkImport();
      
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import questions');
    } finally {
      setIsProcessingImport(false);
    }
  };

  const resetBulkImport = () => {
    setImportFile(null);
    setImportData([]);
    setImportPreview([]);
    setImportStep('upload');
    setShowBulkImportModal(false);
    setPastedText('');
    setTextValidation(null);
    setImportMethod('file');
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
              onClick={() => router.push(`/topics/${topicId}/subtopics/${subtopicId}/categories`)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="font-medium text-gray-900">{topic?.name || 'Loading...'}</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="font-medium text-gray-900">{subtopic?.name || 'Loading...'}</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Layers className="h-4 w-4 mr-1" />
            <span className="font-medium text-gray-900">{category?.name || 'Loading...'}</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <HelpCircle className="h-4 w-4 mr-1" />
            <span>Questions</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <HelpCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Levels</p>
                <p className="text-2xl font-bold text-gray-900">{levels.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <HelpCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-gray-900">{filteredQuestions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
                <p className="text-gray-600 mt-1">
                  Manage questions for <span className="font-medium">{category?.name || 'this category'}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  Bulk Import
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add Question
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level.toString()}>Level {level}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLevel('');
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="p-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {questions.length === 0 ? 'No Questions Yet' : 'No Questions Found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {questions.length === 0 
                    ? 'Get started by creating your first question for this category.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {questions.length === 0 && (
                  <button
                    onClick={handleAddQuestion}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Question
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-500 mr-3">
                            Question {index + 1}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            question.level <= 3 ? 'bg-green-100 text-green-800' :
                            question.level <= 6 ? 'bg-yellow-100 text-yellow-800' :
                            question.level <= 8 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Level {question.level}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          {question.question}
                        </h3>
                        <div className="space-y-1 mb-3">
                          {question.choices?.map((choice, choiceIndex) => (
                            <div 
                              key={choiceIndex} 
                              className={`text-sm p-2 rounded ${
                                choice === question.correctAnswer 
                                  ? 'bg-green-50 text-green-800 font-medium' 
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {String.fromCharCode(65 + choiceIndex)}. {choice}
                              {choice === question.correctAnswer && (
                                <span className="ml-2 text-green-600">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditQuestion(question.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Question"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && totalQuestions > questionsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {Math.min((currentPage - 1) * questionsPerPage + 1, totalQuestions)} to{' '}
                    {Math.min(currentPage * questionsPerPage, totalQuestions)} of {totalQuestions} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.ceil(totalQuestions / questionsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          // Show current page, first/last page, and pages around current
                          return page === 1 || 
                                 page === Math.ceil(totalQuestions / questionsPerPage) || 
                                 Math.abs(page - currentPage) <= 2;
                        })
                        .map((page, index, filteredPages) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && filteredPages[index - 1] !== page - 1 && (
                              <span className="px-2 py-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(totalQuestions / questionsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(totalQuestions / questionsPerPage)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Bulk Import Questions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import multiple questions from files or paste text directly
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {importStep === 'upload' && (
                <div className="p-6">
                  {/* Import Method Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Import Method
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="importMethod"
                          value="file"
                          checked={importMethod === 'file'}
                          onChange={(e) => setImportMethod(e.target.value as 'file' | 'text')}
                          className="mr-2"
                        />
                        File Upload (CSV/JSON)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="importMethod"
                          value="text"
                          checked={importMethod === 'text'}
                          onChange={(e) => setImportMethod(e.target.value as 'file' | 'text')}
                          className="mr-2"
                        />
                        Paste Text
                      </label>
                    </div>
                  </div>

                  {importMethod === 'file' && (
                    <>
                      {/* File Upload Section */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <div className="mb-4">
                            <input
                              type="file"
                              accept=".csv,.json"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="bulk-import-file"
                            />
                            <label
                              htmlFor="bulk-import-file"
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Choose File
                            </label>
                          </div>
                          <p className="text-sm text-gray-600">
                            Upload CSV or JSON file containing questions data
                          </p>
                          {importFile && (
                            <p className="text-sm text-green-600 mt-2">
                              Selected: {importFile.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Format Instructions */}
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">File Format Requirements</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">CSV Format:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                              <div className="text-gray-600 mb-2">Headers (required):</div>
                              <div>question,choices,correctAnswer,level,explanation</div>
                              <div className="text-gray-600 mt-2 mb-2">Example row:</div>
                              <div>"What is 2+2?","2|3|4|5","4","1","Basic arithmetic"</div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              • Use pipe (|) to separate multiple choices<br/>
                              • Level should be a number (1-10)<br/>
                              • Explanation is optional
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">JSON Format:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                              <div className="whitespace-pre-wrap">{`[
  {
    "question": "What is 2+2?",
    "choices": ["2", "3", "4", "5"],
    "correctAnswer": "4",
    "level": 1,
    "explanation": "Basic arithmetic"
  }
]`}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {importMethod === 'text' && (
                    <>
                      {/* Text Paste Section */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste Questions Text
                        </label>
                        <textarea
                          value={pastedText}
                          onChange={(e) => {
                            setPastedText(e.target.value);
                            validatePastedText(e.target.value);
                          }}
                          placeholder="Paste your questions here...

You can paste either:
1. Structured text format (Question 1 – (Easy)...)
2. JSON array format ([{&quot;question&quot;: &quot;...&quot;, &quot;choices&quot;: [...], ...}])
3. Single JSON object ({&quot;question&quot;: &quot;...&quot;, &quot;choices&quot;: [...], ...})"
                          rows={15}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-between mt-2">
                          <div className="flex space-x-4">
                            {textValidation && (
                              <button
                                onClick={handleTextImport}
                                disabled={!textValidation.isValid}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Parse Questions
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Validation Results */}
                      {textValidation && (
                        <div className={`p-4 rounded-lg mb-6 ${
                          textValidation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center mb-2">
                            {textValidation.isValid ? (
                              <div className="text-green-800">
                                <strong>✓ Valid Format</strong>
                                <p className="text-sm mt-1">
                                  Found {textValidation.questionCount} valid questions
                                  {textValidation.duplicateCount > 0 && ` (${textValidation.duplicateCount} duplicates handled)`}
                                </p>
                              </div>
                            ) : (
                              <div className="text-red-800">
                                <strong>⚠ Format Issues</strong>
                                <p className="text-sm mt-1">
                                  Found {textValidation.questionCount} valid questions out of total parsed
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Display duplicate information */}
                          {textValidation.duplicateInfo && textValidation.duplicateInfo.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Duplicate Questions Handled:</h4>
                              <div className="space-y-3 text-sm">
                                {textValidation.duplicateInfo.map((dup, index) => (
                                  <div key={index} className={`p-3 rounded-md ${
                                    dup.type === 'database' ? 'bg-yellow-50 border border-yellow-200' :
                                    dup.type === 'internal' ? 'bg-blue-50 border border-blue-200' :
                                    'bg-orange-50 border border-orange-200'
                                  }`}>
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="font-medium">
                                        Question #{dup.questionNumber}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        dup.type === 'database' ? 'bg-yellow-100 text-yellow-800' :
                                        dup.type === 'internal' ? 'bg-blue-100 text-blue-800' :
                                        'bg-orange-100 text-orange-800'
                                      }`}>
                                        {dup.type === 'database' ? 'Exists in DB' : 
                                         dup.type === 'internal' ? 'Duplicate in Import' : 'Both'}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 mb-2">"{dup.questionPreview}"</p>
                                    <p className={`text-xs ${
                                      dup.type === 'database' ? 'text-yellow-700' :
                                      dup.type === 'internal' ? 'text-blue-700' :
                                      'text-orange-700'
                                    }`}>
                                      {dup.action === 'removed' ? '→ Removed from import' : '→ Kept (first occurrence)'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {textValidation.errors.length > 0 && (
                            <div className="text-sm space-y-1 mt-4 border-t pt-4">
                              <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                              {textValidation.errors.map((error, index) => (
                                <div key={index} className="text-red-700">• {error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text Format Instructions */}
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Supported Text Formats</h3>
                        
                        <div className="space-y-4">
                          {/* Structured Text Format */}
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Structured Text Format:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                              <div className="font-medium mb-2">Expected Format:</div>
                              <div className="font-mono space-y-1 text-xs">
                                <div>Question 1 – (Easy)</div>
                                <div>Who is known as the Firebrand?</div>
                                <div>A) Liliana Vess  B) Chandra Nalaar  C) Jaya Ballard  D) Elspeth Tirel</div>
                                <div>Answer: B) Chandra Nalaar</div>
                                <div className="text-gray-600 mt-2">• Difficulty levels: Easy (Level 1), Medium (Level 2), Hard (Level 3)</div>
                                <div className="text-gray-600">• Explanations after "Explanation:" are optional</div>
                                <div className="text-gray-600">• "Image:" tags are ignored</div>
                                <div className="text-gray-600">• If no difficulty levels specified, questions will be randomly distributed across levels 1-3</div>
                              </div>
                            </div>
                          </div>

                          {/* JSON Format */}
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">JSON Format:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                              <div className="whitespace-pre-wrap">{`[
  {
    "question": "What is 2+2?",
    "choices": ["2", "3", "4", "5"],
    "correctAnswer": "4",
    "level": 1,
    "explanation": "Basic arithmetic"
  },
  {
    "question": "What is the capital of France?",
    "choices": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris"
  }
]`}</div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              • If "level" is not specified, questions will be randomly assigned to levels 1-3<br/>
                              • "explanation" field is optional<br/>
                              • Can also paste a single object (without array brackets)
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {importStep === 'preview' && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Preview Import</h3>
                    <p className="text-sm text-gray-600">
                      {importPreview.length} questions ready to import
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {importPreview.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            Question {index + 1}
                          </h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Level {question.level}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{question.question}</p>
                        <div className="space-y-1 mb-2">
                          {question.choices?.map((choice, choiceIndex) => (
                            <div 
                              key={choiceIndex}
                              className={`text-sm p-2 rounded ${
                                choice === question.correctAnswer 
                                  ? 'bg-green-50 text-green-800 font-medium' 
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {String.fromCharCode(65 + choiceIndex)}. {choice}
                              {choice === question.correctAnswer && ' ✓'}
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStep === 'processing' && (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Questions</h3>
                  <p className="text-gray-600">Please wait while we import your questions...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between">
                {importStep === 'upload' && (
                  <div className="flex justify-end w-full">
                    <button
                      onClick={resetBulkImport}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {importStep === 'preview' && (
                  <>
                    <button
                      onClick={() => setImportStep('upload')}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={resetBulkImport}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkImport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={isProcessingImport}
                      >
                        Import {importPreview.length} Questions
                      </button>
                    </div>
                  </>
                )}

                {importStep === 'processing' && (
                  <div className="flex justify-end w-full">
                    <button
                      onClick={resetBulkImport}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={isProcessingImport}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
