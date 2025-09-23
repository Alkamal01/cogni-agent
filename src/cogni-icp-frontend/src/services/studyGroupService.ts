import api from '../utils/apiClient';

export interface Topic {
  id: number;
  name: string;
  description: string;
  parent_id?: number;
  parent_name?: string;
  difficulty_level?: string;
  keywords?: string;
  created_at: string;
  child_topics?: Topic[];
}

export interface GroupMember {
  id: number;
  user_id: number;
  group_id: number;
  role: 'member' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'banned';
  joined_at: string;
  contributions: number;
  last_active_at?: string;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface GroupActivity {
  id: number;
  group_id: number;
  user_id: number;
  activity_type: string;
  content: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface StudyResource {
  id: number;
  group_id: number;
  user_id: number;
  title: string;
  description?: string;
  resource_type: 'link' | 'file' | 'note' | 'other';
  resource_url?: string;
  content?: string;
  created_at: string;
}

export interface StudyGroup {
  id: number;
  public_id?: string;
  name: string;
  description?: string;
  creator_id: number;
  topic_id?: number;
  topic_name?: string;
  is_private: boolean;
  max_members: number;
  learning_level: 'beginner' | 'intermediate' | 'advanced';
  meeting_frequency?: string;
  goals?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
  role?: string;
  members?: GroupMember[];
  recent_activities?: GroupActivity[];
  resources?: StudyResource[];
}

export interface CreateStudyGroupParams {
  name: string;
  description?: string;
  topic_id?: number;
  topic_name?: string;
  is_private?: boolean;
  max_members?: number;
  learning_level?: 'beginner' | 'intermediate' | 'advanced';
  meeting_frequency?: string;
  goals?: string;
}

export interface AnalyticsData {
  participationRate: {
    date: string;
    rate: number;
  }[];
  activeMembers: number;
  totalPosts: number;
  resourcesShared: number;
  memberGrowth: {
    date: string;
    count: number;
  }[];
  topContributors: {
    name: string;
    contributions: number;
    avatar?: string;
  }[];
}

// Add new interfaces for polls and sessions
export interface PollOption {
  id: number;
  poll_id: number;
  text: string;
  vote_count: number;
}

export interface Poll {
  id: number;
  group_id: number;
  creator_id: number;
  question: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  options: PollOption[];
  total_votes: number;
  user_vote_id: number | null;
}

export interface CreatePollParams {
  question: string;
  options: string[];
  expires_at?: string;
}

export interface StudySessionParams {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  maxParticipants: number;
  topics?: string[];
}

export interface StudySessionParticipant {
  id: number;
  session_id: number;
  user_id: number;
  status: 'confirmed' | 'pending' | 'declined';
  joined_at: string;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface StudySession {
  id: number;
  group_id: number;
  creator_id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  max_participants: number;
  topics: string[];
  created_at: string;
  is_participant?: boolean;
  participants?: StudySessionParticipant[];
  participant_count?: number;
}

const studyGroupService = {
  /**
   * Get all study groups (public + user's private groups)
   */
  async getAllGroups(filters?: { 
    topic_id?: number, 
    learning_level?: string,
    search?: string 
  }): Promise<StudyGroup[]> {
    let url = '/api/study-groups/';
    
    // Add query parameters if filters provided
    if (filters) {
      const params = new URLSearchParams();
      if (filters.topic_id) params.append('topic_id', filters.topic_id.toString());
      if (filters.learning_level) params.append('learning_level', filters.learning_level);
      if (filters.search) params.append('q', filters.search);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    const response = await api.get(url);
    return response.data.groups || [];
  },
  
  /**
   * Get details for a specific study group
   */
  async getGroupById(groupPublicId: string): Promise<StudyGroup> {
    const response = await api.get(`/api/study-groups/${groupPublicId}`);
    return response.data;
  },
  
  /**
   * Create a new study group
   */
  async createStudyGroup(data: CreateStudyGroupParams): Promise<StudyGroup> {
    const response = await api.post('/api/study-groups/', data);
    return response.data;
  },
  
  /**
   * Update an existing study group
   */
  async updateStudyGroup(groupPublicId: string, data: Partial<CreateStudyGroupParams>): Promise<StudyGroup> {
    const response = await api.put(`/api/study-groups/${groupPublicId}`, data);
    return response.data;
  },
  
  /**
   * Join a study group
   */
  async joinGroup(groupPublicId: string): Promise<{message: string, membership: GroupMember}> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/join`);
    return response.data;
  },
  
  /**
   * Leave a study group
   */
  async leaveGroup(groupPublicId: string): Promise<{message: string}> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/leave`);
    return response.data;
  },
  
  /**
   * Get all available topics
   */
  async getAllTopics(): Promise<Topic[]> {
    const response = await api.get('/api/study-groups/topics');
    return response.data.topics || [];
  },
  
  /**
   * Create a new topic (admin only in a real app)
   */
  async createTopic(data: { 
    name: string, 
    description?: string, 
    parent_id?: number,
    difficulty_level?: string,
    keywords?: string
  }): Promise<Topic> {
    const response = await api.post('/api/study-groups/topics', data);
    return response.data;
  },
  
  /**
   * Add a resource to a study group
   */
  async addResource(groupPublicId: string, data: {
    title: string,
    description?: string,
    resource_type: 'link' | 'file' | 'note' | 'other',
    resource_url?: string,
    content?: string
  }): Promise<StudyResource> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/resources`, data);
    return response.data;
  },
  
  /**
   * Create a new study group (for compatibility with old code)
   * This is an alias for createStudyGroup
   */
  async createGroup(data: CreateStudyGroupParams): Promise<StudyGroup> {
    const response = await api.post('/api/study-groups/', data);
    return response.data;
  },
  
  /**
   * Get analytics data for a study group
   */
  async getGroupAnalytics(groupPublicId: string): Promise<AnalyticsData> {
    const response = await api.get(`/api/study-groups/${groupPublicId}/analytics`);
    return response.data;
  },

  // Poll related methods
  async getGroupPolls(groupPublicId: string): Promise<Poll[]> {
    const response = await api.get(`/api/study-groups/${groupPublicId}/polls`);
    return response.data.polls;
  },

  async createPoll(groupPublicId: string, data: CreatePollParams): Promise<Poll> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/polls`, data);
    return response.data.poll;
  },

