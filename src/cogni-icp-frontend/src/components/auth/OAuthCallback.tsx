import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../shared';
import Cookies from 'js-cookie';

const OAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Extract the tokens from the URL query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refresh_token');
        const sessionId = params.get('session_id');
        const error = params.get('error');
        
        if (error) {
          console.error('OAuth error:', error);
          navigate('/auth/login?error=oauth_failed');
          return;
        }
        
        if (!token) {
          throw new Error('No authentication token received');
        }
        
        // Store the tokens in cookies
        Cookies.set('token', token, { expires: 1 }); // 1 day expiry
        if (refreshToken) {
          Cookies.set('refresh_token', refreshToken, { expires: 7 }); // 7 days expiry
        }
        if (sessionId) {
          Cookies.set('session_id', sessionId, { expires: 1 });
        }
        
        // Fetch user data with the new token
        const response = await fetch(process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth/me` : 'http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        if (data) {
          setUser(data);
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback processing failed:', error);
        // If anything goes wrong, redirect to login page
        navigate('/auth/login?error=oauth_failed');
      }
    };
    
    processOAuthCallback();
  }, [location, navigate, setUser]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Loading size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Completing login, please wait...
      </p>
    </div>
  );
};

export default OAuthCallback; 