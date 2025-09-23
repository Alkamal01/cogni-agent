import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Brain,
  Clock,
  Users
} from 'lucide-react';
import { Button, Input, Card } from '../components/shared';
import { useToast } from '../hooks/useToast';
import studySetService, { StudySet } from '../services/studySetService';
import CreateStudySetModal from '../components/study-sets/CreateStudySetModal';
import { useNavigate } from 'react-router-dom';

const StudySets: React.FC = () => {
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Fetch study sets
  const fetchStudySets = async () => {
    try {
      setLoading(true);
      const response = await studySetService.getStudySets({
        search: searchTerm,
        subject: selectedSubject
      });
      // Ensure we always have an array, even if the API returns undefined/null
      setStudySets(Array.isArray(response.study_sets) ? response.study_sets : []);
    } catch (error) {
      console.error('Error fetching study sets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load study sets',
        variant: 'error'
      });
      // Set empty array on error to prevent undefined access
      setStudySets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudySets();
  }, [searchTerm, selectedSubject]);

  // Handle create study set
  const handleCreateStudySet = async (data: any) => {
    try {
      const newStudySet = await studySetService.createStudySet(data);
      if (newStudySet) {
        setStudySets(prev => [newStudySet, ...prev]);
        setIsCreateModalOpen(false);
        toast({
          title: 'Success',
          description: 'Study set created successfully!',
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Error creating study set:', error);
      toast({
        title: 'Error',
        description: 'Failed to create study set',
        variant: 'error'
      });
    }
  };

  // Handle study set click
  const handleStudySetClick = (studySet: StudySet) => {
    navigate(`/study-sets/${studySet.public_id}`);
  };

  // Get unique subjects for filter
  const subjects = Array.from(new Set(studySets.filter(set => set && set.subject).map(set => set.subject)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Study Sets
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Record lectures, generate notes, and create interactive learning materials
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Study Set
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* Replacing Search icon with emoji fallback */}
                <span className="h-4 w-4 text-gray-400 dark:text-gray-500">🔍</span>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm"
                placeholder="Search by title, subject, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                {/* Replacing Filter icon with emoji fallback */}
                <span className="h-4 w-4">🧹</span>
                Filter
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Study Sets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-48">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : studySets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No study sets yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first study set to start recording lectures and generating learning materials
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Study Set
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {studySets.filter(studySet => studySet).map((studySet) => (
              <motion.div
                key={studySet.id}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                onClick={() => handleStudySetClick(studySet)}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📚</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {studySet.subject || 'General'}
                    </span>
                  </div>
                  
                  {studySet.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {studySet.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">🎤</span>
                      <span>{studySet.recordings?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">📄</span>
                      <span>{studySet.notes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      <span>{studySet.quizzes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">⚡</span>
                      <span>{studySet.flashcards?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Study Set Modal */}
      <CreateStudySetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStudySet}
      />
    </div>
  );
};

export default StudySets;
