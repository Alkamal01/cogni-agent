import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trash, RotateCcw, TrendingUp, ArrowRight, ChevronDown } from 'lucide-react';
import { Button, Card } from '../shared';
import studySetService, { StudySet, StudyFlashcard } from '../../services/studySetService';

interface FlashcardsListProps {
  studySet: StudySet;
  onUpdate: () => void;
}

const FlashcardsList: React.FC<FlashcardsListProps> = ({ studySet, onUpdate }) => {
  const flashcards = studySet.flashcards || [];
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const toggleFlip = (cardId: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

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
  const handleCreateFlashcards = async () => {
    console.log('🚀 BUTTON CLICKED: Create Flashcards');
    try {
      console.log('Creating flashcards for study set:', studySet.title);
      console.log('Study Set ID:', studySet.public_id);


      console.log('Making API call to generate flashcards...');

      // Call the API to generate flashcards
      const result = await studySetService.generateFlashcardsFromContent(studySet.public_id, {
        source_type: 'all', // Use 'all' to include both recordings and notes
        source_id: 'all',   // This parameter isn't used by backend, but keeping for compatibility
        card_count: 10,
        difficulty: 'medium'
      });
      console.log('API call successful:', result);

      // Show success message
      // alert removed per request

      // Refresh the study set data
      onUpdate();
    } catch (error) {
      console.error('Error creating flashcards:', error);
      const errMsg = (typeof error === 'object' && error !== null && 'response' in error)
        ? ((error as any).response?.data || (error as any).message)
        : (error as any)?.message || String(error);
      console.error('Error details:', errMsg);
      alert(`❌ Failed to create flashcards\n\nError: ${errMsg}\n\nPlease check the console for more details.`);
    }
  };

  const handleStartStudySession = () => {
    console.log('Starting study session');
    alert('Starting Study Session\n\nThis will begin an interactive flashcard study session with spaced repetition.');
    // TODO: Implement study session
  };

  const handleReviewDueCards = () => {
    console.log('Reviewing due cards');
    alert('Review Due Cards\n\nThis will show flashcards that are due for review based on your learning progress.');
    // TODO: Implement due card review
  };

  const handleExportDeck = () => {
    console.log('Exporting flashcard deck');
    alert('Export Deck\n\nThis will export your flashcards to various formats (Anki, CSV, etc.).');
    // TODO: Implement deck export
  };

  const handleCreateGame = () => {
    console.log('Creating game from flashcards');
    alert('Create Game\n\nThis will create an interactive game using your flashcards for fun learning.');
    // TODO: Implement game creation
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No flashcards yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Generate flashcards from your content for spaced repetition learning
        </p>
        <Button
          className="flex items-center gap-2"
          onClick={handleCreateFlashcards}
        >
          <Zap className="h-4 w-4" />
          Create Flashcards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Study Session Controls */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {flashcards.length} Flashcards
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ready for your study session
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-2"
            onClick={handleStartStudySession}
          >
            <ArrowRight className="h-4 w-4" />
            Start Study Session
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleReviewDueCards}
          >
            <RotateCcw className="h-4 w-4" />
            Review Due Cards
          </Button>
        </div>
      </div>

      {/* Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((flashcard, index) => (
          <motion.div
            key={flashcard.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative h-64 cursor-pointer group" onClick={() => toggleFlip(flashcard.id)}>
              <div className="absolute inset-0 p-4 flex flex-col">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(flashcard.difficulty)}`}>
                      {flashcard.difficulty}
                    </span>
                    {flashcard.category && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                        {flashcard.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <span className="text-lg">✏️</span>
                    </Button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    {!flippedCards.has(flashcard.id) ? (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Question</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {flashcard.front_text}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Answer</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {flashcard.back_text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>{flashcard.accuracy.toFixed(0)}% accuracy</span>
                  </div>
                  <span>{flashcard.times_reviewed} reviews</span>
                </div>

                {/* Tags */}
                {flashcard.tags && flashcard.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-lg">#</span>
                    <div className="flex flex-wrap gap-1">
                      {flashcard.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {flashcard.tags.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{flashcard.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Flip indicator */}
                <div className="absolute bottom-2 right-2 opacity-50">
                  <RotateCcw className="h-4 w-4" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {flashcards.length} flashcards • Average accuracy: {
            flashcards.length > 0 
              ? (flashcards.reduce((sum, card) => sum + card.accuracy, 0) / flashcards.length).toFixed(0)
              : 0
          }%
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleExportDeck}
          >
            <ChevronDown className="h-4 w-4" />
            Export Deck
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleCreateGame}
          >
            <Zap className="h-4 w-4" />
            Create Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsList;
