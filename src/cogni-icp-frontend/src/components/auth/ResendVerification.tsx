import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../cognilogo.png';

const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resendVerification } = useAuth();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await resendVerification(email);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="relative flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-md w-full space-y-6 bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Resend Verification Email</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Enter your email address to receive a new verification link
          </p>

          {error && (
            <div className="px-4 py-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="px-4 py-3 text-sm text-green-500 bg-green-100 dark:bg-green-900/20 rounded-md">
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleResend}>
            <div>
              <label htmlFor="email" className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 mt-1 text-gray-100 bg-gray-700 bg-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-white rounded-md transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link to="/login" className="text-blue-400 hover:underline">
                Back to Login
              </Link>
              <Link to="/auth/register" className="text-blue-400 hover:underline">
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification; 