import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Loader2, Shield, Sun, Moon } from 'lucide-react';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
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

const Register = () => {
  const navigate = useNavigate();
  const { login, registerTraditional, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [zkLoginStatus, setZkLoginStatus] = useState<string>('');
  const [isZkLoginLoading, setIsZkLoginLoading] = useState(false);
  
  const logo = theme === 'dark' ? logoImages.dark : logoImages.light;

  // Check for zkLogin callback on component mount
  useEffect(() => {
    console.log('Register page mounted, checking for OAuth callback...');
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
      await registerTraditional(formData.username, formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      showToast('error', 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Internet Identity registration
  const handleInternetIdentityRegister = async () => {
    try {
      setIsLoading(true);
      await login();
      navigate('/dashboard');
    } catch (error) {
      console.error('Internet Identity registration failed:', error);
      showToast('error', 'Internet Identity registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google registration
  const handleGoogleLogin = () => {
    // Google registration functionality can be implemented here
    showToast('info', 'Google registration coming soon');
  };

  // Handle zkLogin callback
  const handleZkLoginCallback = async (jwt: string) => {
    try {
      setZkLoginStatus('Processing ZK registration...');
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

      setZkLoginStatus('Registration successful!');
      
      // Clear the URL parameters to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('OAuth callback error:', error);
      setZkLoginStatus('Registration failed');
      showToast('error', 'ZK registration failed');
    } finally {
      setIsZkLoginLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Join our learning community</p>
        </div>
        <div className="shadow-xl border-0 rounded-xl bg-white dark:bg-gray-800 relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <div className="p-8">
            {zkLoginStatus && (
              <div className={`mb-4 p-4 rounded-lg border ${
                zkLoginStatus.includes('successful')
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-500/30 dark:text-green-300'
                  : zkLoginStatus.includes('failed')
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300'
                  : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-300'
              }`}>
                <div className="flex items-center space-x-2">
                  <FaTimes className="h-4 w-4" />
                  <p className="mt-1 text-sm">{zkLoginStatus}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                  placeholder="Choose a username"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-gray-600"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center space-x-6">
                <button
                  onClick={handleGoogleLogin}
                  className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-colors"
                  type="button"
                  aria-label="Register with Google"
                >
                  <FcGoogle className="h-6 w-6" />
                </button>
                <button
                  onClick={handleInternetIdentityRegister}
                  className="flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-colors min-w-[200px]"
                  type="button"
                  aria-label="Register with Internet Identity"
                >
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Login with Internet Identity
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;