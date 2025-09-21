import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { canisterId, createActor } from '../../../declarations/cogni-icp-backend';
import type { User as BackendUser } from '../../../declarations/cogni-icp-backend/cogni-icp-backend.did';
import pythonAuthService from '../services/pythonAuthService';
import { useToast } from './ToastContext';
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
  requestPasswordReset?: (email: string) => Promise<void>;
  resetPassword?: (token: string, password: string) => Promise<void>;
  verifyEmail?: (token: string) => Promise<void>;
  loginWithGoogle?: () => void;
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
  const { showToast } = useToast();

  // Sync Python-authenticated user metadata into ICP canister (best-effort)
  const syncExternalUserToCanister = async (me: any) => {
    try {
      if (!backendActor || !me) return;
      const userLike = me.user || me;
      if (!userLike?.email) return;
      const email: string = userLike.email;
      const username: string | undefined = userLike.username || userLike.name;
      const firstName: string | undefined = userLike.first_name || userLike.firstName;
      const lastName: string | undefined = userLike.last_name || userLike.lastName;
      const avatarUrl: string | undefined = userLike.avatar_url || userLike.avatar || userLike.imageUrl;
      const isVerified: boolean | undefined = userLike.is_verified ?? userLike.email_verified ?? userLike.verified;

      // Call canister upsert (ignore response)
      if (typeof backendActor?.upsert_external_user !== 'function') {
        return; // No canister bindings available in this environment
      }
      await backendActor.upsert_external_user(
        email,
        username ? [username] : [],
        firstName ? [firstName] : [],
        lastName ? [lastName] : [],
        avatarUrl ? [avatarUrl] : [],
        typeof isVerified === 'boolean' ? [isVerified] : [],
      );
      showToast('success', 'Profile synced to ICP canister');
    } catch (e) {
      console.warn('User sync to canister failed (non-fatal):', e);
      showToast('warning', 'Profile sync to canister failed. Will retry.');
      // Minimal retry once after a short delay
      setTimeout(async () => {
        try {
          if (!backendActor) return;
          const userLike = me.user || me;
          if (!userLike?.email) return;
          await backendActor.upsert_external_user(
            userLike.email,
            userLike.username ? [userLike.username] : [],
            userLike.first_name ? [userLike.first_name] : [],
            userLike.last_name ? [userLike.last_name] : [],
            (userLike.avatar_url || userLike.avatar || userLike.imageUrl) ? [userLike.avatar_url || userLike.avatar || userLike.imageUrl] : [],
            typeof (userLike.is_verified ?? userLike.email_verified ?? userLike.verified) === 'boolean' ? [Boolean(userLike.is_verified ?? userLike.email_verified ?? userLike.verified)] : [],
          );
          showToast('success', 'Profile synced to ICP canister');
        } catch (e2) {
          console.warn('Retry user sync failed:', e2);
        }
      }, 1200);
    }
  };

  // Resolve IC host (boundary) for agent; default to mainnet boundary
  const IC_HOST: string = (import.meta as any).env?.VITE_IC_HOST || 'https://ic0.app';

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // Try Python auth first (token stored in cookies/localStorage). If it works, skip canister actor init.
      try {
        const me = await pythonAuthService.me();
        if (me && (me.user || me.username || me.email)) {
          setUser(me.user || me);
          setIsAuthenticated(true);
          setAuthMethod('traditional');
          // Best-effort sync to canister
          await syncExternalUserToCanister(me);
      setIsLoading(false);
      return;
        }
      } catch {}

      // Initialize backend actor for Internet Identity path
      const authClient = await AuthClient.create();
      setAuthClient(authClient);
      const anonymousActor = createActor(canisterId, { 
        agentOptions: { identity: authClient.getIdentity(), host: IC_HOST } 
      });
      setBackendActor(anonymousActor);
      // Initialize ICP chat service with anonymous actor
      icpChatService.setBackendActor(anonymousActor);

      if (await authClient.isAuthenticated()) {
        await handleAuthenticated(authClient);
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
      // Python backend login
      const resp = await pythonAuthService.login(email, password);
      const me = await pythonAuthService.me();
      setUser(me.user || me);
      setIsAuthenticated(true);
      setAuthMethod('traditional');
      // Best-effort sync to canister after login
      await syncExternalUserToCanister(me);
    } catch (error: any) {
      console.error('Traditional login failed:', error);
      // Ensure error message is serializable
      const errorMessage = error?.message || error?.toString() || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const registerTraditional = async (username: string, email: string, password: string) => {
    try {
      await pythonAuthService.register(username, email, password);
      const me = await pythonAuthService.me();
      setUser(me.user || me);
      setIsAuthenticated(true);
      setAuthMethod('traditional');
      // Best-effort sync to canister after register
      await syncExternalUserToCanister(me);
    } catch (error: any) {
      console.error('Traditional registration failed:', error);
      // Ensure error message is serializable
      const errorMessage = error?.message || error?.toString() || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const handleAuthenticated = async (client: AuthClient) => {
    const identity = client.getIdentity();
    const actor = createActor(canisterId, { agentOptions: { identity, host: IC_HOST } });
    
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
    // Clear traditional auth (Python)
    try {
      pythonAuthService.logout();
    } catch {}
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
        requestPasswordReset: async (email: string) => { await pythonAuthService.requestPasswordReset(email); },
        resetPassword: async (token: string, password: string) => { await pythonAuthService.resetPassword(token, password); },
        verifyEmail: async (token: string) => { await pythonAuthService.verifyEmail(token); },
        loginWithGoogle: () => { pythonAuthService.loginWithGoogle(); },
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