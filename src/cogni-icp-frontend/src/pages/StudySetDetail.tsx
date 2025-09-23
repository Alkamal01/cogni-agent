import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  Plus,
  ChevronDown,
  X,
  Trash
} from 'lucide-react';
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '../components/shared';
import { useToast } from '../hooks/useToast';
import studySetService, { StudySet } from '../services/studySetService';
import LiveRecorder from '../components/study-sets/LiveRecorder';
import RecordingsList from '../components/study-sets/RecordingsList';
import NotesList from '../components/study-sets/NotesList';
import QuizzesList from '../components/study-sets/QuizzesList';
import FlashcardsList from '../components/study-sets/FlashcardsList';

const StudySetDetail: React.FC = () => {
  const { studySetId } = useParams<{ studySetId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recordings');
  const [showRecorder, setShowRecorder] = useState(false);

  // Fetch study set data
  const fetchStudySet = async () => {
    if (!studySetId) return;

    try {
      setLoading(true);
      const data = await studySetService.getStudySet(studySetId);
      setStudySet(data);
    } catch (error) {
      console.error('Error fetching study set:', error);
      toast({
        title: 'Error',
        description: 'Failed to load study set',
        variant: 'error'
      });
      navigate('/study-sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudySet();
  }, [studySetId]);

  // Handle recording completion
  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!studySet) return;

    try {
      const title = `Recording ${new Date().toLocaleString()}`;
      // Convert Blob to File
      const audioFile = new File([audioBlob], `${title}.webm`, { type: 'audio/webm' });
      await studySetService.uploadRecording(studySet.public_id, audioFile, {
        title,
        duration,
        file_type: 'audio'
      });

      toast({
        title: 'Success',
        description: 'Recording saved successfully!',
        variant: 'success'
      });

      setShowRecorder(false);
      fetchStudySet(); // Refresh data
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recording',
        variant: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!studySet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Study Set Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The study set you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/study-sets')}>
            Back to Study Sets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/study-sets')}
              className="flex items-center gap-2"
            >
              <span className="text-lg">←</span>
              Back to Study Sets
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {studySet.title}
              </h1>
              {studySet.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {studySet.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {studySet.subject && (
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                    {studySet.subject}
                  </span>
                )}
                <span>Created {new Date(studySet.created_at).toLocaleDateString()}</span>
                <span>Updated {new Date(studySet.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setShowRecorder(true)} className="flex items-center gap-2">
                <span className="text-lg">🎤</span>
                Record New Session
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <span className="text-lg">📤</span>
                Share
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                Settings
              </Button>
              <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <span className="text-lg">🎤</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studySet.recordings_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recordings</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-lg">📄</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studySet.notes_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studySet.quizzes_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studySet.flashcards_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Flashcards</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Live Recorder Modal */}
        {showRecorder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full"
            >
              <LiveRecorder
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setShowRecorder(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recordings" className="flex items-center gap-2">
                <span className="text-lg">🎤</span>
                Recordings
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Flashcards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recordings" className="mt-6">
              <RecordingsList 
                studySet={studySet} 
                onUpdate={fetchStudySet}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <NotesList 
                studySet={studySet} 
                onUpdate={fetchStudySet}
              />
            </TabsContent>

            <TabsContent value="quizzes" className="mt-6">
              <QuizzesList 
                studySet={studySet} 
                onUpdate={fetchStudySet}
              />
            </TabsContent>

            <TabsContent value="flashcards" className="mt-6">
              <FlashcardsList 
                studySet={studySet} 
                onUpdate={fetchStudySet}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default StudySetDetail;
