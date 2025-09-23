import React, { useState, ChangeEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  BookOpen,
  Bell,
  Lock,
  Brain,
  Zap,
  Shield,
  AlertCircle,
  MessageSquare,
  CreditCard as SettingsIcon,
  Book,
  Clock,
  X
} from 'lucide-react';
import { Button, Input, Textarea } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  userSettingsService, 
  type LearningPreferences as LearningPreferencesType,
  type SecuritySettings as SecuritySettingsType,
  type AccessibilitySettings as AccessibilitySettingsType,
  type AISettings as AISettingsType,
  type PrivacySettings as PrivacySettingsType
} from '../services/userSettingsService';

interface LearningPreferences {
  learningStyle: string;
  language: string;  // Language code (e.g., 'en', 'es', 'fr')
  aiMode: 'standard' | 'advanced';  // AI mode selection
  preferredLanguage: string;
  secondaryLanguages: string[];
  contentLocalization: boolean;
  culturalContexts: string[];
  studyReminders: boolean;
  dailyGoalHours: number;
  topicsOfInterest: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  aiInteractionLevel: 'minimal' | 'moderate' | 'extensive';
  adaptiveLearningEnabled: boolean;
  collaborationPreference: 'individual' | 'pair' | 'group';
  educationalBackground: string;
  learningGoals: string[];
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  activeSessions: Array<{
    id: number;
    device: string;
    location: string;
    lastActive: string;
  }>;
  loginHistory: Array<{
    id: number;
    timestamp: string;
    location: string;
    device: string;
    status: 'success' | 'failed' | 'password_change';
  }>;
}

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  contrast: 'normal' | 'high';
  reduceMotion: boolean;
  screenReader: boolean;
  colorBlindMode: boolean;
}

interface AISettings {
  interactionStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'concise' | 'detailed' | 'comprehensive';
  modelPreference: 'balanced' | 'fast' | 'advanced';
  customInstructions: string;
  topicEmphasis: string[];
}

interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private';
  activitySharing: 'everyone' | 'connections' | 'none';
  allowConnectionRequests: boolean;
  dataUsageConsent: {
    learningAnalytics: boolean;
    aiTraining: boolean;
    thirdPartySharing: boolean;
  };
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'learning' | 'security' | 'accessibility' | 'ai' | 'privacy'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newTopicEmphasis, setNewTopicEmphasis] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: (user as { bio?: string })?.bio || '',
    avatar_url: user?.avatar_url || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      push: true,
      groupUpdates: true,
      learningReminders: true
    }
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    activeSessions: [],
    loginHistory: []
  });

  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    contrast: 'normal',
    reduceMotion: false,
    screenReader: false,
    colorBlindMode: false
  });

  const [aiSettings, setAiSettings] = useState<AISettings>({
    interactionStyle: 'casual',
    responseLength: 'concise',
    modelPreference: 'balanced',
    customInstructions: '',
    topicEmphasis: []
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    activitySharing: 'connections',
    allowConnectionRequests: true,
    dataUsageConsent: {
      learningAnalytics: true,
      aiTraining: false,
      thirdPartySharing: false
    }
  });

  const [learningPreferences, setLearningPreferences] = useState<LearningPreferences>({
    learningStyle: 'visual',
    language: 'en',  // Default to English
    aiMode: 'standard',  // Default to standard mode
    preferredLanguage: 'English',
    secondaryLanguages: [],
    contentLocalization: true,
    culturalContexts: ['Western'],
    studyReminders: true,
    dailyGoalHours: 2,
    topicsOfInterest: ['Programming', 'AI', 'Data Science'],
    difficultyLevel: 'intermediate',
    aiInteractionLevel: 'moderate',
    adaptiveLearningEnabled: true,
    collaborationPreference: 'group',
    educationalBackground: 'college',
    learningGoals: ['Skill improvement', 'Career advancement']
  });

  // Languages supported by the platform
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'zh', name: 'Chinese (中文)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'tr', name: 'Turkish (Türkçe)' },
    { code: 'nl', name: 'Dutch (Nederlands)' },
    { code: 'sv', name: 'Swedish (Svenska)' },
    { code: 'no', name: 'Norwegian (Norsk)' },
    { code: 'da', name: 'Danish (Dansk)' },
    { code: 'fi', name: 'Finnish (Suomi)' },
    { code: 'pl', name: 'Polish (Polski)' },
    { code: 'cs', name: 'Czech (Čeština)' },
    { code: 'hu', name: 'Hungarian (Magyar)' },
    { code: 'ro', name: 'Romanian (Română)' },
    { code: 'bg', name: 'Bulgarian (Български)' },
    { code: 'hr', name: 'Croatian (Hrvatski)' },
    { code: 'sk', name: 'Slovak (Slovenčina)' },
    { code: 'sl', name: 'Slovenian (Slovenščina)' },
    { code: 'et', name: 'Estonian (Eesti)' },
    { code: 'lv', name: 'Latvian (Latviešu)' },
    { code: 'lt', name: 'Lithuanian (Lietuvių)' },
    { code: 'mt', name: 'Maltese (Malti)' },
    { code: 'el', name: 'Greek (Ελληνικά)' },
    { code: 'sw', name: 'Swahili (Kiswahili)' },
    { code: 'am', name: 'Amharic (አማርኛ)' },
    { code: 'ha', name: 'Hausa (هَوُسَ)' },
    { code: 'yo', name: 'Yoruba (Èdè Yorùbá)' },
    { code: 'ig', name: 'Igbo (Ásụ̀sụ̀ Ìgbò)' },
    { code: 'zu', name: 'Zulu (isiZulu)' },
    { code: 'xh', name: 'Xhosa (isiXhosa)' },
    { code: 'st', name: 'Sesotho (Sesotho)' },
    { code: 'tn', name: 'Tswana (Setswana)' },
    { code: 'ss', name: 'Swati (siSwati)' },
    { code: 've', name: 'Venda (Tshivenda)' },
    { code: 'ts', name: 'Tsonga (Xitsonga)' },
    { code: 'af', name: 'Afrikaans' }
  ];

  // Cultural contexts available for educational content adaptation
  const availableCulturalContexts = [
    'West African',
    'East African',
    'Southern African',
    'North African',
    'Central African',
    'Horn of Africa',
    'Sahel Region',
    'Maghreb',
    'Sub-Saharan',
    'Pan-African'
  ];

  // Educational backgrounds
  const educationalBackgrounds = [
    'high school',
    'college',
    'graduate school',
    'self-taught',
    'professional training',
    'continuing education'
  ];

  // Learning goals
  const commonLearningGoals = [
    'Skill improvement',
    'Career advancement',
    'Academic achievement',
    'Personal interest',
    'Teaching others',
    'Research',
    'Professional certification'
  ];

  // Fetch all settings from the API
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const allSettings = await userSettingsService.getAllSettings();
        
        // Update profile data
        if (allSettings.profile) {
          setProfileData(prev => ({
            ...prev,
            name: allSettings.profile.name || prev.name,
            email: allSettings.profile.email || prev.email,
            bio: allSettings.profile.bio || prev.bio
          }));
        }
        
        // Update learning preferences
        if (allSettings.learning_preferences) {
          setLearningPreferences(prev => ({
            ...prev,
            ...allSettings.learning_preferences
          }));
        }
        
        // Update security settings
        if (allSettings.security) {
          setSecuritySettings({
            twoFactorEnabled: allSettings.security.two_factor_enabled,
            activeSessions: allSettings.security.active_sessions.map(session => ({
              id: session.id,
              device: session.device,
              location: session.location,
              lastActive: session.last_active
            })),
            loginHistory: allSettings.security.login_history.map(entry => ({
              id: entry.id,
              timestamp: entry.timestamp,
              location: entry.location,
              device: entry.device,
              status: entry.status as 'success' | 'failed' | 'password_change'
            }))
          });
        }
        
        // Update accessibility settings
        if (allSettings.accessibility) {
          setAccessibilitySettings(prev => ({
            ...prev,
            ...allSettings.accessibility
          }));
        }
        
        // Update AI settings
        if (allSettings.ai_settings) {
          setAiSettings(prev => ({
            ...prev,
            ...allSettings.ai_settings
          }));
        }
        
        // Update privacy settings
        if (allSettings.privacy) {
          const privacyData = allSettings.privacy;
          setPrivacySettings(prev => ({
            ...prev,
            profileVisibility: privacyData.profileVisibility || prev.profileVisibility,
            activitySharing: privacyData.activitySharing || prev.activitySharing,
            allowConnectionRequests: privacyData.allowConnectionRequests !== undefined 
              ? privacyData.allowConnectionRequests 
              : prev.allowConnectionRequests,
            dataUsageConsent: {
              learningAnalytics: privacyData.dataUsageConsent?.learningAnalytics !== undefined 
                ? privacyData.dataUsageConsent.learningAnalytics 
                : prev.dataUsageConsent.learningAnalytics,
              aiTraining: privacyData.dataUsageConsent?.aiTraining !== undefined 
                ? privacyData.dataUsageConsent.aiTraining 
                : prev.dataUsageConsent.aiTraining,
              thirdPartySharing: privacyData.dataUsageConsent?.thirdPartySharing !== undefined 
                ? privacyData.dataUsageConsent.thirdPartySharing 
                : prev.dataUsageConsent.thirdPartySharing
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        showToast('error', 'Failed to load settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [showToast]);

  // Helper function to handle array-based preferences with proper typing
  const handleArrayPreferenceToggle = <K extends keyof LearningPreferences>(
    arrayName: K,
    item: string,
    setter: React.Dispatch<React.SetStateAction<LearningPreferences>>
  ) => {
    setter(prev => {
      const array = prev[arrayName] as string[];
      if (array.includes(item)) {
        return {
          ...prev,
          [arrayName]: array.filter(i => i !== item)
        };
      } else {
        return {
          ...prev,
          [arrayName]: [...array, item]
        };
      }
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (avatarFile) {
        // Handle avatar upload with FormData
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('bio', profileData.bio);
        formData.append('avatar', avatarFile);
        
        await userSettingsService.updateProfileSettings(formData);
      } else {
        // Handle regular profile update
      await userSettingsService.updateProfileSettings({
        name: profileData.name,
        bio: profileData.bio
      });
      }
      
      showToast('success', 'Profile updated successfully');
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Failed to update profile. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.newPassword !== profileData.confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }
    
    try {
      await userSettingsService.changePassword({
        current_password: profileData.currentPassword,
        new_password: profileData.newPassword,
        confirm_password: profileData.confirmPassword
      });
      showToast('success', 'Password changed successfully');
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('error', 'Failed to change password. Please check your current password.');
    }
  };

  const handleLearningPreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userSettingsService.updateLearningPreferences(learningPreferences);
      showToast('success', 'Learning preferences updated successfully');
    } catch (error) {
      console.error('Error updating learning preferences:', error);
      showToast('error', 'Failed to update learning preferences. Please try again.');
    }
  };

  const handleAccessibilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userSettingsService.updateAccessibilitySettings(accessibilitySettings);
      showToast('success', 'Accessibility settings updated successfully');
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      showToast('error', 'Failed to update accessibility settings. Please try again.');
    }
  };

  const handleAISettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save AI settings
      await userSettingsService.updateAISettings(aiSettings);
      
      // Also save the learning preferences (including AI mode and language)
      await userSettingsService.updateLearningPreferences(learningPreferences);
      
      showToast('success', 'AI settings updated successfully');
    } catch (error) {
      console.error('Error updating AI settings:', error);
      showToast('error', 'Failed to update AI settings. Please try again.');
    }
  };

  const handlePrivacySettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userSettingsService.updatePrivacySettings(privacySettings);
      showToast('success', 'Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showToast('error', 'Failed to update privacy settings. Please try again.');
    }
  };

  const handleToggleTwoFactor = async (enable: boolean) => {
    try {
      await userSettingsService.updateTwoFactor(enable);
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: enable
      }));
      showToast('success', `Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating two-factor authentication:', error);
      showToast('error', 'Failed to update two-factor authentication. Please try again.');
    }
  };

  const handleTerminateSession = async (sessionId: number) => {
    try {
      // Check if trying to terminate current session
      const currentSessionId = userSettingsService.getCurrentSessionId();
      if (sessionId === currentSessionId) {
        // For current session, use logout instead
        if (window.confirm('This will log you out of the current session. Continue?')) {
          await userSettingsService.terminateSession(sessionId);
          // Use logout from the auth context to properly clean up
          logout();
        }
        return;
      }
      
      // For other sessions
      await userSettingsService.terminateSession(sessionId);
      setSecuritySettings(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(session => session.id !== sessionId)
      }));
      showToast('success', 'Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      showToast('error', 'Failed to terminate session. Please try again.');
    }
  };

  const handleTerminateAllSessions = async () => {
    if (window.confirm('This will terminate all sessions except your current one. Continue?')) {
      try {
        await userSettingsService.terminateAllSessions();
        
        // Keep only the current session in the list
        const currentSessionId = userSettingsService.getCurrentSessionId();
        setSecuritySettings(prev => ({
          ...prev,
          activeSessions: prev.activeSessions.filter(session => 
            session.id === currentSessionId
          )
        }));
        
        showToast('success', 'All other sessions terminated successfully');
      } catch (error) {
        console.error('Error terminating all sessions:', error);
        showToast('error', 'Failed to terminate all sessions. Please try again.');
      }
    }
  };

  const handleTopicAdd = (topic: string) => {
    if (!topic.trim()) return;
    if (!learningPreferences.topicsOfInterest.includes(topic)) {
      setLearningPreferences(prev => ({
        ...prev,
        topicsOfInterest: [...prev.topicsOfInterest, topic]
      }));
      setNewTopic('');
    }
  };

  const handleTopicRemove = (topicToRemove: string) => {
    setLearningPreferences(prev => ({
      ...prev,
      topicsOfInterest: prev.topicsOfInterest.filter(topic => topic !== topicToRemove)
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab('learning')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'learning'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Brain className="h-5 w-5" />
                  <span>Learning Preferences</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'security'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Security</span>
                </button>
                <button
                  onClick={() => setActiveTab('accessibility')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'accessibility'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Book className="h-5 w-5" />
                  <span>Accessibility</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'ai'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>AI Assistant</span>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <AlertCircle className="h-5 w-5" />
                  <span>Privacy</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9 space-y-6">
            {activeTab === 'profile' ? (
              <>
                {/* Profile Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Profile Information
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          disabled={!isEditing}
                          rows={4}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Avatar Upload Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Profile Picture
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                            {avatarPreview || profileData.avatar_url ? (
                              <img 
                                src={avatarPreview || profileData.avatar_url} 
                                alt="Profile" 
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              <User className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            )}
                            {!avatarPreview && !profileData.avatar_url && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                                <User className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                              </div>
                            )}
                          </div>
                          
                          {isEditing && (
                            <div className="flex flex-col space-y-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setAvatarFile(file);
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        setAvatarPreview(e.target?.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <div className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer text-sm">
                                  Choose Image
                                </div>
                              </label>
                              {avatarFile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAvatarFile(null);
                                    setAvatarPreview(null);
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={profileData.currentPassword}
                              onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={profileData.newPassword}
                                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={profileData.confirmPassword}
                                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {isEditing && (
                        <div className="flex justify-end">
                          <Button type="submit" variant="primary">
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                      <Bell className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Notification Preferences
                    </h2>

                    <div className="space-y-4">
                      {Object.entries(profileData.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={() => {
                                setProfileData(prev => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    [key]: !value
                                  }
                                }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'learning' ? (
              <>
                {/* Learning Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                      <Brain className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Learning Style & AI Personalization
                    </h2>

                    <form onSubmit={handleLearningPreferencesSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Learning Style
                          </label>
                          <select
                            value={learningPreferences.learningStyle}
                            onChange={(e) => setLearningPreferences(prev => ({ ...prev, learningStyle: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="visual">Visual</option>
                            <option value="auditory">Auditory</option>
                            <option value="reading">Reading/Writing</option>
                            <option value="kinesthetic">Kinesthetic</option>
                            <option value="multimodal">Multimodal (Mix of Styles)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Educational Background
                          </label>
                          <select
                            value={learningPreferences.educationalBackground}
                            onChange={(e) => setLearningPreferences(prev => ({ ...prev, educationalBackground: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {educationalBackgrounds.map(background => (
                              <option key={background} value={background}>
                                {background.charAt(0).toUpperCase() + background.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Difficulty Level
                          </label>
                          <select
                            value={learningPreferences.difficultyLevel}
                            onChange={(e) => setLearningPreferences(prev => ({ 
                              ...prev, 
                              difficultyLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                            }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Daily Goal (Hours)
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={learningPreferences.dailyGoalHours}
                            onChange={(e) => setLearningPreferences(prev => ({ 
                              ...prev, 
                              dailyGoalHours: parseFloat(e.target.value)
                            }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          AI-Powered Learning Adaptation
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              AI Interaction Level
                            </label>
                            <select
                              value={learningPreferences.aiInteractionLevel}
                              onChange={(e) => setLearningPreferences(prev => ({ 
                                ...prev, 
                                aiInteractionLevel: e.target.value as 'minimal' | 'moderate' | 'extensive'
                              }))}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="minimal">Minimal - Occasional suggestions</option>
                              <option value="moderate">Moderate - Regular guidance</option>
                              <option value="extensive">Extensive - Proactive assistance</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Adaptive Learning
                              </label>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input
                                  type="checkbox"
                                  name="adaptive-learning"
                                  id="adaptive-learning"
                                  checked={learningPreferences.adaptiveLearningEnabled}
                                  onChange={(e) => setLearningPreferences(prev => ({
                                    ...prev,
                                    adaptiveLearningEnabled: e.target.checked
                                  }))}
                                  className="sr-only"
                                />
                                <label
                                  htmlFor="adaptive-learning"
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    learningPreferences.adaptiveLearningEnabled 
                                    ? 'bg-primary-600' 
                                    : 'bg-gray-300 dark:bg-gray-700'
                                  }`}
                                >
                                  <span
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      learningPreferences.adaptiveLearningEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </label>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Enables AI to automatically adjust content difficulty and approach based on your performance
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Language & AI Mode
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              AI Response Language
                            </label>
                            <select
                              value={learningPreferences.language}
                              onChange={(e) => setLearningPreferences(prev => ({ 
                                ...prev, 
                                language: e.target.value 
                              }))}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              {availableLanguages.map(language => (
                                <option key={language.code} value={language.code}>
                                  {language.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              AI tutors will respond in this language
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              AI Mode
                            </label>
                            <select
                              value={learningPreferences.aiMode}
                              onChange={(e) => setLearningPreferences(prev => ({ 
                                ...prev, 
                                aiMode: e.target.value as 'standard' | 'advanced'
                              }))}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="standard">Standard (Groq) - Fast & Cost-effective</option>
                              <option value="advanced">Advanced (OpenAI) - High Quality</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Choose your preferred AI service for responses
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Primary Language (Legacy)
                            </label>
                            <select
                              value={learningPreferences.preferredLanguage}
                              onChange={(e) => setLearningPreferences(prev => ({ 
                                ...prev, 
                                preferredLanguage: e.target.value 
                              }))}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              {availableLanguages.map(language => (
                                <option key={language.code} value={language.name}>
                                  {language.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Content Localization
                              </label>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input
                                  type="checkbox"
                                  name="content-localization"
                                  id="content-localization"
                                  checked={learningPreferences.contentLocalization}
                                  onChange={(e) => setLearningPreferences(prev => ({
                                    ...prev,
                                    contentLocalization: e.target.checked
                                  }))}
                                  className="sr-only"
                                />
                                <label
                                  htmlFor="content-localization"
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    learningPreferences.contentLocalization 
                                    ? 'bg-primary-600' 
                                    : 'bg-gray-300 dark:bg-gray-700'
                                  }`}
                                >
                                  <span
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      learningPreferences.contentLocalization ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </label>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Adapt content examples, metaphors, and references to your cultural context
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Secondary Languages (for multilingual content)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                            {availableLanguages
                              .filter(lang => lang.name !== learningPreferences.preferredLanguage)
                              .map(language => (
                                <div key={language.code} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`lang-${language.code}`}
                                    checked={learningPreferences.secondaryLanguages.includes(language.name)}
                                    onChange={() => {
                                      setLearningPreferences(prev => {
                                        const updated = prev.secondaryLanguages.includes(language.name)
                                          ? prev.secondaryLanguages.filter(lang => lang !== language.name)
                                          : [...prev.secondaryLanguages, language.name];
                                        return { ...prev, secondaryLanguages: updated };
                                      });
                                    }}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <label
                                    htmlFor={`lang-${language.code}`}
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                  >
                                    {language.name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cultural Context Preferences
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                            {availableCulturalContexts.map(context => (
                              <div key={context} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`context-${context}`}
                                  checked={learningPreferences.culturalContexts.includes(context)}
                                  onChange={() => {
                                    setLearningPreferences(prev => {
                                      const updated = prev.culturalContexts.includes(context)
                                        ? prev.culturalContexts.filter(ctx => ctx !== context)
                                        : [...prev.culturalContexts, context];
                                      return { ...prev, culturalContexts: updated };
                                    });
                                  }}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`context-${context}`}
                                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                  {context}
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            The AI will use these contexts to provide culturally relevant examples and explanations
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Learning Goals & Interests
                        </h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Learning Goals
                          </label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                            {commonLearningGoals.map(goal => (
                              <div key={goal} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`goal-${goal}`}
                                  checked={learningPreferences.learningGoals.includes(goal)}
                                  onChange={() => {
                                    setLearningPreferences(prev => {
                                      const updated = prev.learningGoals.includes(goal)
                                        ? prev.learningGoals.filter(g => g !== goal)
                                        : [...prev.learningGoals, goal];
                                      return { ...prev, learningGoals: updated };
                                    });
                                  }}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`goal-${goal}`}
                                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                  {goal}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Topics of Interest
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {learningPreferences.topicsOfInterest.map(topic => (
                              <span 
                                key={topic}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                              >
                                {topic}
                                <button
                                  type="button"
                                  onClick={() => handleTopicRemove(topic)}
                                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                                >
                                  <X className="h-3 w-3" />
                                  <span className="sr-only">Remove {topic}</span>
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex">
                            <input
                              type="text"
                              placeholder="Add a topic..."
                              value={newTopic}
                              onChange={(e) => setNewTopic(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newTopic.trim()) {
                                  e.preventDefault();
                                  handleTopicAdd(newTopic.trim());
                                  setNewTopic('');
                                }
                              }}
                              className="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newTopic.trim()) {
                                  handleTopicAdd(newTopic.trim());
                                  setNewTopic('');
                                }
                              }}
                              className="px-3 py-2 rounded-r-lg bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" variant="primary">
                          Save Preferences
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : activeTab === 'security' ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                    <Shield className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Security Settings
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Two-Factor Authentication */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                        </div>
                        <Button
                          variant={securitySettings.twoFactorEnabled ? "outline" : "primary"}
                          onClick={() => handleToggleTwoFactor(!securitySettings.twoFactorEnabled)}
                        >
                          {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                      <div className="space-y-4">
                        {securitySettings.activeSessions.map((session, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{session.device}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{session.location} • Last active {session.lastActive}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)}>End Session</Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Login History */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Login History</h3>
                      <div className="space-y-4">
                        {securitySettings.loginHistory.map((login, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{login.device}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {login.location} • {login.timestamp}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              login.status === 'success' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {login.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'accessibility' ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                    <Book className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Accessibility Settings
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Font Size
                      </label>
                      <select
                        value={accessibilitySettings.fontSize}
                        onChange={(e) => setAccessibilitySettings(prev => ({
                          ...prev,
                          fontSize: e.target.value as 'small' | 'medium' | 'large'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    {/* Contrast */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contrast
                      </label>
                      <select
                        value={accessibilitySettings.contrast}
                        onChange={(e) => setAccessibilitySettings(prev => ({
                          ...prev,
                          contrast: e.target.value as 'normal' | 'high'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High Contrast</option>
                      </select>
                    </div>

                    {/* Toggle Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Reduce Motion</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Minimize animations and transitions</p>
                        </div>
                        <Button
                          variant={accessibilitySettings.reduceMotion ? "primary" : "outline"}
                          onClick={() => setAccessibilitySettings(prev => ({
                            ...prev,
                            reduceMotion: !prev.reduceMotion
                          }))}
                        >
                          {accessibilitySettings.reduceMotion ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Screen Reader Support</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Optimize for screen readers</p>
                        </div>
                        <Button
                          variant={accessibilitySettings.screenReader ? "primary" : "outline"}
                          onClick={() => setAccessibilitySettings(prev => ({
                            ...prev,
                            screenReader: !prev.screenReader
                          }))}
                        >
                          {accessibilitySettings.screenReader ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Blind Mode</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Adjust colors for color blindness</p>
                        </div>
                        <Button
                          variant={accessibilitySettings.colorBlindMode ? "primary" : "outline"}
                          onClick={() => setAccessibilitySettings(prev => ({
                            ...prev,
                            colorBlindMode: !prev.colorBlindMode
                          }))}
                        >
                          {accessibilitySettings.colorBlindMode ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'ai' ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    AI Assistant Settings
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Interaction Style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Interaction Style
                      </label>
                      <select
                        value={aiSettings.interactionStyle}
                        onChange={(e) => setAiSettings(prev => ({
                          ...prev,
                          interactionStyle: e.target.value as 'formal' | 'casual' | 'technical'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>

                    {/* Response Length */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Response Length
                      </label>
                      <select
                        value={aiSettings.responseLength}
                        onChange={(e) => setAiSettings(prev => ({
                          ...prev,
                          responseLength: e.target.value as 'concise' | 'detailed' | 'comprehensive'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="concise">Concise</option>
                        <option value="detailed">Detailed</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </div>

                    {/* AI Mode Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        AI Service Mode
                      </label>
                      <select
                        value={learningPreferences.aiMode}
                        onChange={(e) => setLearningPreferences(prev => ({ 
                          ...prev, 
                          aiMode: e.target.value as 'standard' | 'advanced'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="standard">Standard (Groq) - Fast & Cost-effective</option>
                        <option value="advanced">Advanced (OpenAI) - High Quality</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Choose your preferred AI service for responses
                      </p>
                    </div>

                    {/* Model Preference */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Model Preference
                      </label>
                      <select
                        value={aiSettings.modelPreference}
                        onChange={(e) => setAiSettings(prev => ({
                          ...prev,
                          modelPreference: e.target.value as 'balanced' | 'fast' | 'advanced'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="balanced">Balanced</option>
                        <option value="fast">Fast Response</option>
                        <option value="advanced">Advanced Capabilities</option>
                      </select>
                    </div>

                    {/* Custom Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Instructions
                      </label>
                      <textarea
                        value={aiSettings.customInstructions}
                        onChange={(e) => setAiSettings(prev => ({
                          ...prev,
                          customInstructions: e.target.value
                        }))}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        placeholder="Add any specific instructions for the AI assistant..."
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="button" 
                        variant="primary"
                        onClick={handleAISettingsSubmit}
                      >
                        Save AI Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'privacy' ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                    <AlertCircle className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Privacy Settings
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Profile Visibility */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings(prev => ({
                          ...prev,
                          profileVisibility: e.target.value as 'public' | 'connections' | 'private'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="public">Public</option>
                        <option value="connections">Connections Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    {/* Activity Sharing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Learning Activity Sharing
                      </label>
                      <select
                        value={privacySettings.activitySharing}
                        onChange={(e) => setPrivacySettings(prev => ({
                          ...prev,
                          activitySharing: e.target.value as 'everyone' | 'connections' | 'none'
                        }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="connections">Connections Only</option>
                        <option value="none">No One</option>
                      </select>
                    </div>

                    {/* Connection Requests */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Connection Requests</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive requests from other learners</p>
                      </div>
                      <Button
                        variant={privacySettings.allowConnectionRequests ? "primary" : "outline"}
                        onClick={() => setPrivacySettings(prev => ({
                          ...prev,
                          allowConnectionRequests: !prev.allowConnectionRequests
                        }))}
                      >
                        {privacySettings.allowConnectionRequests ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    {/* Data Usage Consent */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Usage Consent</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Learning Analytics</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Allow us to analyze your learning patterns</p>
                        </div>
                        <Button
                          variant={privacySettings.dataUsageConsent.learningAnalytics ? "primary" : "outline"}
                          onClick={() => setPrivacySettings(prev => ({
                            ...prev,
                            dataUsageConsent: {
                              ...prev.dataUsageConsent,
                              learningAnalytics: !prev.dataUsageConsent.learningAnalytics
                            }
                          }))}
                        >
                          {privacySettings.dataUsageConsent.learningAnalytics ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">AI Training</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Help improve our AI models</p>
                        </div>
                        <Button
                          variant={privacySettings.dataUsageConsent.aiTraining ? "primary" : "outline"}
                          onClick={() => setPrivacySettings(prev => ({
                            ...prev,
                            dataUsageConsent: {
                              ...prev.dataUsageConsent,
                              aiTraining: !prev.dataUsageConsent.aiTraining
                            }
                          }))}
                        >
                          {privacySettings.dataUsageConsent.aiTraining ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Third-Party Sharing</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Share data with trusted partners</p>
                        </div>
                        <Button
                          variant={privacySettings.dataUsageConsent.thirdPartySharing ? "primary" : "outline"}
                          onClick={() => setPrivacySettings(prev => ({
                            ...prev,
                            dataUsageConsent: {
                              ...prev.dataUsageConsent,
                              thirdPartySharing: !prev.dataUsageConsent.thirdPartySharing
                            }
                          }))}
                        >
                          {privacySettings.dataUsageConsent.thirdPartySharing ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings; 