import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseGenerationService } from '../../services/courseGenerationService';
import { TopicValidation, TopicSuggestion } from '../../services/tutorService';
import { useToast } from '../../hooks/useToast';
import Card from '../shared/Card';
import Button from '../shared/Button';

interface TopicValidatorProps {
  tutorId: string;
  onTopicValidated?: (validation: TopicValidation) => void;
  onClose?: () => void;
}

const TopicValidator: React.FC<TopicValidatorProps> = ({ 
  tutorId, 
  onTopicValidated, 
  onClose 
}) => {
  const { backendActor } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<TopicValidation | null>(null);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);

  const handleValidate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic to validate', variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      setValidation(null);
      setSuggestions([]);

      const validationResult = await courseGenerationService.validateTopic(
        tutorId,
        topic.trim(),
        backendActor
      );

      setValidation(validationResult);
      onTopicValidated?.(validationResult);

      // If topic is not relevant, get suggestions
      if (!validationResult.is_relevant) {
        const topicSuggestions = await courseGenerationService.getTopicSuggestions(tutorId, backendActor);
        setSuggestions(topicSuggestions);
      }

      if (validationResult.is_relevant) {
        toast({ title: 'Success', description: 'Topic is relevant and suitable for this tutor!', variant: 'success' });
      } else {
        toast({ title: 'Warning', description: 'Topic may not be suitable for this tutor', variant: 'warning' });
      }
    } catch (error) {
      console.error('Error validating topic:', error);
      toast({ title: 'Error', description: 'Failed to validate topic', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: TopicSuggestion) => {
    setTopic(suggestion.topic);
    handleValidate();
  };

  const getValidationIcon = (isRelevant: boolean, confidence: number) => {
    if (isRelevant && confidence > 0.7) return '✅';
    if (isRelevant && confidence > 0.4) return '⚠️';
    return '❌';
  };

  const getValidationColor = (isRelevant: boolean, confidence: number) => {
    if (isRelevant && confidence > 0.7) return 'text-green-600';
    if (isRelevant && confidence > 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence > 0.8) return 'Very High';
    if (confidence > 0.6) return 'High';
    if (confidence > 0.4) return 'Medium';
    if (confidence > 0.2) return 'Low';
    return 'Very Low';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-blue-600';
    if (confidence > 0.4) return 'text-yellow-600';
    if (confidence > 0.2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Topic Validator</h2>
        {onClose && (
          <Button onClick={onClose} variant="secondary" size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Topic Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter a topic to validate
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Introduction to Machine Learning"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
              />
              <Button
                onClick={handleValidate}
                disabled={loading || !topic.trim()}
                variant="primary"
              >
                {loading ? 'Validating...' : 'Validate'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Results */}
      {validation && (
        <div className="space-y-4">
          {/* Main Validation Result */}
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">
                {getValidationIcon(validation.is_relevant, validation.confidence)}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${getValidationColor(validation.is_relevant, validation.confidence)}`}>
                  {validation.is_relevant ? 'Topic is Relevant' : 'Topic May Not Be Suitable'}
                </h3>
                <p className="text-gray-600 mt-1">
                  Confidence: <span className={`font-semibold ${getConfidenceColor(validation.confidence)}`}>
                    {getConfidenceLevel(validation.confidence)} ({(validation.confidence * 100).toFixed(0)}%)
                  </span>
                </p>
                
                {validation.reasoning && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Analysis:</h4>
                    <p className="text-gray-700">{validation.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Suggested Alternatives */}
          {validation.suggested_alternatives && validation.suggested_alternatives.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Suggested Alternatives</h4>
              <div className="space-y-2">
                {validation.suggested_alternatives.map((alternative, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">{alternative}</span>
                    <Button
                      onClick={() => setTopic(alternative)}
                      variant="secondary"
                      size="sm"
                    >
                      Use This Topic
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Topic Suggestions */}
          {!validation.is_relevant && suggestions.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommended Topics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{suggestion.topic}</h5>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            suggestion.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {suggestion.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">{suggestion.expertise_area}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSuggestionClick(suggestion)}
                        variant="secondary"
                        size="sm"
                        className="ml-2"
                      >
                        Try This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {validation.is_relevant && (
              <Button
                onClick={() => {
                  // This would typically trigger course generation
                  toast({ title: 'Success', description: 'Topic validated! You can now generate a course.', variant: 'success' });
                }}
                variant="primary"
                size="lg"
              >
                Generate Course for This Topic
              </Button>
            )}
            <Button
              onClick={() => {
                setTopic('');
                setValidation(null);
                setSuggestions([]);
              }}
              variant="secondary"
              size="lg"
            >
              Try Another Topic
            </Button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <Card className="p-4 bg-blue-50">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 text-xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900">How Topic Validation Works</h4>
            <p className="text-blue-700 text-sm mt-1">
              Our AI analyzes your topic against the tutor's expertise areas and knowledge base to determine 
              if it's a good fit. Topics with higher confidence scores are more likely to provide better 
              learning experiences.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TopicValidator;