  async votePoll(groupPublicId: string, pollId: number, optionId: number): Promise<Poll> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/polls/${pollId}/vote`, { option_id: optionId });
    return response.data.poll;
  },

  async closePoll(groupPublicId: string, pollId: number): Promise<Poll> {
    const response = await api.put(`/api/study-groups/${groupPublicId}/polls/${pollId}/close`);
    return response.data.poll;
  },

  async deletePoll(groupPublicId: string, pollId: number): Promise<void> {
    await api.delete(`/api/study-groups/${groupPublicId}/polls/${pollId}`);
  },

  // Study session related methods
  async getGroupSessions(groupPublicId: string): Promise<StudySession[]> {
    const response = await api.get(`/api/study-groups/${groupPublicId}/sessions`);
    return response.data.sessions;
  },

  async createSession(groupPublicId: string, data: StudySessionParams): Promise<StudySession> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/sessions`, data);
    return response.data.session;
  },

  async joinSession(groupPublicId: string, sessionId: number): Promise<{ message: string; participant: StudySessionParticipant }> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/sessions/${sessionId}/join`);
    return response.data;
  },

  async leaveSession(groupPublicId: string, sessionId: number): Promise<{ message: string }> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/sessions/${sessionId}/leave`);
    return response.data;
  },

  async deleteSession(groupPublicId: string, sessionId: number): Promise<void> {
    await api.delete(`/api/study-groups/${groupPublicId}/sessions/${sessionId}`);
  },

  async updateMemberRole(groupPublicId: string, userId: number, role: 'admin' | 'moderator' | 'member'): Promise<{
    message: string;
    membership: GroupMember;
  }> {
    const response = await api.put(`/api/study-groups/${groupPublicId}/members/${userId}/role`, { role });
    return response.data;
  },

  async removeMember(groupPublicId: string, userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/study-groups/${groupPublicId}/members/${userId}/remove`);
    return response.data;
  },

  async inviteToGroup(groupPublicId: string, username: string): Promise<{
    message: string;
    membership: GroupMember;
  }> {
    const response = await api.post(`/api/study-groups/${groupPublicId}/invite`, { username });
    return response.data;
  }
};

export default studyGroupService;