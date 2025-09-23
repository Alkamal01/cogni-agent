import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Loading } from '../../components/shared';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setUser } = useAuth();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
          showToast('error', 'Authentication failed');
          navigate('/auth/login');
          return;
        }

        // Store token
        localStorage.setItem('token', token);

        // Fetch user data
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to get user data');
        }

        const data = await response.json();
        setUser(data.user);
        
        showToast('success', 'Successfully logged in');
        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback error:', error);
        showToast('error', 'Authentication failed');
        navigate('/login');
      }
    };

    processOAuthCallback();
  }, [navigate, showToast, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Completing authentication...
      </p>
    </div>
  );
};

export default OAuthCallback; 