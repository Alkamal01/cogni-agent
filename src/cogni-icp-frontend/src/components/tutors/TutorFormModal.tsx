import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, BookOpen, User, Check, ArrowRight, Mail } from 'lucide-react';
import { Button } from '../shared';
import fileUploadService, { FileUploadProgress as ProgressType } from '../../services/fileUploadService';
import FileUploadProgress from './FileUploadProgress';
import tutorService from '../../services/tutorService';

export interface TutorFormData {
  id?: number;
  public_id?: string;
  name: string;
  expertise: string[];
  teachingStyle: string;
  personality: string;
  description: string;
  knowledgeBase: (string | File | null)[];
  imageFile?: File | null;
  imageUrl?: string;
  voice_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

interface TutorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TutorFormData) => void;
  initialData?: TutorFormData;
}

const TutorFormModal: React.FC<TutorFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<TutorFormData>({
    name: '',
    expertise: [''],
    teachingStyle: 'Adaptive',
    personality: 'Friendly',
    description: '',
    knowledgeBase: [''],
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<ProgressType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [persistedFiles, setPersistedFiles] = useState<Array<{
    id: number;
    public_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    chunks_processed: number;
    processing_time: number;
    status: string;
    created_at: string;
  }>>([]);
  
  // Reset the form when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        expertise: [''],
        teachingStyle: 'Adaptive',
        personality: 'Friendly',
        description: '',
        knowledgeBase: [''],
      });
      setImagePreview(null);
    } else if (initialData) {
      // If initialData is provided and modal is opening, set the form with that data
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        expertise: initialData.expertise?.length ? initialData.expertise : [''],
        teachingStyle: initialData.teachingStyle || 'Adaptive',
        personality: initialData.personality || 'Friendly',
        description: initialData.description || '',
        knowledgeBase: initialData.knowledgeBase?.length ? initialData.knowledgeBase : [''],
      });
      
      // Set image preview if available
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
      
      // Load persisted files if editing an existing tutor
      if (initialData.public_id) {
        console.log('Loading files for tutor with public_id:', initialData.public_id);
        console.log('Initial data:', initialData);
        loadPersistedFiles(initialData.public_id);
      } else {
        console.log('No public_id found in initialData:', initialData);
        console.log('Initial data keys:', Object.keys(initialData || {}));
      }
    }
  }, [isOpen, initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleArrayInputChange = (index: number, value: string | File | null, field: 'expertise' | 'knowledgeBase') => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };
  
  const addArrayItem = (field: 'expertise' | 'knowledgeBase') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };
  
  const removeArrayItem = (index: number, field: 'expertise' | 'knowledgeBase') => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: newArray });
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const loadPersistedFiles = async (tutorId: string) => {
    try {
      console.log('Loading persisted files for tutor:', tutorId);
      console.log('About to call tutorService.getTutorKnowledgeBaseFiles...');
      const files = await tutorService.getTutorKnowledgeBaseFiles(tutorId);
      console.log('Persisted files response:', files);
      console.log('Setting persisted files:', files);
      setPersistedFiles(files);
    } catch (error: any) {
      console.error('Failed to load persisted files:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;
    
    setIsUploading(true);
    
    try {
      // For now, we'll simulate upload since we don't have a tutor ID yet
      // In a real implementation, this would be called after tutor creation
      const validFiles = files.filter(file => fileUploadService.isValidFileType(file));
      
      if (validFiles.length !== files.length) {
        alert('Some files are not supported. Please upload PDF, DOCX, TXT, or image files.');
        return;
      }
      
      // Add files to form data for now
      setFormData({
        ...formData,
        knowledgeBase: [...formData.knowledgeBase, ...validFiles]
      });
      
      // Initialize progress
      const progress: ProgressType[] = validFiles.map(file => ({
        file_name: file.name,
        status: 'uploading',
        progress: 0,
        message: 'Preparing upload...',
        file_size: file.size
      }));
      
      setUploadProgress(progress);
      
      // Simulate upload progress
      for (let i = 0; i < progress.length; i++) {
        progress[i].status = 'uploading';
        progress[i].progress = 0;
        progress[i].message = 'Uploading...';
        setUploadProgress([...progress]);
        
        // Simulate upload progress
        for (let p = 0; p <= 100; p += 10) {
          progress[i].progress = p;
          progress[i].message = `Uploading... ${p}%`;
          setUploadProgress([...progress]);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Simulate processing
        progress[i].status = 'processing';
        progress[i].message = 'Processing document...';
        setUploadProgress([...progress]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark as completed
        progress[i].status = 'completed';
        progress[i].progress = 100;
        progress[i].message = 'Processed successfully';
        progress[i].chunks_processed = Math.floor(Math.random() * 50) + 10;
        progress[i].processing_time = Math.random() * 3 + 1;
        setUploadProgress([...progress]);
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'failed' as const,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setIsUploading(false);
    }
  };
  

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit if we're on the final step
    if (currentStep !== 3) {
      return;
    }
    
    // Filter out any empty array items
    const cleanedData = {
      ...formData,
      expertise: formData.expertise.filter(item => {
        return typeof item === 'string' ? item.trim() !== '' : false;
      }),
      knowledgeBase: formData.knowledgeBase.filter(item => {
        return (typeof item === 'string' ? item.trim() !== '' : false) || (item instanceof File);
      })
    };
    
    // Submit the form data (this will create the tutor)
    onSubmit(cleanedData);
    
    // Note: File uploads will be handled by the backend during tutor creation
    // The backend will process the files and store them in the vector database
    onClose();
  };
  
  const nextStep = () => {
    if (isValidStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const isValidStep = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.name.trim() !== '' && 
          formData.expertise.some(item => {
            return typeof item === 'string' ? item.trim() !== '' : false;
          }) && 
          formData.description.trim() !== ''
        );
      case 2:
        return (
          formData.teachingStyle.trim() !== '' && 
          formData.personality.trim() !== ''
        );
      case 3:
        // Knowledge base is optional, so always return true
        return true;
      default:
        return true;
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tutor Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="e.g., Dr. Alan Turing"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Areas of Expertise
              </label>
              {formData.expertise.map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={typeof item === 'string' ? item : ''}
                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'expertise')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="e.g., Mathematics, Computer Science"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, 'expertise')}
                    className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('expertise')}
                className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Expertise
              </button>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Describe your tutor's background and specialization..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Image (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {imagePreview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, imageFile: null, imageUrl: undefined });
                      }}
                      className="text-red-500 dark:text-red-400 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  ) : (
                    <p>Drop an image or click to browse</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Teaching Style & Personality</h3>
            
            <div>
              <label htmlFor="teachingStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teaching Style
              </label>
              <select
                id="teachingStyle"
                name="teachingStyle"
                value={formData.teachingStyle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Adaptive">Adaptive - Adjusts to your learning pace</option>
                <option value="Socratic">Socratic - Teaches through questioning</option>
                <option value="Interactive">Interactive - Engaging and hands-on</option>
                <option value="Visual">Visual Learning - Uses diagrams and illustrations</option>
                <option value="Conceptual">Conceptual - Focuses on big picture understanding</option>
                <option value="Procedural">Procedural - Step-by-step instructions</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="personality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Personality
              </label>
              <select
                id="personality"
                name="personality"
                value={formData.personality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Friendly">Friendly and Encouraging</option>
                <option value="Strict">Strict and Direct</option>
                <option value="Patient">Patient and Supportive</option>
                <option value="Enthusiastic">Enthusiastic and Energetic</option>
                <option value="Analytical">Analytical and Detailed</option>
                <option value="Humorous">Humorous and Relaxed</option>
              </select>
            </div>
            
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-primary-700 dark:text-primary-300 mb-2">Teaching Style Preview</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formData.teachingStyle === 'Adaptive' && "This tutor will assess your understanding and adjust explanations accordingly, providing personalized learning paths."}
                {formData.teachingStyle === 'Socratic' && "This tutor will guide you through critical thinking by asking questions that lead to deeper understanding."}
                {formData.teachingStyle === 'Interactive' && "This tutor will engage you with hands-on exercises, real-world examples, and interactive problems."}
                {formData.teachingStyle === 'Visual' && "This tutor will use diagrams, charts, and visual metaphors to explain concepts clearly."}
                {formData.teachingStyle === 'Conceptual' && "This tutor will focus on fundamental principles and the big picture before diving into details."}
                {formData.teachingStyle === 'Procedural' && "This tutor will provide clear, step-by-step instructions for mastering skills and solving problems."}
              </p>
            </div>
            
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-primary-700 dark:text-primary-300 mb-2">Personality Preview</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formData.personality === 'Friendly' && "This tutor will be warm, approachable, and focus on creating a positive learning environment."}
                {formData.personality === 'Strict' && "This tutor will maintain high standards and provide direct feedback to push you toward excellence."}
                {formData.personality === 'Patient' && "This tutor will take time to explain difficult concepts and never rush you through your learning journey."}
                {formData.personality === 'Enthusiastic' && "This tutor will bring energy and passion to every session, making learning exciting and engaging."}
                {formData.personality === 'Analytical' && "This tutor will focus on precise details and logical reasoning, perfect for technical subjects."}
                {formData.personality === 'Humorous' && "This tutor will incorporate appropriate humor and a relaxed approach while maintaining educational focus."}
              </p>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Knowledge Base (Optional)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload documents (PDF, DOCX, images, text files) to create a custom knowledge base for your tutor. 
              The tutor will use this information to provide more accurate and detailed responses.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Knowledge Base Files
              </label>
              
              {/* Text References */}
              {formData.knowledgeBase.filter(item => typeof item === 'string' && item.trim() !== '').map((item, index) => (
                <div key={`text-${index}`} className="flex items-center mb-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item as string}
                      onChange={(e) => {
                        const textItems = formData.knowledgeBase.filter(item => typeof item === 'string');
                        const textIndex = textItems.indexOf(item as string);
                        if (textIndex !== -1) {
                          const newKnowledgeBase = [...formData.knowledgeBase];
                          const actualIndex = formData.knowledgeBase.findIndex(item => item === item);
                          newKnowledgeBase[actualIndex] = e.target.value;
                          setFormData({ ...formData, knowledgeBase: newKnowledgeBase });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Text reference (optional)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                      <button
                        type="button"
                    onClick={() => {
                      const newKnowledgeBase = formData.knowledgeBase.filter(kb => kb !== item);
                      setFormData({ ...formData, knowledgeBase: newKnowledgeBase });
                    }}
                    className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                    <X className="w-4 h-4" />
                      </button>
                </div>
              ))}
              
              {/* File Uploads */}
              {formData.knowledgeBase.filter(item => item instanceof File).map((item, index) => (
                <div key={`file-${index}`} className="flex items-center mb-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex-1 flex items-center">
                    <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item instanceof File ? item.name : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(item instanceof File ? item.size / 1024 : 0).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newKnowledgeBase = formData.knowledgeBase.filter(kb => kb !== item);
                      setFormData({ ...formData, knowledgeBase: newKnowledgeBase });
                    }}
                    className="ml-2 p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Add new text reference */}
              <button
                type="button"
                onClick={() => addArrayItem('knowledgeBase')}
                className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium mb-3"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Text Reference
              </button>
              
              {/* File upload button */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isUploading}
                  className={`w-full p-3 border-2 border-dashed rounded-lg transition-colors ${
                    isUploading 
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400'
                  }`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.gif,.bmp';
                    input.multiple = true;
                    input.onchange = async (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) {
                        const newFiles = Array.from(files);
                        await handleFileUpload(newFiles);
                      }
                    };
                    input.click();
                  }}
                >
                  <div className="flex flex-col items-center">
                    <BookOpen className={`w-6 h-6 mb-2 ${
                      isUploading 
                        ? 'text-gray-400 dark:text-gray-600' 
                        : 'text-gray-400 dark:text-gray-600'
                    }`} />
                    <p className={`text-sm ${
                      isUploading 
                        ? 'text-gray-400 dark:text-gray-600' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {isUploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PDF, DOCX, TXT, Images, etc.
                    </p>
                  </div>
                </button>
              </div>
              
              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Progress
                  </h4>
                  <FileUploadProgress 
                    progress={uploadProgress}
                    onRemove={(fileName) => {
                      setUploadProgress(prev => prev.filter(p => p.file_name !== fileName));
                      setFormData(prev => ({
                        ...prev,
                        knowledgeBase: prev.knowledgeBase.filter(item => 
                          !(item instanceof File && item.name === fileName)
                        )
                      }));
                    }}
                  />
                </div>
              )}
              
              {/* Persisted Files */}
              {(() => {
                console.log('Rendering persisted files section, count:', persistedFiles.length);
                return null;
              })()}
              {persistedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uploaded Files
                  </h4>
                  <div className="space-y-2">
                    {persistedFiles.map((file) => {
                      console.log('Rendering file object:', file);
                      return (
                        <div key={file.public_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 text-green-500">✓</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.file_name || 'Unknown file'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {fileUploadService.formatFileSize(file.file_size)} • {file.chunks_processed} chunks
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await tutorService.deleteTutorKnowledgeBaseFile(formData.public_id!, file.public_id);
                                setPersistedFiles(prev => prev.filter(f => f.public_id !== file.public_id));
                              } catch (error) {
                                console.error('Failed to delete file:', error);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Delete file"
                          >
                            <div className="w-4 h-4">×</div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Supported File Types</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                • <strong>Documents:</strong> PDF, DOCX, DOC, TXT, MD<br/>
                • <strong>Images:</strong> JPG, JPEG, PNG, GIF, BMP<br/>
                • <strong>Text:</strong> Any text content will be extracted and vectorized<br/>
                • <strong>Processing:</strong> Files are automatically processed and stored securely
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const renderProgressSteps = () => {
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between items-center">
          <div className={`w-1/3 flex flex-col items-center ${currentStep >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
              {currentStep > 1 ? <Check className="w-5 h-5" /> : <span>1</span>}
            </div>
            <span className="text-xs mt-1">Basics</span>
          </div>
          <div className={`w-1/3 flex flex-col items-center ${currentStep >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
              {currentStep > 2 ? <Check className="w-5 h-5" /> : <span>2</span>}
            </div>
            <span className="text-xs mt-1">Style</span>
          </div>
          <div className={`w-1/3 flex flex-col items-center ${currentStep >= 3 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
              {currentStep > 3 ? <Check className="w-5 h-5" /> : <span>3</span>}
            </div>
            <span className="text-xs mt-1">Knowledge</span>
          </div>
        </div>
        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full relative">
          <motion.div 
            className="h-1 bg-primary-500 rounded-full absolute top-0 left-0"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep - 1) * 50}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl z-[101]"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="p-6 relative z-[101]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Custom AI Tutor</h2>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {renderProgressSteps()}
              
              <form onSubmit={handleSubmit} noValidate>
                {renderStepContent()}
                
                <div className="flex justify-between mt-8 border-t pt-4 dark:border-gray-700">
                  {currentStep > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="px-4"
                    >
                      <ArrowRight className="w-4 h-4 mr-1 transform rotate-180" />
                      Back
                    </Button>
                  ) : (
                    <div /> 
                  )}
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={nextStep}
                      disabled={!isValidStep()}
                      className="px-4"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      onClick={async () => {
                        const cleanedData = {
                          ...formData,
                          expertise: formData.expertise.filter(item => {
                            return typeof item === 'string' ? item.trim() !== '' : false;
                          }),
                          knowledgeBase: formData.knowledgeBase.filter(item => {
                            return (typeof item === 'string' ? item.trim() !== '' : false) || (item instanceof File);
                          })
                        };
                        onSubmit(cleanedData);
                        onClose();
                      }}
                      className="px-4"
                    >
                      Create Tutor
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TutorFormModal; 