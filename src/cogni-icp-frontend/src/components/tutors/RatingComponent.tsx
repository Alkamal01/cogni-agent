import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../shared';
import { TrashIcon } from './icons';
import { TutorRating } from '../../services/tutorService';

interface RatingComponentProps {
  tutorId: string;
  onRatingSubmitted?: () => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({ tutorId, onRatingSubmitted }) => {
  const [ratings, setRatings] = useState<TutorRating[]>([]);
  const [userRating, setUserRating] = useState<TutorRating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // For now, ratings are not implemented in the ICP backend
  // This prevents CORS errors from localhost API calls
  useEffect(() => {
    // Initialize with empty ratings for now
    setRatings([]);
    setUserRating(null);
  }, [tutorId]);

  const handleSubmitRating = async (rating: number) => {
    // TODO: Implement rating functionality when backend supports it
    console.log('Rating functionality not yet implemented in ICP backend');
    alert('Rating functionality will be available soon!');
  };

  const handleDeleteRating = async () => {
    // TODO: Implement delete rating functionality when backend supports it
    console.log('Delete rating functionality not yet implemented in ICP backend');
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
      
      {/* Info message about ratings */}
      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
        ⓘ Rating functionality will be available in the next update
      </div>
    </div>
  );
};

export default RatingComponent; 