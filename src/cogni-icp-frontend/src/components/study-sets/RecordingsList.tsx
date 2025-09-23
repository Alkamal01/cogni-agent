import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, BookOpen, Brain, Trash, Clock } from 'lucide-react';
import { Button, Card } from '../shared';
import studySetService, { StudySet, StudyRecording } from '../../services/studySetService';

interface RecordingsListProps {
  studySet: StudySet;
  onUpdate: () => void;
}

const RecordingsList: React.FC<RecordingsListProps> = ({ studySet, onUpdate }) => {
  const recordings = studySet.recordings || [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Handler functions
  const handleTestAPI = async () => {
    console.log('🔥 Testing API connection...');
    try {
      const result = await studySetService.testConnection();
      alert(`✅ API Test Successful!\n\nResponse: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('API Test failed:', error);
      const errMsg = (typeof error === 'object' && error !== null && 'response' in error)
        ? ((error as any).response?.data?.message || (error as any).message)
        : (error as any)?.message || String(error);
      alert(`❌ API Test Failed!\n\nError: ${errMsg}`);
    }
  };

  const handlePlayRecording = (recording: StudyRecording) => {
    // TODO: Implement audio playback
    console.log('Playing recording:', recording.title);
    alert(`Playing: ${recording.title}\n\nThis feature will be implemented with audio player functionality.`);
  };

  const handleGenerateNotes = async (recording: StudyRecording) => {
    console.log('🚀 BUTTON CLICKED: Generate Notes');
    try {
      console.log('Generating notes for recording:', recording.title);
      console.log('Study Set ID:', studySet.public_id);
      console.log('Recording ID:', recording.public_id);


      console.log('Making API call to generate notes...');

      // Call the API to generate notes
      const result = await studySetService.generateNotesFromRecording(studySet.public_id, recording.public_id);
      console.log('API call successful:', result);

      // Show success message
      // alert removed per request

      // Refresh the study set data
      onUpdate();
    } catch (error) {
      console.error('Error generating notes:', error);
      const errMsg = (typeof error === 'object' && error !== null && 'response' in error)
        ? ((error as any).response?.data?.message || (error as any).message)
        : (error as any)?.message || String(error);
      console.error('Error details:', errMsg);
      alert(`❌ Failed to generate notes\n\nError: ${errMsg}\n\nPlease check the console for more details.`);
    }
  };

  const handleCreateQuiz = async (recording: StudyRecording) => {
    console.log('🚀 BUTTON CLICKED: Create Quiz');
    try {
      console.log('Creating quiz for recording:', recording.title);
      console.log('Study Set ID:', studySet.public_id);
      console.log('Recording ID:', recording.public_id);


      console.log('Making API call to generate quiz...');

      // Call the API to generate quiz
      const result = await studySetService.generateQuizFromRecording(studySet.public_id, recording.public_id);
      console.log('API call successful:', result);

      // Show success message
      // alert removed per request

      // Refresh the study set data
      onUpdate();
    } catch (error) {
      console.error('Error creating quiz:', error);
      const errMsg = (typeof error === 'object' && error !== null && 'response' in error)
        ? ((error as any).response?.data?.message || (error as any).message)
        : (error as any)?.message || String(error);
      console.error('Error details:', errMsg);
      alert(`❌ Failed to create quiz\n\nError: ${errMsg}\n\nPlease check the console for more details.`);
    }
  };

  const handleDownload = (recording: StudyRecording) => {
    console.log('Downloading recording:', recording.title);
    alert(`Downloading: ${recording.title}\n\nThis will download the audio file to your device.`);
    // TODO: Implement file download
    // const link = document.createElement('a');
    // link.href = recording.file_path;
    // link.download = `${recording.title}.webm`;
    // link.click();
  };

  const handleDelete = async (recording: StudyRecording) => {
    if (window.confirm(`Are you sure you want to delete "${recording.title}"?`)) {
      try {
        console.log('Deleting recording:', recording.title);
        alert(`Deleting: ${recording.title}\n\nThis will permanently remove the recording.`);
        // TODO: Implement recording deletion
        // await studySetService.deleteRecording(studySet.public_id, recording.public_id);
        // onUpdate();
      } catch (error) {
        console.error('Error deleting recording:', error);
      }
    }
  };

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎤</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No recordings yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start recording lectures to generate notes, quizzes, and flashcards
        </p>
        <Button onClick={handleTestAPI} variant="outline" className="mb-4">
          🔧 Test API Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recordings.map((recording, index) => (
        <motion.div
          key={recording.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {recording.title}
                </h3>
                {recording.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {recording.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(recording.duration)}</span>
                  </div>
                  <span>{formatFileSize(recording.file_size)}</span>
                  <span>{new Date(recording.recorded_at).toLocaleDateString()}</span>
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                    recording.transcription_status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : recording.transcription_status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    Transcription: {recording.transcription_status}
                  </span>

                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                    recording.summary_status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : recording.summary_status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    Summary: {recording.summary_status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handlePlayRecording(recording)}
                >
                  <ArrowRight className="h-4 w-4" />
                  Play
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleGenerateNotes(recording)}
                >
                  <BookOpen className="h-4 w-4" />
                  Generate Notes
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleCreateQuiz(recording)}
                >
                  <Brain className="h-4 w-4" />
                  Create Quiz
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleDownload(recording)}
                >
                  <ChevronDown className="h-4 w-4" />
                  Download
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(recording)}
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Transcription preview */}
            {recording.transcription_text && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Transcription Preview
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {recording.transcription_text}
                </p>
              </div>
            )}

            {/* Summary preview */}
            {recording.summary_text && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  AI Summary
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {recording.summary_text}
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default RecordingsList;
