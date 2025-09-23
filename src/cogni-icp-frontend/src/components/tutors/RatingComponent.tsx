import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../shared';
import { TrashIcon } from './icons';
import { TutorRating } from '../../services/tutorService';
import api from '../../utils/apiClient';

interface RatingComponentProps {
  tutorId: string;
  onRatingSubmitted?: () => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({ tutorId, onRatingSubmitted }) => {
  const [ratings, setRatings] = useState<TutorRating[]>([]);
  const [userRating, setUserRating] = useState<TutorRating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await api.get(`/api/tutors/${tutorId}/ratings`);
        setRatings(response.data.ratings || []);
        setUserRating(response.data.user_rating || null);
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    fetchRatings();
  }, [tutorId]);

  const handleSubmitRating = async (rating: number) => {
    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/tutors/${tutorId}/rate`, { rating });
      setUserRating(response.data.rating);
      onRatingSubmitted?.();
      // Refresh ratings to get updated data
      const refreshResponse = await api.get(`/api/tutors/${tutorId}/ratings`);
      setRatings(refreshResponse.data.ratings || []);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/api/tutors/${tutorId}/ratings/${userRating.id}`);
      setUserRating(null);
      // Refresh ratings to get updated data
      const refreshResponse = await api.get(`/api/tutors/${tutorId}/ratings`);
      setRatings(refreshResponse.data.ratings || []);
    } catch (error) {
      console.error('Error deleting rating:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  return (
    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= averageRating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {averageRating.toFixed(1)} ({ratings.length} reviews)
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Rate this tutor:</span>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleSubmitRating(star)}
              disabled={isSubmitting}
              className={`p-1 ${
                star <= (userRating?.rating || 0)
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              <Star className="w-4 h-4" />
            </button>
          ))}
        </div>
        {userRating && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteRating}
            disabled={isDeleting}
            className="ml-2 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="w-3 h-3 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

export default RatingComponent; 