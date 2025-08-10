import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, loginTraditional } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Processing authentication...');

        // Check for Internet Identity authentication
        const urlParams = new URLSearchParams(location.search);
        const idToken = urlParams.get('id_token');
        
        if (idToken) {
          // Handle Internet Identity callback
          setMessage('Completing Internet Identity authentication...');
          
          try {
            await login();
            setStatus('success');
            setMessage('Internet Identity authentication successful!');
            showToast('success', 'Successfully authenticated with Internet Identity');
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
            return;
          } catch (error) {
            console.error('Internet Identity authentication failed:', error);
            setStatus('error');
            setMessage('Internet Identity authentication failed');
            showToast('error', 'Internet Identity authentication failed');
            
            setTimeout(() => {
              navigate('/login');
            }, 2000);
            return;
          }
        }

        // Check for traditional OAuth token
        const token = urlParams.get('token');
        const code = urlParams.get('code');

        if (token || code) {
          // Handle traditional OAuth callback
          setMessage('Completing traditional authentication...');
          
          try {
            // Store token if provided
            if (token) {
              localStorage.setItem('token', token);
            }

            // Fetch user data
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              throw new Error('Failed to get user data');
            }

            const data = await response.json();
            
            // Store user data for traditional auth
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('authMethod', 'traditional');
            
            setStatus('success');
            setMessage('Traditional authentication successful!');
            showToast('success', 'Successfully logged in');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } catch (error) {
            console.error('Traditional OAuth callback error:', error);
            setStatus('error');
            setMessage('Traditional authentication failed');
            showToast('error', 'Authentication failed');
            
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
          return;
        }

        // No valid authentication parameters found
        setStatus('error');
        setMessage('No authentication parameters found');
        showToast('error', 'Invalid authentication callback');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed');
        showToast('error', 'Authentication failed');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    processOAuthCallback();
  }, [navigate, location, showToast, login]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          <div className="space-y-2">
            <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
              {status === 'loading' && 'Processing Authentication'}
              {status === 'success' && 'Authentication Successful'}
              {status === 'error' && 'Authentication Failed'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {message}
            </p>
          </div>

          {status === 'loading' && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="h-4 w-4" />
                <span>Securing your connection...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback; 