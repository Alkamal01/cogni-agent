import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Star, 
  BookOpen, 
  AlertCircle, 
  XCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, FeatureGate, UsageLimitIndicator, PlanBadge } from '../../components/shared';
import TutorFormModal, { TutorFormData } from '../../components/tutors/TutorFormModal';
import tutorService, { Tutor } from '../../services/tutorService';
import cloudinaryService from '../../services/cloudinaryService';
import { useToast } from '../../hooks/useToast';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';

// Custom icon components
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const PinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>
);

const XPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 8-2 2-2-2-2 2-2-2"></path>
    <path d="m3 16 2-2 2 2 2-2 2 2"></path>
    <path d="M10 2v10.5A4 4 0 0 1 6 16c-2.2 0-4-1.8-4-4V2h8Z"></path>
    <path d="M17.8 2h.2c2.2 0 4 1.8 4 4 0 1.2-.6 2.3-1.5 3L14 16.5V2h3.8Z"></path>
  </svg>
);

const HashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

const TutorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { checkUsageLimit, getFeatureLimit, hasFeatureAccess, showUpgradePrompt } = useSubscription();
  const { backendActor } = useAuth();
  const [tutorToEdit, setTutorToEdit] = useState<Tutor | null>(null);
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch tutors when component mounts
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await tutorService.getAllTutors(backendActor);
        console.log('Tutors fetched from backend:', data);
        setTutors(data);
        
        // Also store tutors in localStorage for frontend access
        localStorage.setItem('tutors', JSON.stringify(data));
        console.log('✅ Stored tutors in localStorage for frontend access');
      } catch (error) {
        console.error('Error fetching tutors:', error);
        setError('Failed to load tutors. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutors();
  }, [backendActor]);

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
        stiffness: 200,
        damping: 20
      }
    }
  };

  // Enhanced modal open function with subscription checks
  const openTutorModal = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Check if user can create more tutors
    const currentTutorCount = tutors.length;
    const usageCheck = checkUsageLimit('tutors', currentTutorCount);
    
    if (!usageCheck.canPerform) {
      showUpgradePrompt('tutors');
      toast({
        title: 'Tutor Limit Reached',
        description: usageCheck.message || 'You have reached your tutor limit.',
        variant: 'warning'
      });
      return;
    }
    
    console.log("Opening tutor creation modal");
    setTutorToEdit(null);
    setIsModalOpen(true);
  }, [tutors.length, checkUsageLimit, showUpgradePrompt, toast]);

  const handleEditTutor = useCallback((tutor: Tutor, e?: React.MouseEvent) => {
    try {
      console.log("Opening edit modal for tutor:", tutor.public_id);
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setTutorToEdit(tutor);
      setTimeout(() => {
        setIsModalOpen(true);
      }, 0);
    } catch (error) {
      console.error("Error in handleEditTutor:", error);
      toast({
        title: 'Error',
        description: 'Failed to open edit form. Please try again.',
        variant: 'error'
      });
    }
  }, [toast]);

  const handleDeleteClick = (tutor: Tutor) => {
    setTutorToDelete(tutor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tutorToDelete) return;
    
    console.log('Attempting to delete tutor:', tutorToDelete);
    console.log('Tutor public_id:', tutorToDelete.public_id);
    console.log('Tutor id:', tutorToDelete.id);
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      // Use the id field as fallback if public_id is undefined
      const tutorId = tutorToDelete.public_id || tutorToDelete.id?.toString();
      console.log('Using tutor ID for deletion:', tutorId);
      
      if (!tutorId) {
        throw new Error('No valid tutor ID found');
      }
      
      await tutorService.deleteTutor(tutorId, backendActor);
      setTutors(prevTutors => prevTutors.filter(t => 
        (t.public_id || t.id?.toString()) !== (tutorToDelete.public_id || tutorToDelete.id?.toString())
      ));
      toast({
        title: 'Success',
        description: `Tutor "${tutorToDelete.name}" deleted successfully`,
        variant: 'success'
      });
      setIsDeleteModalOpen(false);
      setTutorToDelete(null);
    } catch (error: any) {
      console.error('Error deleting tutor:', error);
      let errorMessage = 'Failed to delete tutor. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setDeleteError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTutor = async (data: TutorFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting tutor creation with data:', data);
      
      // Handle image upload to Cloudinary if imageFile is provided
      let imageUrl = data.imageUrl;
      if (data.imageFile) {
        try {
          console.log('📤 Uploading image to Cloudinary...');
          const uploadResult = await cloudinaryService.uploadImage(data.imageFile, 'cogniedufy/tutors');
          imageUrl = uploadResult.secure_url;
          console.log('✅ Image uploaded successfully:', imageUrl);
        } catch (error) {
          console.error('❌ Failed to upload image to Cloudinary:', error);
          // Fallback to data URL if Cloudinary fails
          const reader = new FileReader();
          imageUrl = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(data.imageFile!);
          });
          console.log('⚠️ Using fallback data URL for image');
        }
      }
      
      // Format any data if needed before sending
      const formattedData = {
        ...data,
        imageUrl: imageUrl,
        expertise: Array.isArray(data.expertise) ? data.expertise.filter(item => item && typeof item === 'string' ? item.trim() !== '' : false) : [],
        // Convert File items to null for API consumption - in real app, you'd upload these files
        knowledgeBase: Array.isArray(data.knowledgeBase) ? data.knowledgeBase.map(item => 
          item instanceof File ? null : (typeof item === 'string' ? item : null)
        ).filter(Boolean) : []
      };
      
      console.log('Formatted data for tutor creation:', formattedData);
      
      if (tutorToEdit) {
        // Update existing tutor
        const formData = new FormData();
        formData.append('name', formattedData.name);
        formData.append('description', formattedData.description);
        formData.append('teachingStyle', formattedData.teachingStyle);
        formData.append('personality', formattedData.personality);
        formData.append('expertise', JSON.stringify(formattedData.expertise));
        formData.append('knowledgeBase', JSON.stringify(formattedData.knowledgeBase));
        
        if (formattedData.voice_id) {
          formData.append('voice_id', formattedData.voice_id);
        }
        
        if (formattedData.voice_settings) {
          formData.append('voice_settings', JSON.stringify(formattedData.voice_settings));
        }
        
        if (formattedData.imageFile) {
          formData.append('avatar', formattedData.imageFile);
        }

        const updatedTutor = await tutorService.updateTutor(tutorToEdit.public_id, formData);
        setTutors(prevTutors => 
          prevTutors.map(t => t.id === updatedTutor.id ? updatedTutor : t)
        );
        toast({
          title: 'Success',
          description: `Tutor "${updatedTutor.name}" updated successfully`,
          variant: 'success'
        });
      } else {
        // Create new tutor
        const createdTutor = await tutorService.createTutor(formattedData, backendActor);
        setTutors(prevTutors => [...prevTutors, createdTutor]);
        
        // Store the new tutor in localStorage for frontend access
        const existingTutors = JSON.parse(localStorage.getItem('tutors') || '[]');
        existingTutors.push(createdTutor);
        localStorage.setItem('tutors', JSON.stringify(existingTutors));
        console.log('✅ Stored new tutor in localStorage:', createdTutor.public_id);
        
        // Automatically generate course outline for the new tutor
        try {
          const userSettings = {
            learning_style: 'visual', // Default learning style
            difficulty_level: 'intermediate', // Default difficulty
            ai_interaction_style: 'friendly' // Default AI style
          };
          
          const courseOutline = await tutorService.generateAiCourseOutline(
            createdTutor.public_id, 
            'Introduction to ' + createdTutor.expertise[0], // Use first expertise area
            backendActor
          );
          
          console.log('Auto-generated course outline:', courseOutline);
          toast({
            title: 'Course Generated',
            description: `Course outline generated for ${createdTutor.name}`,
            variant: 'info'
          });
        } catch (courseError) {
          console.warn('Failed to auto-generate course outline:', courseError);
          // Don't show error to user, course generation is optional
        }
        
        toast({
          title: 'Success',
          description: `Tutor "${createdTutor.name}" created successfully`,
          variant: 'success'
        });
      }
      
      // Close the modal and reset edit state
      setIsModalOpen(false);
      setTutorToEdit(null);
    } catch (error: any) {
      console.error('Error saving tutor:', error);
      
      let errorMessage = tutorToEdit 
        ? 'Failed to update tutor. Please try again.' 
        : 'Failed to create tutor. Please try again.';
      
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
        
        // Use the error message from the server if available
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTutorToEdit(null);
  };

  const handleTogglePin = async (tutor: Tutor, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const updatedTutor = await tutorService.togglePin(tutor.public_id);
      setTutors(prevTutors => 
        prevTutors.map(t => t.public_id === tutor.public_id ? updatedTutor : t)
      );
      
      toast({
        title: 'Success',
        description: `Tutor ${updatedTutor.is_pinned ? 'pinned' : 'unpinned'} successfully`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tutor pin status',
        variant: 'error'
      });
    }
  };

  const filteredTutors = tutors.filter(tutor => {
    // Filter by search query
    const matchesSearch = 
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tutor.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesFilter = 
      selectedFilter === 'all' ||
      (selectedFilter === 'science' && tutor.expertise.some(exp => ['Physics', 'Chemistry', 'Biology'].includes(exp))) ||
      (selectedFilter === 'math' && tutor.expertise.some(exp => ['Mathematics', 'Statistics'].includes(exp))) ||
      (selectedFilter === 'cs' && tutor.expertise.some(exp => ['Computer Science', 'Programming'].includes(exp)));
    
    return matchesSearch && matchesFilter;
  });

  // Update the renderRatingStars function to use the tutor's rating from the API
  const renderRatingStars = (tutor: Tutor) => {
    // Use the tutor's actual rating from the backend, or default to 0 if not available
    const rating = tutor.rating || 0;
    const fullStars = Math.floor(rating);
    const partialStar = rating % 1;
    
    return (
      <div className="flex items-center">
        {/* Full stars */}
        {Array(fullStars).fill(0).map((_, i) => (
          <Star key={`full-${i}`} className="w-3.5 h-3.5 text-yellow-500 fill-current" />
        ))}
        
        {/* Partial star if needed */}
        {partialStar > 0 && (
          <div className="relative w-3.5 h-3.5">
            {/* Background star (empty) */}
            <Star className="w-3.5 h-3.5 text-yellow-500 absolute top-0 left-0" />
            {/* Foreground star (filled) with width based on rating */}
            <div className="overflow-hidden absolute top-0 left-0" style={{ width: `${partialStar * 100}%` }}>
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array(5 - Math.ceil(rating)).fill(0).map((_, i) => (
          <Star key={`empty-${i}`} className="w-3.5 h-3.5 text-yellow-500" />
        ))}
        
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
          {rating.toFixed(1)} {tutor.rating_count ? `(${tutor.rating_count})` : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <TutorFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleCreateTutor}
        initialData={tutorToEdit ? {
          id: tutorToEdit.id,
          public_id: tutorToEdit.public_id,
          name: tutorToEdit.name,
          expertise: tutorToEdit.expertise,
          teachingStyle: tutorToEdit.teaching_style,
          personality: tutorToEdit.personality,
          description: tutorToEdit.description,
          knowledgeBase: tutorToEdit.knowledge_base ? tutorToEdit.knowledge_base.map(item => item as string) : [],
          imageUrl: tutorToEdit.avatar_url
        } : undefined}
      />
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && tutorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 shadow-xl z-[101]">
            <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
              <AlertTriangleIcon />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete the tutor "{tutorToDelete.name}"? This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{deleteError}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTutorToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Tutor"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Tutors</h1>
                <PlanBadge />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Find the perfect AI tutor tailored to your learning needs.</p>
            </div>
            <div className="relative" style={{ zIndex: 20 }}>
            <Button 
              variant="gradient" 
                onClick={openTutorModal}
                className="mt-4 md:mt-0 relative"
                style={{ zIndex: 20 }}
              disabled={isLoading}
            >
                <span className="flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Tutor
                </span>
            </Button>
            </div>
          </div>
          
          {/* Usage Limit Indicator */}
          <UsageLimitIndicator 
            feature="tutors" 
            currentUsage={tutors.length} 
            showDetails={true} 
          />
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by name, expertise, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="sm:w-48 flex-shrink-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📊</span>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Subjects</option>
                  <option value="science">Science</option>
                  <option value="math">Mathematics</option>
                  <option value="cs">Computer Science</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Loading state */}
        {isLoading && (
          <motion.div 
            variants={itemVariants}
            className="flex justify-center items-center py-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div 
            variants={itemVariants}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center text-red-700 dark:text-red-400"
          >
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
        
        {/* No results state */}
        {!isLoading && !error && filteredTutors.length === 0 && (
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center"
          >
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tutors found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't find any tutors matching your criteria. Try adjusting your filters or create a custom tutor.
            </p>
            <div className="relative" style={{ zIndex: 20 }}>
            <Button
              variant="primary"
                onClick={openTutorModal}
                className="mx-auto relative"
                style={{ zIndex: 20 }}
            >
                <span className="flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Tutor
                </span>
            </Button>
            </div>
          </motion.div>
        )}
        
        {/* Tutors grid */}
        {!isLoading && !error && filteredTutors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <motion.div
                key={tutor.id}
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col cursor-default"
              >
                <div className="flex p-4 pb-3">
                  {/* Avatar section */}
                  <div className="relative mr-3">
                    <img
                      src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`}
                      alt={`${tutor.name} avatar`}
                      className="w-20 h-20 rounded-md object-cover border-2 border-primary-100 dark:border-primary-900 shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`;
                      }}
                    />
                    {tutor.is_pinned && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-sm">
                        <PinIcon />
                      </span>
                    )}
                  </div>

                  {/* Main info section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{tutor.name}</h3>
                      <div className="flex space-x-1 ml-1 flex-shrink-0">
                        <FeatureGate 
                          feature="custom_tutors" 
                          fallback={
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                showUpgradePrompt('custom_tutors');
                              }}
                              className="p-1 rounded text-gray-300 dark:text-gray-600"
                              title="Pin tutor (Pro feature)"
                            >
                              <PinIcon />
                            </button>
                          }
                        >
                          <button 
                            onClick={(e) => {
                              handleTogglePin(tutor, e);
                            }}
                            className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title={tutor.is_pinned ? "Unpin tutor" : "Pin tutor"}
                          >
                            <PinIcon />
                          </button>
                        </FeatureGate>
                        <button 
                          onClick={(e) => {
                            handleEditTutor(tutor, e);
                          }}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit tutor"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={(e) => {
                            handleDeleteClick(tutor);
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete tutor"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {/* Rating - Update to pass the entire tutor object instead of just the ID */}
                    <div className="flex items-center mt-0.5 mb-1.5">
                      {renderRatingStars(tutor)}
                    </div>

                    {/* Teaching style and personality */}
                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                      <div className="inline-flex items-center px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs rounded-full">
                        <GraduationCap className="w-2.5 h-2.5 mr-1" />
                        {tutor.teaching_style}
                      </div>
                      <div className="inline-flex items-center px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full">
                        <Star className="w-2.5 h-2.5 mr-1" />
                        {tutor.personality}
                      </div>
                  </div>
                  
                    {/* Expertise */}
                    <div className="flex flex-wrap gap-1">
                    {tutor.expertise.slice(0, 3).map((skill, i) => (
                      <span 
                        key={i} 
                          className="px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {tutor.expertise.length > 3 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                        +{tutor.expertise.length - 3}
                      </span>
                    )}
                    </div>
                  </div>
                  </div>
                  
                {/* Description */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {tutor.description}
                  </p>
                </div>
                
                {/* Actions footer */}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tutor.created_at).toLocaleDateString()}
                  </div>
                    <Button
                    variant="primary"
                    size="md"
                      onClick={() => navigate(`/tutors/${tutor.public_id}`)}
                    className="py-1.5 px-4 text-sm font-medium"
                    >
                      <span className="flex items-center justify-center">
                      Start Learning
                      </span>
                    </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TutorsPage; 