import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// References to the logo images
const logoImages = {
  dark: '/cognilogo.png', // For dark mode
  light: '/logo2.png'     // For light mode
};

const ConfirmPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { verifyEmail } = useAuth();
  
  const logo = theme === 'dark' ? logoImages.dark : logoImages.light;

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        if (!token) {
          throw new Error('Confirmation token is missing');
        }
        
        const responseMessage = await verifyEmail(token);
        setMessage(responseMessage);
        setIsError(false);
      } catch (error: any) {
        setIsError(true);
        if (error.response) {
          setMessage(error.response.data.message || "Email verification failed.");
        } else {
          setMessage("An error occurred during email verification. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token, verifyEmail]);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="relative flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Link to="/">
              <img
                src={logo}
                alt="CogniEdufy"
                className="mx-auto h-16 w-auto"
              />
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              {loading ? 'Confirming Email...' : (isError ? 'Email Confirmation Failed' : 'Email Confirmation Successful')}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700"
          >
            {loading ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <svg className="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-md text-gray-700 dark:text-gray-300">
                  Please wait while we confirm your email address...
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${isError ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                  {isError ? (
                    <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-md text-gray-700 dark:text-gray-300 mb-6">
                  {isError 
                    ? message || 'There was a problem confirming your email. Please try again or contact support.'
                    : 'Congratulations! Your email has been successfully confirmed. You can now log in to your account.'}
                </p>
                <button
                  onClick={handleLoginRedirect}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                >
                  Go to Login
                </button>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help?{' '}
              <Link to="/contact" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Contact support
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPage; 