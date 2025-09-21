import { authService } from '../services/authService';
import aiSocketService from '../services/aiSocketService';

// Add this function to the window object for debugging
declare global {
  interface Window {
    checkAuthStatus: () => void;
  }
}

/**
 * Checks and logs authentication status for debugging purposes
 */
export function checkAuthStatus() {
  const token = authService.getToken();
  const isAuthenticated = authService.isAuthenticated();
  const socketConnected = aiSocketService.isSocketConnected();

  console.log('Auth Status:', {
    token: token ? 'Present' : 'Missing',
    isAuthenticated,
    socketConnected
  });

  return {
    token: token ? 'Present' : 'Missing',
    isAuthenticated,
    socketConnected
  };
}

// Make the function available globally for debugging
window.checkAuthStatus = checkAuthStatus;

export default { checkAuthStatus }; 