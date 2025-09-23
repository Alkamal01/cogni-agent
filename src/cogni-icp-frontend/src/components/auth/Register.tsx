import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import ICPIcon from '../shared/ICPIcon';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Loader2 } from 'lucide-react';

// Define logo images based on theme
const logoImages = {
  dark: '/cognilogo.png',
  light: '/logo2.png'
};

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
}

interface TouchedFields {
  first_name: boolean;
  last_name: boolean;
  username: boolean;
  email: boolean;
  password: boolean;
  confirm_password: boolean;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    first_name: false,
    last_name: false,
    username: false,
    email: false,
    password: false,
    confirm_password: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { register, socialLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Check for OAuth errors on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    
    if (oauthError === 'oauth_failed') {
      setErrors({ general: 'OAuth registration failed. Please try again or use email/password registration.' });
      // Clear the error from URL
      navigate('/auth/register', { replace: true });
    }
  }, [location, navigate]);

  // Validate form when inputs change
  useEffect(() => {
    const newErrors: ValidationErrors = {};
    
    if (touchedFields.first_name && !formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (touchedFields.last_name && !formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (touchedFields.username && !formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (touchedFields.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (touchedFields.email && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (touchedFields.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (touchedFields.password && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (touchedFields.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (touchedFields.confirm_password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    
    // Check if form is valid
    const isValid = Object.keys(newErrors).length === 0 &&
                   !!formData.first_name.trim() &&
                   !!formData.last_name.trim() &&
                   !!formData.username.trim() &&
                   !!formData.email.trim() &&
                   !!formData.password &&
                   !!formData.confirm_password &&
                   formData.password === formData.confirm_password;
    setIsFormValid(isValid);
  }, [formData, touchedFields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await register(formData);
      navigate('/registration-success');
    } catch (error: any) {
      setErrors({ general: error.message || 'Registration failed' });
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
    if (!touchedFields[field as keyof TouchedFields]) {
      return `${baseClass} focus:ring-blue-400`;
    }
    return errors[field]
      ? `${baseClass} border border-red-500 focus:ring-red-400`
      : `${baseClass} border border-green-500 focus:ring-green-400`;
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
            {errors.general && (
              <div className="mb-4 p-4 rounded-lg border bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300">
                <div className="flex items-center space-x-2">
                  <FaTimes className="h-4 w-4" />
                  <p className="mt-1 text-sm">{errors.general}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
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
                    onChange={handleInputChange}
                    className={getFieldClass('first_name')}
                    placeholder="Enter your first name"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                  )}
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
                    onChange={handleInputChange}
                    className={getFieldClass('last_name')}
                    placeholder="Enter your last name"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                  )}
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
                  onChange={handleInputChange}
                  className={getFieldClass('username')}
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
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
                  onChange={handleInputChange}
                  className={getFieldClass('email')}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
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
                    onChange={handleInputChange}
                    className={getFieldClass('password')}
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
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
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
                    onChange={handleInputChange}
                    className={getFieldClass('confirm_password')}
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
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
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
                  onClick={() => handleSocialLogin('google')}
                  className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-colors"
                  type="button"
                  aria-label="Register with Google"
                >
                  <FcGoogle className="h-6 w-6" />
                </button>
                <button
                  onClick={() => handleSocialLogin('internet-identity')}
                  className="flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-colors min-w-[200px]"
                  type="button"
                  aria-label="Register with Internet Identity"
                >
                  <ICPIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Login with Internet Identity
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
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
