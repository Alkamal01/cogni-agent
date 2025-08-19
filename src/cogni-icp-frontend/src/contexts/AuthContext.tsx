import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { canisterId, createActor } from '../../../declarations/cogni-icp-backend';
import type { User as BackendUser } from '../../../declarations/cogni-icp-backend/cogni-icp-backend.did';
import icpChatService from '../services/icpChatService';

// Helper function to convert BigInt values to strings for localStorage
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

// Extend the User type to include properties expected by the frontend
export interface User extends BackendUser {
  name?: string;
  badges?: any[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  loginTraditional: (email: string, password: string) => Promise<void>;
  registerTraditional: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  authClient: AuthClient | null;
  identity: Identity | null;
  backendActor: any | null;
  user: User | null;
  authMethod: 'internet-identity' | 'traditional' | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [backendActor, setBackendActor] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'internet-identity' | 'traditional' | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Initialize backend actor for traditional auth
      const anonymousIdentity = await AuthClient.create();
      const anonymousActor = createActor(canisterId, { 
        agentOptions: { identity: anonymousIdentity.getIdentity() } 
      });
      setBackendActor(anonymousActor);
      
      // Initialize ICP chat service with anonymous actor
      icpChatService.setBackendActor(anonymousActor);
      
      // Check for traditional auth first
      const storedUser = localStorage.getItem('user');
      const storedAuthMethod = localStorage.getItem('authMethod');
      
      if (storedUser && storedAuthMethod === 'traditional') {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setAuthMethod('traditional');
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('authMethod');
        }
        setIsLoading(false);
        return;
      }

      // Initialize Internet Identity auth
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        await handleAuthenticated(client);
        setAuthMethod('internet-identity');
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: 'https://identity.ic0.app',
      onSuccess: () => {
        handleAuthenticated(authClient);
        setAuthMethod('internet-identity');
      },
    });
  };

  const loginTraditional = async (email: string, password: string) => {
    try {
      // Call the backend canister login function
      if (!backendActor) {
        throw new Error('Backend actor not initialized');
      }

      console.log('Calling backend login_user with:', { email });
      const result = await backendActor.login_user(email, password) as any;
      console.log('Backend login response:', result);
      
      if (result.Err) {
        throw new Error(result.Err);
      }

      const userData = result.Ok;
      console.log('User data received:', userData);
      
      // Convert BigInt values to strings for localStorage
      const serializableUserData = convertBigIntToString(userData);
      console.log('Serializable user data:', serializableUserData);
      
      // Store user data in localStorage for traditional auth
      try {
        localStorage.setItem('user', JSON.stringify(serializableUserData));
        localStorage.setItem('authMethod', 'traditional');
      } catch (storageError) {
        console.error('Failed to store user data in localStorage:', storageError);
        // Store a simplified version without BigInt values
        const simplifiedUserData = {
          id: userData.id?.toString(),
          username: userData.username,
          email: userData.email,
          role: userData.role,
          is_active: userData.is_active,
          is_verified: userData.is_verified
        };
        localStorage.setItem('user', JSON.stringify(simplifiedUserData));
        localStorage.setItem('authMethod', 'traditional');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      setAuthMethod('traditional');
    } catch (error: any) {
      console.error('Traditional login failed:', error);
      // Ensure error message is serializable
      const errorMessage = error?.message || error?.toString() || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const registerTraditional = async (username: string, email: string, password: string) => {
    try {
      // Call the backend canister register function
      if (!backendActor) {
        throw new Error('Backend actor not initialized');
      }

      console.log('Calling backend register_user with:', { username, email });
      const result = await backendActor.register_user(username, email, password) as any;
      console.log('Backend response:', result);
      
      if (result.Err) {
        throw new Error(result.Err);
      }

      const userData = result.Ok;
      console.log('User data received:', userData);
      
      // Convert BigInt values to strings for localStorage
      const serializableUserData = convertBigIntToString(userData);
      console.log('Serializable user data:', serializableUserData);
      
      // Store user data in localStorage for traditional auth
      try {
        localStorage.setItem('user', JSON.stringify(serializableUserData));
        localStorage.setItem('authMethod', 'traditional');
      } catch (storageError) {
        console.error('Failed to store user data in localStorage:', storageError);
        // Store a simplified version without BigInt values
        const simplifiedUserData = {
          id: userData.id?.toString(),
          username: userData.username,
          email: userData.email,
          role: userData.role,
          is_active: userData.is_active,
          is_verified: userData.is_verified
        };
        localStorage.setItem('user', JSON.stringify(simplifiedUserData));
        localStorage.setItem('authMethod', 'traditional');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      setAuthMethod('traditional');
    } catch (error: any) {
      console.error('Traditional registration failed:', error);
      // Ensure error message is serializable
      const errorMessage = error?.message || error?.toString() || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const handleAuthenticated = async (client: AuthClient) => {
    const identity = client.getIdentity();
    const actor = createActor(canisterId, { agentOptions: { identity } });
    
    setIdentity(identity);
    setBackendActor(actor);
    
    // Initialize ICP chat service with backend actor
    icpChatService.setBackendActor(actor);
    
    setIsAuthenticated(true);

    const userProfileResult = await actor.get_self() as [User] | [];
    if (userProfileResult.length > 0 && userProfileResult[0]) {
        setUser(userProfileResult[0]);
    } else {
      const principal = identity.getPrincipal().toText();
      const newUser = await actor.create_user(`user_${principal.substring(0, 8)}`, `${principal.substring(0, 8)}@example.com`) as User;
      setUser(newUser);
    }
  };

  const logout = async () => {
    // Clear traditional auth
    localStorage.removeItem('user');
    localStorage.removeItem('authMethod');
    
    // Clear Internet Identity auth
    if (authClient) {
      await authClient.logout();
    }
    
    setIsAuthenticated(false);
    setIdentity(null);
    setBackendActor(null);
    setUser(null);
    setAuthMethod(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
        login,
      loginTraditional,
      registerTraditional,
        logout,
      authClient, 
      identity, 
      backendActor, 
      user,
      authMethod 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};