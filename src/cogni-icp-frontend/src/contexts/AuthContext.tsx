import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import api from '../utils/apiClient';

// Create a custom API instance for auth
const authApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth` : 'http://localhost:5000/api/auth'
});

// Add request interceptor to attach JWT token to all requests
authApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      // Set the Authorization header with the token
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      // Ensure content type is set
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Add session ID if available
    const sessionId = Cookies.get('session_id');
    if (sessionId) {
      config.headers = config.headers || {};
      config.headers['X-Session-ID'] = sessionId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let the global apiClient interceptor handle this
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

interface User {
  id: number;
  public_id: string;
  name: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  created_at: string;
  avatar_url?: string;
  bio?: string;
  points?: number;
  badges?: any[];
  survey_completed?: boolean;
  is_admin?: boolean;
  subscription?: string; // free, pro, enterprise
}

interface RegisterData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  socialLogin: (provider: string) => void;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<string>;
  verifyEmail: (token: string) => Promise<string>;
  resendVerification: (email: string) => Promise<string>;
  refreshUserData: () => Promise<void>;
  sessionId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Fetch user data - extracted as a reusable function
  const fetchUserData = useCallback(async (token: string, sessionIdValue?: string | null) => {
    try {
      // Add a delay to prevent rapid firing of requests
      const response = await authApi.get('/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Session-ID': sessionIdValue || Cookies.get('session_id') || '',
        }
      });
      
      if (response.data) {
        console.log("User data retrieved successfully");
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Special handling for 422 errors which might indicate invalid token format
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        console.warn("Received 422 error - likely invalid token format. Clearing token.");
        Cookies.remove('token');
      }
      
      return false;
    }
  }, []);

  // Refresh token function
  const refreshAuthToken = useCallback(async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) return false;
    
    try {
      console.log("Attempting to refresh token");
      const response = await axios.post(process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth/refresh` : 'http://localhost:5000/api/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      });
      
      if (response.data.access_token) {
        console.log("Token refreshed successfully");
        // Store the new access token
        Cookies.set('token', response.data.access_token, { expires: 1 }); // 1 day expiry
        
        // Return true to indicate success, but don't update user state directly here
        // This prevents potential infinite loops
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    // Track whether the component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        console.log("Checking authentication status");
        
        // Check for tokens
        const token = Cookies.get('token');
        const refreshToken = Cookies.get('refresh_token');
        const storedSessionId = Cookies.get('session_id');
        
        // Set session ID if it exists
        if (storedSessionId && isMounted) {
          setSessionId(parseInt(storedSessionId, 10));
        }
        
        // Try using access token first
        if (token) {
          console.log("Found access token, attempting to use it");
          const success = await fetchUserData(token);
          if (success && isMounted) {
            setIsLoading(false);
            return;
          }
        }
        
        // If no token or token failed, try to refresh
        if (refreshToken) {
          console.log("Access token invalid or missing, trying to refresh");
          const refreshed = await refreshAuthToken();
          if (refreshed && isMounted) {
            // Token refreshed, now try to fetch user data
            const newToken = Cookies.get('token');
            if (newToken) {
              await fetchUserData(newToken);
            }
            if (isMounted) setIsLoading(false);
            return;
          }
        }
        
        // If we reach here, user is not authenticated
        console.log("Authentication failed, user not logged in");
        if (isMounted) setUser(null);
      } catch (error) {
        console.error("Authentication check failed:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [fetchUserData, refreshAuthToken]); // Remove user dependency to prevent loop

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const response = await authApi.post('/login', { email, password });
      
      if (response.data.access_token) {
        const token = response.data.access_token;
        console.log("Login successful, storing tokens");
        
        // Store the JWT token in a cookie
        Cookies.set('token', token, { expires: 1 }); // 1 day expiry
        
        // Store session ID if provided
        if (response.data.session_id) {
          setSessionId(response.data.session_id);
          Cookies.set('session_id', response.data.session_id.toString(), { expires: 30 }); // 30 days expiry
        }
        
        // Store refresh token if provided
        if (response.data.refresh_token) {
          console.log("Storing refresh token");
          Cookies.set('refresh_token', response.data.refresh_token, { expires: 30 }); // 30 days expiry
        }
        
        // Set user data directly from the login response if available
        if (response.data.user) {
          console.log("Setting user data from login response");
          setUser(response.data.user);
          return; // Skip the additional /me request if we already have user data
        }
        
        // If user data not in login response, fetch it from /me endpoint
        await fetchUserData(token, response.data.session_id?.toString());
      } else {
        console.error("Login response missing access token");
        throw new Error('Login failed: No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial auth data on login failure
      Cookies.remove('token');
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await authApi.post('/register', data);
      // Registration successful, but user needs to verify email before login
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Client-side logout helper
  const performClientLogout = useCallback(() => {
    console.log("Performing client-side logout");
    // Clear all auth-related cookies
    Cookies.remove('token');
    Cookies.remove('refresh_token');
    Cookies.remove('session_id');
    
    // Clear Authorization header
    delete authApi.defaults.headers.common['Authorization'];
    
    // Reset user state
    setUser(null);
    setSessionId(null);
    
    // Redirect to login page
    window.location.href = '/auth/login';
  }, []);

  const logout = useCallback(() => {
    try {
      console.log("Logging out user");
      // Call logout endpoint with session ID if available
      authApi.post('/logout', {}, {
        headers: {
          'X-Session-ID': sessionId?.toString() || ''
        }
      }).catch(error => {
        console.error('Error calling logout endpoint:', error);
        // Continue with client-side logout even if server logout fails
      }).finally(() => {
        performClientLogout();
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure cleanup happens even if there's an error
      performClientLogout();
    }
  }, [sessionId, performClientLogout]);

  const socialLogin = async (provider: string) => {
    if (provider === 'google') {
      // Redirect to backend OAuth endpoint for Google
      window.location.href = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth/oauth/google` : 'http://localhost:5000/api/auth/oauth/google';
    } else if (provider === 'internet-identity') {
      // Use Internet Identity service for direct authentication
      setIsLoading(true);
      try {
        const { internetIdentityService } = await import('../services/internetIdentityService');
        
        // Initialize the service if not already done
        await internetIdentityService.init();
        
        // Complete the login flow
        const result = await internetIdentityService.completeLogin();
        
        if (result.success && result.access_token && result.user) {
          // Store tokens
          localStorage.setItem('access_token', result.access_token);
          if (result.refresh_token) {
            localStorage.setItem('refresh_token', result.refresh_token);
          }
          
          // Update auth state
          setUser(result.user);
          
          console.log('Internet Identity login successful');
        } else {
          console.error('Internet Identity login failed:', result.error);
          // You might want to show an error toast here
        }
      } catch (error) {
        console.error('Internet Identity login error:', error);
        // You might want to show an error toast here
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error(`OAuth provider ${provider} not implemented`);
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      const response = await authApi.post('/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string, confirmPassword: string): Promise<string> => {
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      const response = await authApi.post(`/reset-password/${token}`, { 
        password, 
        confirm_password: confirmPassword 
      });
      
      return response.data.message;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const verifyEmail = async (token: string): Promise<string> => {
    try {
      const response = await authApi.get(`/verify-email/${token}`);
      return response.data.message;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const resendVerification = async (email: string): Promise<string> => {
    try {
      const response = await authApi.post('/resend-verification', { email });
      return response.data.message;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      const token = Cookies.get('token');
      if (token) {
        console.log('Refreshing user data...');
        const success = await fetchUserData(token);
        if (success) {
          console.log('User data refreshed successfully');
        } else {
          console.error('Failed to refresh user data');
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        setUser,
        socialLogin,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        refreshUserData,
        sessionId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 