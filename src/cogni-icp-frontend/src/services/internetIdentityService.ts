/**
 * Internet Identity Authentication Service
 * Handles authentication with Internet Identity and integration with our Rust canister
 */

import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

export interface InternetIdentityUser {
  identity: Identity;
  principal: Principal;
  principalText: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: InternetIdentityUser | null;
  isLoading: boolean;
}

class InternetIdentityService {
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private principal: Principal | null = null;

  // Internet Identity canister ID (mainnet)
  private readonly II_CANISTER_ID = process.env.REACT_APP_II_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai';
  
  // Local development II URL
  private readonly II_URL = process.env.REACT_APP_II_URL || `https://${this.II_CANISTER_ID}.ic0.app`;

  /**
   * Initialize the auth client
   */
  async init(): Promise<void> {
    try {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: false,
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          disableDefaultIdleCallback: false,
        },
      });

      // Check if user is already authenticated
      const isAuthenticated = await this.authClient.isAuthenticated();
      if (isAuthenticated) {
        this.identity = this.authClient.getIdentity();
        this.principal = this.identity.getPrincipal();
      }
    } catch (error) {
      console.error('Failed to initialize Internet Identity auth client:', error);
      throw error;
    }
  }

  /**
   * Login with Internet Identity
   */
  async login(): Promise<InternetIdentityUser> {
    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.authClient!.login({
        identityProvider: this.II_URL,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        windowOpenerFeatures: 'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
        onSuccess: () => {
          try {
            this.identity = this.authClient!.getIdentity();
            this.principal = this.identity.getPrincipal();
            
            const user: InternetIdentityUser = {
              identity: this.identity,
              principal: this.principal,
              principalText: this.principal.toString(),
            };
            
            resolve(user);
          } catch (error) {
            reject(error);
          }
        },
        onError: (error) => {
          reject(new Error(`Internet Identity login failed: ${error}`));
        },
      });
    });
  }

  /**
   * Logout from Internet Identity
   */
  async logout(): Promise<void> {
    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    await this.authClient.logout();
    this.identity = null;
    this.principal = null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.authClient) {
      return false;
    }
    return await this.authClient.isAuthenticated();
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<InternetIdentityUser | null> {
    if (!this.authClient) {
      return null;
    }

    const isAuth = await this.authClient.isAuthenticated();
    if (!isAuth) {
      return null;
    }

    if (!this.identity || !this.principal) {
      this.identity = this.authClient.getIdentity();
      this.principal = this.identity.getPrincipal();
    }

    return {
      identity: this.identity,
      principal: this.principal,
      principalText: this.principal.toString(),
    };
  }

  /**
   * Get the current principal as string
   */
  async getPrincipalText(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.principalText || null;
  }

  /**
   * Get the current identity for canister calls
   */
  getCurrentIdentity(): Identity | null {
    return this.identity;
  }

  /**
   * Create an authenticated agent for canister calls
   */
  async createAgent() {
    if (!this.identity) {
      throw new Error('Not authenticated with Internet Identity');
    }

    const { Actor, HttpAgent } = await import('@dfinity/agent');
    
    const agent = new HttpAgent({
      identity: this.identity,
      host: process.env.REACT_APP_IC_HOST || 'https://ic0.app',
    });

    // Only fetch root key in development
    if (process.env.NODE_ENV === 'development') {
      await agent.fetchRootKey();
    }

    return agent;
  }

  /**
   * Create an actor for our backend canister
   */
  async createBackendActor() {
    const agent = await this.createAgent();
    const canisterId = process.env.REACT_APP_BACKEND_CANISTER_ID;
    
    if (!canisterId) {
      throw new Error('Backend canister ID not configured');
    }

    const { Actor } = await import('@dfinity/agent');
    
    // Import the candid interface (we'll need to generate this)
    // For now, we'll use a basic interface
    const idlFactory = ({ IDL }: any) => {
      const Achievement = IDL.Record({
        'id': IDL.Nat64,
        'user_principal': IDL.Principal,
        'achievement_type': IDL.Text,
        'achievement_id': IDL.Text,
        'metadata_hash': IDL.Text,
        'issued_at': IDL.Nat64,
        'badge_code': IDL.Opt(IDL.Text),
      });

      const TaskCompletion = IDL.Record({
        'id': IDL.Nat64,
        'user_principal': IDL.Principal,
        'task_id': IDL.Text,
        'proof_hash': IDL.Text,
        'completed_at': IDL.Nat64,
        'completion_count': IDL.Nat32,
      });

      const Result = IDL.Variant({ 'Ok': IDL.Nat64, 'Err': IDL.Text });
      const Result_1 = IDL.Variant({ 'Ok': IDL.Null, 'Err': IDL.Text });

      return IDL.Service({
        'get_user_achievements': IDL.Func([IDL.Principal], [IDL.Vec(Achievement)], ['query']),
        'get_user_task_completions': IDL.Func([IDL.Principal], [IDL.Vec(TaskCompletion)], ['query']),
        'get_achievement_stats': IDL.Func([], [IDL.Nat64, IDL.Nat64], ['query']),
        'get_task_completion_stats': IDL.Func([], [IDL.Nat64, IDL.Nat64], ['query']),
      });
    };

    return Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });
  }

  /**
   * Register or login user with our Python backend using II principal
   */
  async authenticateWithBackend(): Promise<{ 
    success: boolean; 
    access_token?: string; 
    refresh_token?: string; 
    user?: any; 
    error?: string;
  }> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated with Internet Identity');
    }

    try {
      // Call our Python backend to register/login with II principal
      const response = await fetch('/api/auth/internet-identity/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          principal: user.principalText,
          // We could add a signed message here for additional security
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Backend authentication failed'
        };
      }

      return data;
    } catch (error) {
      console.error('Backend authentication error:', error);
      return {
        success: false,
        error: 'Network error during authentication'
      };
    }
  }

  /**
   * Create a session in the ICP canister
   */
  async createCanisterSession(): Promise<{
    success: boolean;
    session?: any;
    error?: string;
  }> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated with Internet Identity');
    }

    try {
      const response = await fetch('/api/auth/internet-identity/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          principal: user.principalText,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create canister session'
        };
      }

      return data;
    } catch (error) {
      console.error('Canister session creation error:', error);
      return {
        success: false,
        error: 'Network error during session creation'
      };
    }
  }

  /**
   * Complete Internet Identity login flow
   * This combines II authentication, backend authentication, and canister session creation
   */
  async completeLogin(): Promise<{
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    user?: any;
    canister_session?: any;
    error?: string;
  }> {
    try {
      // Step 1: Login with Internet Identity
      const iiUser = await this.login();
      console.log('Internet Identity login successful:', iiUser.principalText);

      // Step 2: Authenticate with Python backend
      const backendAuth = await this.authenticateWithBackend();
      if (!backendAuth.success) {
        return {
          success: false,
          error: backendAuth.error || 'Backend authentication failed'
        };
      }

      // Step 3: Create canister session (optional, for direct canister calls)
      let canisterSession = null;
      try {
        const sessionResult = await this.createCanisterSession();
        if (sessionResult.success) {
          canisterSession = sessionResult.session;
        }
      } catch (error) {
        console.warn('Failed to create canister session, but continuing:', error);
      }

      return {
        success: true,
        access_token: backendAuth.access_token,
        refresh_token: backendAuth.refresh_token,
        user: backendAuth.user,
        canister_session: canisterSession
      };

    } catch (error) {
      console.error('Complete login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }
}

// Create singleton instance
export const internetIdentityService = new InternetIdentityService();
export default internetIdentityService;
