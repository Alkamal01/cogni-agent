import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseGenerationService, CourseGenerationResult } from '../../services/courseGenerationService';
import { CourseOutline } from '../../services/tutorService';
import { useToast } from '../../hooks/useToast';
import Card from '../shared/Card';
import Button from '../shared/Button';

interface CourseGeneratorProps {
  tutorId: string;
  onCourseGenerated?: (outline: CourseOutline) => void;
  onClose?: () => void;
}

const CourseGenerator: React.FC<CourseGeneratorProps> = ({ 
  tutorId, 
  onCourseGenerated, 
  onClose 
}) => {
  const { backendActor } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CourseGenerationResult | null>(null);
  const [userPreferences, setUserPreferences] = useState({
    learningStyle: 'interactive',
    difficultyLevel: 'intermediate',
    estimatedDuration: '4 weeks'
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic for the course', variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const generationResult = await courseGenerationService.generateCourse(
        {
          tutorId,
          topic: topic.trim(),
          userPreferences
        },
        backendActor
      );

      setResult(generationResult);

      if (generationResult.isGenerated) {
        toast({ title: 'Success', description: 'Course generated successfully!', variant: 'success' });
        onCourseGenerated?.(generationResult.outline);
      } else {
        toast({ title: 'Error', description: generationResult.error || 'Failed to generate course', variant: 'error' });
      }
    } catch (error) {
      console.error('Error generating course:', error);
      toast({ title: 'Error', description: 'Failed to generate course', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = () => {
    if (result?.outline) {
      onCourseGenerated?.(result.outline);
    }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Generate Course</h2>
        {onClose && (
          <Button onClick={onClose} variant="secondary" size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Course Generation Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Introduction to Machine Learning"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Style
              </label>
              <select
                value={userPreferences.learningStyle}
                onChange={(e) => setUserPreferences(prev => ({ ...prev, learningStyle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="interactive">Interactive</option>
                <option value="visual">Visual</option>
                <option value="hands-on">Hands-on</option>
                <option value="theoretical">Theoretical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={userPreferences.difficultyLevel}
                onChange={(e) => setUserPreferences(prev => ({ ...prev, difficultyLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={userPreferences.estimatedDuration}
                onChange={(e) => setUserPreferences(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="1 week">1 Week</option>
                <option value="2 weeks">2 Weeks</option>
                <option value="4 weeks">4 Weeks</option>
                <option value="8 weeks">8 Weeks</option>
                <option value="12 weeks">12 Weeks</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Generating Course...' : 'Generate Course'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Topic Validation */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {getValidationIcon(result.validation.is_relevant, result.validation.confidence)}
                </span>
                <div>
                  <h3 className={`font-semibold ${getValidationColor(result.validation.is_relevant, result.validation.confidence)}`}>
                    Topic Validation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Confidence: {(result.validation.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
            
            {result.validation.reasoning && (
              <p className="mt-2 text-sm text-gray-700">{result.validation.reasoning}</p>
            )}

            {result.validation.suggested_alternatives && result.validation.suggested_alternatives.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Suggested alternatives:</p>
                <ul className="text-sm text-gray-600">
                  {result.validation.suggested_alternatives.map((alt, index) => (
                    <li key={index}>• {alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Course Outline */}
          {result.isGenerated && result.outline && (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{result.outline.title}</h3>
                  <p className="text-gray-600 mt-1">{result.outline.description}</p>
                </div>
                <Button onClick={handleStartCourse} variant="primary" size="sm">
                  Start Course
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Duration</p>
                  <p className="text-lg font-semibold text-blue-900">{result.outline.estimated_duration}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Difficulty</p>
                  <p className="text-lg font-semibold text-green-900 capitalize">{result.outline.difficulty_level}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-700">Modules</p>
                  <p className="text-lg font-semibold text-purple-900">{result.outline.modules.length}</p>
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h4>
                <ul className="space-y-2">
                  {result.outline.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-green-500">•</span>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Course Modules */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Course Modules</h4>
                <div className="space-y-3">
                  {result.outline.modules.map((module, index) => (
                    <div key={module.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">{module.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          Module {module.order}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Topic Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Related Topics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900">{suggestion.topic}</h5>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    <div className="flex items-center justify-between mt-2">
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
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseGenerator;
