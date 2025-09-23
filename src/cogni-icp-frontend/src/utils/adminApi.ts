const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/admin` : 'http://localhost:5000/api/admin';

interface AdminApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class AdminApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AdminApiError';
  }
}

const getAuthHeaders = () => {
  // Get token from cookies (same as regular auth)
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
    
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      window.location.href = '/admin/login';
      throw new AdminApiError('Authentication required', 401);
    }
    
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new AdminApiError(errorData.error || `HTTP ${response.status}`, response.status);
  }
  
  return response.json();
};

export const adminApi = {
  // Authentication
  async verifyAccess() {
    const response = await fetch(`${API_BASE_URL}/verify`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Dashboard stats
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Analytics data
  async getAnalytics() {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // User management
  async getUsers(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    role?: string;
    subscription?: string;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    const response = await fetch(`${API_BASE_URL}/users?${queryString}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async getUserDetails(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async updateUserStatus(userId: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  async updateUserRole(userId: string, role: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return handleResponse(response);
  },

  async updateUserSubscription(userId: string, subscription: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/subscription`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subscription })
    });
    return handleResponse(response);
  },

  async deleteUser(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async bulkUserAction(userIds: string[], action: string, value?: string) {
    const response = await fetch(`${API_BASE_URL}/users/bulk-action`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_ids: userIds.map(id => parseInt(id)),
        action,
        value
      })
    });
    return handleResponse(response);
  },

  // Password management
  async resetUserPassword(userId: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_password: newPassword })
    });
    return handleResponse(response);
  },

  async generateUserPassword(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/generate-password`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getTasks: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/admin', '')}/tasks/admin`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  createTask: async (taskData: any) => {
    const response = await fetch(`${API_BASE_URL.replace('/admin', '')}/tasks/admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(response);
  },

  updateTask: async (taskId: string, taskData: any) => {
    const response = await fetch(`${API_BASE_URL.replace('/admin', '')}/tasks/admin/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(response);
  },

  deleteTask: async (taskId: string) => {
    const response = await fetch(`${API_BASE_URL.replace('/admin', '')}/tasks/admin/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
};

export { AdminApiError }; 