import apiClient from '../utils/apiClient';

export interface StudySet {
  id: number;
  public_id: string;
  user_id: number;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  is_public: boolean;
  allow_collaboration: boolean;
  created_at: string;
  updated_at: string;
  recordings_count: number;
  notes_count: number;
  quizzes_count: number;
  flashcards_count: number;
  recordings?: StudyRecording[];
  notes?: StudyNote[];
  quizzes?: StudyQuiz[];
  flashcards?: StudyFlashcard[];
}

export interface StudyRecording {
  id: number;
  public_id: string;
  study_set_id: number;
  user_id: number;
  title: string;
  description: string;
  duration: number;
  file_path: string;
  file_size: number;
  file_type: string;
  transcription_status: string;
  transcription_text: string;
  summary_status: string;
  summary_text: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface StudyNote {
  id: number;
  public_id: string;
  study_set_id: number;
  recording_id?: number;
  user_id: number;
  title: string;
  content: string;
  note_type: string;
  format_type: string;
  tags: string[];
  key_points: string[];
  created_at: string;
  updated_at: string;
}

export interface StudyQuiz {
  id: number;
  public_id: string;
  study_set_id: number;
  user_id: number;
  title: string;
  description: string;
  difficulty: string;
  quiz_type: string;
  questions: QuizQuestion[];
  time_limit?: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  created_at: string;
  updated_at: string;
  attempts_count: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
  points: number;
}

export interface StudyFlashcard {
  id: number;
  public_id: string;
  study_set_id: number;
  user_id: number;
  front_text: string;
  back_text: string;
  front_image?: string;
  back_image?: string;
  category: string;
  tags: string[];
  difficulty: string;
  times_reviewed: number;
  times_correct: number;
  accuracy: number;
  last_reviewed?: string;
  next_review?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyGame {
  id: number;
  public_id: string;
  study_set_id: number;
  user_id: number;
  title: string;
  game_type: string;
  difficulty: string;
  game_data: any;
  time_limit?: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStudySetData {
  title: string;
  description?: string;
  subject?: string;
  tags?: string[];
  is_public?: boolean;
  allow_collaboration?: boolean;
}

export interface StudySetFilters {
  search?: string;
  subject?: string;
  page?: number;
  per_page?: number;
}

class StudySetService {
  private baseUrl = '/api/study-sets/';

  // Test method to verify API connectivity
  async testConnection(): Promise<any> {
    console.log('🔥 Testing API connection...');
    console.log('Base URL:', this.baseUrl);
    console.log('API Client base URL:', apiClient.defaults.baseURL);

    try {
      const response = await apiClient.get(`${this.baseUrl}test`);
      console.log('🔥 Test API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔥 Test API Error:', error);
      throw error;
    }
  }

  // Study Set CRUD operations
  async getStudySets(filters: StudySetFilters = {}): Promise<{ study_sets: StudySet[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    
    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async getStudySet(studySetId: string): Promise<StudySet> {
    const response = await apiClient.get(`${this.baseUrl}${studySetId}`);
    return response.data;
  }

  async createStudySet(data: CreateStudySetData): Promise<StudySet> {
    const response = await apiClient.post(this.baseUrl, data);
    return response.data;
  }

  async updateStudySet(studySetId: string, data: Partial<CreateStudySetData>): Promise<StudySet> {
    const response = await apiClient.put(`${this.baseUrl}${studySetId}`, data);
    return response.data;
  }

  async deleteStudySet(studySetId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}${studySetId}`);
  }

  // Recording operations
  async uploadRecording(studySetId: string, file: File, metadata: {
    title: string;
    description?: string;
    duration?: number;
    file_type: string;
  }): Promise<StudyRecording> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.duration) formData.append('duration', metadata.duration.toString());
    formData.append('file_type', metadata.file_type);

    const response = await apiClient.post(
      `${this.baseUrl}${studySetId}/recordings`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.recording;
  }

  async transcribeRecording(studySetId: string, recordingId: string): Promise<string> {
    const response = await apiClient.post(
      `${this.baseUrl}${studySetId}/recordings/${recordingId}/transcribe`
    );
    return response.data.transcription;
  }

  // Notes operations
  async createNote(studySetId: string, data: {
    title: string;
    content: string;
    recording_id?: number;
    note_type?: string;
    tags?: string[];
  }): Promise<StudyNote> {
    const response = await apiClient.post(`${this.baseUrl}${studySetId}/notes`, data);
    return response.data.note;
  }

  async generateNotesFromRecording(studySetId: string, recordingId: string): Promise<StudyNote> {
    console.log('🔥 StudySetService.generateNotesFromRecording called');
    console.log('Study Set ID:', studySetId);
    console.log('Recording ID:', recordingId);
    console.log('Base URL:', this.baseUrl);
    console.log('Full URL:', `${this.baseUrl}${studySetId}/recordings/${recordingId}/generate-notes`);
    console.log('API Client base URL:', apiClient.defaults.baseURL);

    try {
      const response = await apiClient.post(
        `${this.baseUrl}${studySetId}/recordings/${recordingId}/generate-notes`
      );
      console.log('🔥 API Response:', response.data);
      return response.data.note;
    } catch (error) {
      console.error('🔥 API Error in service:', error);
      throw error;
    }
  }

  // Quiz operations
  async listQuizzes(studySetId: string): Promise<StudyQuiz[]> {
    const response = await apiClient.get(`${this.baseUrl}${studySetId}/quizzes`);
    return response.data.quizzes;
  }

  async getQuiz(studySetId: string, quizPublicId: string): Promise<StudyQuiz> {
    const response = await apiClient.get(`${this.baseUrl}${studySetId}/quizzes/${quizPublicId}`);
    return response.data.quiz;
  }

  async deleteQuiz(studySetId: string, quizPublicId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}${studySetId}/quizzes/${quizPublicId}`);
  }

  async startQuizAttempt(studySetId: string, quizPublicId: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}${studySetId}/quizzes/${quizPublicId}/start`);
    return response.data.attempt;
  }

  async submitQuizAnswers(studySetId: string, quizPublicId: string, data: { answers: Record<string, any>; time_taken?: number }): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}${studySetId}/quizzes/${quizPublicId}/submit`, data);
    return response.data;
  }

