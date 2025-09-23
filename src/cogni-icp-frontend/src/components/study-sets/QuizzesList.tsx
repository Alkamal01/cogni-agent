import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, BookOpen, ChevronDown, Trash, Clock, Users } from 'lucide-react';
import { Button, Card } from '../shared';
import studySetService, { StudySet, StudyQuiz } from '../../services/studySetService';

interface QuizzesListProps {
  studySet: StudySet;
  onUpdate: () => void;
}

const QuizzesList: React.FC<QuizzesListProps> = ({ studySet, onUpdate }) => {
  const navigate = useNavigate();
  const quizzes = studySet.quizzes || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Handler functions
  const handleCreateQuiz = async () => {
    try {
      console.log('Creating quiz for study set:', studySet.title);

      // Call the API to generate quiz directly
      await studySetService.generateQuizFromContent(studySet.public_id, {
        source_type: 'all',
        source_id: 'all',
        question_count: 5,
        difficulty: 'medium'
      });

      // Show success message
      // alert removed per request

      // Refresh the study set data
      onUpdate();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(`❌ Failed to create quiz\n\nThere was an error generating quiz questions. Please try again.`);
    }
  };

  const handleTakeQuiz = async (quiz: StudyQuiz) => {
    try {
      console.log('Taking quiz:', quiz.title);
      navigate(`/study-sets/${studySet.public_id}/quizzes/${quiz.public_id}/take`);
    } catch (error) {
      console.error('Error starting/taking quiz:', error);
    }
  };

  const handleEditQuiz = (quiz: StudyQuiz) => {
    console.log('Editing quiz:', quiz.title);
    // TODO: Implement quiz editing
  };

  const handleShareQuiz = (quiz: StudyQuiz) => {
    console.log('Sharing quiz:', quiz.title);
    // TODO: Implement quiz sharing
  };

  const handleDeleteQuiz = async (quiz: StudyQuiz) => {
    try {
      console.log('Deleting quiz:', quiz.title);
      await studySetService.deleteQuiz(studySet.public_id, quiz.public_id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const getQuizTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'fill_blank':
        return 'Fill in the Blank';
      default:
        return type;
    }
  };

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No quizzes yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Generate quizzes from your recordings and notes to test your knowledge
        </p>
        <Button
          className="flex items-center gap-2"
          onClick={handleCreateQuiz}
        >
          <Brain className="h-4 w-4" />
          Create Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz, index) => (
        <motion.div
          key={quiz.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {quiz.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {getQuizTypeLabel(quiz.quiz_type)}
                  </span>
                </div>
                
                {quiz.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {quiz.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  {quiz.time_limit && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.time_limit} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{quiz.attempts_count} attempts</span>
                  </div>
                  <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                </div>

                {/* Quiz settings */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {quiz.randomize_questions && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      Randomized
                    </span>
                  )}
                  {quiz.show_correct_answers && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      Shows Answers
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  className="flex items-center gap-2"
                  onClick={() => handleTakeQuiz(quiz)}
                >
                  <ArrowRight className="h-4 w-4" />
                  Take Quiz
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleEditQuiz(quiz)}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleShareQuiz(quiz)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteQuiz(quiz)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Question preview */}
            {quiz.questions && quiz.questions.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Sample Question:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {quiz.questions[0].question}
                </p>
                {quiz.questions[0].options && (
                  <div className="space-y-1">
                    {quiz.questions[0].options.slice(0, 2).map((option, optionIndex) => (
                      <div key={optionIndex} className="text-xs text-gray-500 dark:text-gray-500">
                        • {option}
                      </div>
                    ))}
                    {quiz.questions[0].options.length > 2 && (
                      <div className="text-xs text-gray-400 dark:text-gray-600">
                        +{quiz.questions[0].options.length - 2} more options...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default QuizzesList;
