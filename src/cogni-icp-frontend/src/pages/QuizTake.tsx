import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import studySetService, { StudyQuiz } from '../services/studySetService';
import { Button, Card } from '../components/shared';
import { ArrowRight, Brain, X, Clock } from 'lucide-react';

const QuizTake: React.FC = () => {
  const navigate = useNavigate();
  const { studySetId, quizId } = useParams();
  const [quiz, setQuiz] = useState<StudyQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startedAt] = useState<number>(() => Date.now());

  const loadQuiz = useCallback(async () => {
    if (!studySetId || !quizId) return;

    try {
      setLoading(true);
      const q = await studySetService.getQuiz(studySetId, quizId);
      setQuiz(q);

      // Initialize answers with proper IDs
      const initial: Record<string, any> = {};
      (q.questions || []).forEach((qq: any, index: number) => {
        // Use the same ID logic as the backend
        let id = qq.id;
        if (!id) {
          id = `question-${index}`;
          // Update the question object to have the ID for consistency
          qq.id = id;
        }
        initial[String(id)] = '';
      });
      setAnswers(initial);
    } catch (e) {
      console.error('Failed to load quiz', e);
    } finally {
      setLoading(false);
    }
  }, [studySetId, quizId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const handleChange = (qid: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async () => {
    if (!studySetId || !quizId) return;
    setIsSubmitting(true);
    try {
      const timeTaken = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

      // Debug logging
      console.log('🔍 Quiz questions:', quiz?.questions);
      console.log('🔍 Frontend answers:', answers);

      const res = await studySetService.submitQuizAnswers(studySetId, quizId, { answers, time_taken: timeTaken });
      setResult(res);
    } catch (e) {
      console.error('Failed to submit quiz', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (q: any, idx: number) => {
    // Use the same ID logic as initialization
    let qid = q.id;
    if (!qid) {
      qid = `question-${idx}`;
      q.id = qid; // Ensure consistency
    }
    qid = String(qid);
    const type = (q.type || '').toLowerCase();

    return (
      <motion.div
        key={qid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        <Card className="p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                {idx + 1}
              </span>
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {q.question}
              </span>
            </div>
          </div>

          {type === 'multiple_choice' && Array.isArray(q.options) && (
            <div className="space-y-3">
              {q.options.map((opt: string, i: number) => (
                <label
                  key={`${qid}-option-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`q-${qid}`}
                    value={opt}
                    checked={answers[qid] === opt}
                    onChange={(e) => handleChange(qid, e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {type === 'true_false' && (
            <div className="space-y-3">
              {['True', 'False'].map((opt) => (
                <label
                  key={`${qid}-${opt}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`q-${qid}`}
                    value={opt}
                    checked={answers[qid] === opt}
                    onChange={(e) => handleChange(qid, e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {type !== 'multiple_choice' && type !== 'true_false' && (
            <div>
              <textarea
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                value={answers[qid] || ''}
                onChange={(e) => handleChange(qid, e.target.value)}
                placeholder="Type your answer here..."
              />
            </div>
          )}
        </Card>
      </motion.div>
    );
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading quiz...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {quiz.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.questions?.length || 0} questions</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                result.score_percent >= 70
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {result.score_percent >= 70 ? (
                  <Brain className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Quiz Complete!
              </h2>
              <div className="text-4xl font-bold mb-2">
                <span className={result.score_percent >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {Math.round(result.score_percent)}%
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                You scored {result.points_earned || 0} out of {result.total_points || 0} points
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Question Review
              </h3>
              {result.results?.map((r: any, i: number) => (
                <div
                  key={`result-${i}`}
                  className={`p-4 rounded-lg border ${
                    r.correct
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      r.correct ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {r.correct ? (
                        <span className="text-white text-sm">✓</span>
                      ) : (
                        <X className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        Question {i + 1}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Your answer: <span className="font-medium">{String(r.user_answer)}</span>
                      </div>
                      {!r.correct && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Correct answer: <span className="font-medium text-green-600 dark:text-green-400">
                            {Array.isArray(r.expected) ? r.expected.join(', ') : String(r.expected)}
                          </span>
                        </div>
                      )}
                      {r.feedback && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          {r.feedback}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Points: {r.points_awarded} / {r.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => navigate(-1)} className="px-8">
                Back to Study Set
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Questions */}
            <div className="space-y-6 mb-8">
              {(quiz.questions || []).map((q: any, idx: number) => renderQuestion(q, idx))}
            </div>

            {/* Submit Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(answers).filter(key => answers[key]).length} of {quiz.questions?.length || 0} questions answered
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizTake; 