  async createQuiz(studySetId: string, data: {
    title: string;
    description?: string;
    difficulty?: string;
    quiz_type?: string;
    questions: QuizQuestion[];
  }): Promise<StudyQuiz> {
    const response = await apiClient.post(`${this.baseUrl}${studySetId}/quizzes`, data);
    return response.data.quiz;
  }

  async generateQuizFromContent(studySetId: string, options: {
    source_type: 'recording' | 'notes' | 'all';
    source_id: string;
    question_count?: number;
    difficulty?: string;
    quiz_type?: string;
  }): Promise<StudyQuiz> {
    const response = await apiClient.post(
      `${this.baseUrl}${studySetId}/generate-quiz`,
      options
    );
    return response.data.quiz;
  }

  async generateQuizFromRecording(studySetId: string, recordingId: string): Promise<StudyQuiz> {
    console.log('🔥 StudySetService.generateQuizFromRecording called');
    console.log('Study Set ID:', studySetId);
    console.log('Recording ID:', recordingId);
    console.log('Full URL:', `${this.baseUrl}${studySetId}/recordings/${recordingId}/generate-quiz`);

    const response = await apiClient.post(
      `${this.baseUrl}${studySetId}/recordings/${recordingId}/generate-quiz`
    );
    console.log('🔥 API Response:', response.data);
    return response.data.quiz;
  }

  // Flashcard operations
  async createFlashcard(studySetId: string, data: {
    front_text: string;
    back_text: string;
    category?: string;
    tags?: string[];
    difficulty?: string;
  }): Promise<StudyFlashcard> {
    const response = await apiClient.post(`${this.baseUrl}${studySetId}/flashcards`, data);
    return response.data;
  }

  async generateFlashcardsFromContent(studySetId: string, options: {
    source_type: 'all' | 'recordings' | 'notes';
    source_id?: string;
    card_count?: number;
    difficulty?: string;
  }): Promise<StudyFlashcard[]> {
    console.log('🔥 StudySetService.generateFlashcardsFromContent called');
    console.log('Study Set ID:', studySetId);
    console.log('Options:', options);
    console.log('Full URL:', `${this.baseUrl}${studySetId}/generate-flashcards`);

    const response = await apiClient.post(
      `${this.baseUrl}${studySetId}/generate-flashcards`,
      options
    );
    console.log('🔥 API Response:', response.data);
    return response.data.flashcards;
  }

  // Game operations
  async generateGame(studySetId: string, options: {
    game_type: string;
    source_type: 'recording' | 'notes' | 'flashcards';
    source_id: string;
    difficulty?: string;
  }): Promise<StudyGame> {
    const response = await apiClient.post(
      `${this.baseUrl}${studySetId}/generate-game`,
      options
    );
    return response.data.game;
  }
}

const studySetService = new StudySetService();
export default studySetService;
