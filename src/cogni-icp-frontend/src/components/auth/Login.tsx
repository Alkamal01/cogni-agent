import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Mail, Shield, Lock, GraduationCap, Users, CheckCircle, Loader2 } from 'lucide-react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import ICPIcon from '../shared/ICPIcon';

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: ReactNode;
}

// Define logo images based on theme
const logoImages = {
  dark: '/cognilogo.png',
  light: '/logo2.png'
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, socialLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();


  // Check for OAuth errors on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');

    // Check for OAuth error
    if (oauthError === 'oauth_failed') {
      setError('OAuth login failed. Please try again or use email/password login.');
      // Clear the error from URL
      navigate('/auth/login', { replace: true });
    }
  }, [location, navigate]);

  // Validate form when inputs change
  useEffect(() => {
    validateForm();
  }, [email, password]);

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setTouchedFields(prev => ({ ...prev, email: true }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setTouchedFields(prev => ({ ...prev, password: true }));
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof ValidationErrors) => {
    return touchedFields[field] && errors[field];
  };

  // Handle traditional login with email/password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Failed to login';
      
      if (err.response?.data?.error === 'Please verify your email before logging in') {
        errorMessage = 'Please verify your email before logging in';
        setEmailNotVerified(true);
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setErrors(prev => ({ ...prev, general: errorMessage }));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    socialLogin(provider);
  };

  const getFieldClass = (field: keyof ValidationErrors) => {
    const isDark = theme === 'dark';
    const baseClass = isDark
      ? "w-full px-4 py-3 text-gray-100 bg-gray-700 bg-opacity-50 rounded-md focus:outline-none focus:ring-2"
      : "w-full px-4 py-3 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-2";
    if (!touchedFields[field]) {
      return `${baseClass} focus:ring-blue-400`;
    }
    return errors[field]
      ? `${baseClass} border border-red-500 focus:ring-red-400`
      : `${baseClass} border border-green-500 focus:ring-green-400`;
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
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Authentication Failed</h3>
                    <p className="mt-1 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="Enter your email"
                  required
                  className={getFieldClass('email')}
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
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter your password"
                    required
                    className={getFieldClass('password')}
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
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
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
                onClick={() => handleSocialLogin('google')}
                className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-colors"
                type="button"
                aria-label="Login with Google"
              >
                <FcGoogle className="h-6 w-6" />
              </button>
              <button
                onClick={() => handleSocialLogin('internet-identity')}
                className="flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-colors min-w-[200px]"
                type="button"
                aria-label="Login with Internet Identity"
              >
                <ICPIcon className="h-5 w-5 mr-2" />
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

const FeatureItem: React.FC<{ icon: ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <li className="flex items-start">
    <div className="flex-shrink-0">
      {icon}
    </div>
    <div className="ml-3">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </li>
);


export default Login;