import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, Shield, Sun, Moon } from 'lucide-react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import zkLoginService from '../services/zkLoginService';

// References to the logo images
const logoImages = {
  dark: '/cognilogo.png', // For dark mode
  light: '/logo2.png'     // For light mode
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginTraditional, isLoading: authLoading, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [zkLoginStatus, setZkLoginStatus] = useState<string>('');
  const [isZkLoginLoading, setIsZkLoginLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const logo = theme === 'dark' ? logoImages.dark : logoImages.light;

  // Check for zkLogin callback on component mount
  useEffect(() => {
    console.log('Login page mounted, checking for OAuth callback...');
    console.log('Current location:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    // Check for id_token in query parameters
    const params = new URLSearchParams(location.search);
    let idToken = params.get('id_token');
    
    // If not found in query params, check URL fragment
    if (!idToken && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      idToken = hashParams.get('id_token');
    }
    
    console.log('id_token found:', !!idToken);
    
    if (idToken) {
      console.log('Processing zkLogin callback...');
      handleZkLoginCallback(idToken);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if auth is still loading
    if (authLoading) {
      showToast('error', 'Please wait for the system to initialize...');
      return;
    }
    
    setIsLoading(true);

    try {
      await loginTraditional(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      showToast('error', 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  
  // Handle Internet Identity login
  const handleInternetIdentityLogin = async () => {
    try {
      setIsLoading(true);
      await login();
      navigate('/dashboard');
    } catch (error) {
      console.error('Internet Identity login failed:', error);
      showToast('error', 'Internet Identity login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login (Python backend redirect)
  const handleGoogleLogin = () => {
    try {
      loginWithGoogle && loginWithGoogle();
    } catch (e) {
      showToast('error', 'Unable to start Google login');
    }
  };

  // Handle zkLogin callback
  const handleZkLoginCallback = async (jwt: string) => {
    try {
      setZkLoginStatus('Processing ZK login...');
      setIsZkLoginLoading(true);

      // Complete zkLogin flow
      const result = await zkLoginService.handleOAuthCallback(jwt);

      // Extract email from JWT if available, otherwise use form email or generate one
      const userEmail = (result.decodedJwt as any)?.email || formData.email || `${result.zkLoginAddress.slice(0, 8)}@zklogin.user`;

      // Send result to backend for user creation/authentication
      const response = await fetch('/api/auth/zk-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zkLoginAddress: result.zkLoginAddress,
          userSalt: result.userSalt,
          jwt: jwt,
          email: userEmail,
          decodedJwt: result.decodedJwt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backend authentication failed');
      }

      const authData = await response.json();

      // Store authentication token
      localStorage.setItem('token', authData.token);

      setZkLoginStatus('Login successful!');
      
      // Clear the URL parameters to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('OAuth callback error:', error);
      setZkLoginStatus('Login failed');
      showToast('error', 'ZK login failed');
    } finally {
      setIsZkLoginLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center space-x-2 mb-0">
            <img src={theme === 'dark' ? logoImages.dark : logoImages.light} alt="CogniEdufy" className="h-8 w-8" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              CogniEdufy
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0">Welcome Back!</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Sign in to your account</p>
        </div>
        <div className="shadow-xl border-0 rounded-xl bg-white dark:bg-gray-800 relative">
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <div className="p-6">
            {zkLoginStatus && (
              <div className={`mb-4 p-4 rounded-lg border ${
                zkLoginStatus.includes('successful')
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-500/30 dark:text-green-300'
                  : zkLoginStatus.includes('failed')
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300'
                  : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-300'
              }`}>
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    {isZkLoginLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : zkLoginStatus.includes('successful') ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : zkLoginStatus.includes('failed') ? (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Authentication Status</h3>
                    <p className="mt-1 text-sm">{zkLoginStatus}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
                disabled={isLoading || authLoading}
              >
                {authLoading ? 'Initializing...' : isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Create one
                </Link>
              </p>
            </form>
            {/* Divider and Social Login Buttons below the form */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="mx-4 text-gray-400 dark:text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="flex items-center justify-center space-x-6 mb-2">
              <button
                onClick={handleGoogleLogin}
                className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-colors"
                type="button"
                aria-label="Login with Google"
              >
                <FcGoogle className="h-6 w-6" />
              </button>
              <button
                onClick={handleInternetIdentityLogin}
                className="flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-colors min-w-[200px]"
                type="button"
                aria-label="Login with Internet Identity"
              >
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Login with Internet Identity
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 