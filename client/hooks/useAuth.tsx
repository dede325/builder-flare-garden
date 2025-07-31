import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authService, AuthState, UserWithProfile } from "@/lib/auth-service";

interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    userData?: any,
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ data: any; error: any }>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasMinimumRoleLevel: (minLevel: number) => boolean;
  getUserLevel: () => number;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    // Get initial state from auth service
    const initialState = authService.getState();
    setAuthState(initialState);

    // Subscribe to auth service changes
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    return await authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    return await authService.signUp(email, password, userData);
  };

  const signOut = async () => {
    return await authService.signOut();
  };

  const updateProfile = async (updates: any) => {
    return await authService.updateProfile(updates);
  };

  const hasPermission = (permission: string) => {
    return authService.hasPermission(permission);
  };

  const hasRole = (roleName: string) => {
    return authService.hasRole(roleName);
  };

  const hasMinimumRoleLevel = (minLevel: number) => {
    return authService.hasMinimumRoleLevel(minLevel);
  };

  const getUserLevel = () => {
    return authService.getUserLevel();
  };

  const refreshUser = () => {
    // Force refresh by re-initializing auth state
    authService.getState();
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasPermission,
    hasRole,
    hasMinimumRoleLevel,
    getUserLevel,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth called outside AuthProvider. Context:", context);
    console.error("AuthContext:", AuthContext);
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export types for convenience
export type { UserWithProfile } from "@/lib/auth-service";
