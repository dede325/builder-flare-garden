/**
 * Advanced Authentication Service
 * Handles authentication, authorization, roles, and permissions
 */

import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  employee_number?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  emergency_contact?: string;
  department?: string;
  hire_date?: string;
  license_number?: string;
  certifications: string[];
  preferences: Record<string, any>;
  last_login?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UserWithProfile extends User {
  profile?: UserProfile;
  roles?: Role[];
  permissions?: string[];
}

export interface AuthState {
  user: UserWithProfile | null;
  loading: boolean;
  initialized: boolean;
}

class AuthService {
  private authState: AuthState = {
    user: null,
    loading: true,
    initialized: false,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    // Set initial demo state immediately if Supabase is not configured
    if (!supabase) {
      this.setDemoState();
    } else {
      this.initialize();
    }
  }

  /**
   * Initialize auth service
   */
  private async initialize() {
    try {
      // Check if we have real Supabase connection
      if (!supabase) {
        this.setDemoState();
        return;
      }

      // Get current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        this.setAuthState({ user: null, loading: false, initialized: true });
        return;
      }

      if (session?.user) {
        const userWithProfile = await this.enrichUserWithProfile(session.user);
        this.setAuthState({
          user: userWithProfile,
          loading: false,
          initialized: true,
        });
      } else {
        this.setAuthState({ user: null, loading: false, initialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userWithProfile = await this.enrichUserWithProfile(
            session.user,
          );
          this.setAuthState({
            user: userWithProfile,
            loading: false,
            initialized: true,
          });

          // Log login activity
          await this.logActivity("user_login", "auth", session.user.id);
        } else {
          this.setAuthState({ user: null, loading: false, initialized: true });
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      this.setDemoState();
    }
  }

  /**
   * Set demo state when Supabase is not available
   */
  private setDemoState() {
    const demoUser: UserWithProfile = {
      id: "demo-user",
      email: "demo@aviation.com",
      user_metadata: {
        full_name: "João Silva (Demo)",
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      profile: {
        id: "demo-user",
        display_name: "João Silva (Demo)",
        department: "Operações",
        is_active: true,
        certifications: [],
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      roles: [
        {
          id: "demo-role",
          name: "manager",
          display_name: "Gestor",
          level: 70,
          is_system_role: false,
        },
      ],
      permissions: [
        "read_aircraft",
        "update_aircraft",
        "create_aircraft",
        "read_employees",
        "update_employees",
        "create_employees",
        "read_tasks",
        "create_tasks",
        "update_tasks",
        "assign_tasks",
        "read_cleaning_forms",
        "create_cleaning_forms",
        "update_cleaning_forms",
      ],
    };

    this.setAuthState({ user: demoUser, loading: false, initialized: true });
  }

  /**
   * Enrich user with profile, roles, and permissions
   */
  private async enrichUserWithProfile(user: User): Promise<UserWithProfile> {
    try {
      const [profileResult, rolesResult, permissionsResult] = await Promise.all(
        [
          supabase.from("user_profiles").select("*").eq("id", user.id).single(),
          supabase.rpc("get_user_roles", { user_uuid: user.id }),
          supabase.rpc("get_user_permissions", { user_uuid: user.id }),
        ],
      );

      const enrichedUser: UserWithProfile = {
        ...user,
        profile: profileResult.data,
        roles: rolesResult.data || [],
        permissions:
          permissionsResult.data?.map((p: any) => p.permission_name) || [],
      };

      return enrichedUser;
    } catch (error) {
      console.error("Error enriching user:", error);
      return user;
    }
  }

  /**
   * Set auth state and notify listeners
   */
  private setAuthState(newState: AuthState) {
    this.authState = newState;
    this.listeners.forEach((listener) => listener(newState));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return this.authState;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    if (!supabase) {
      // Demo mode - simulate successful login
      this.setDemoState();
      return {
        data: { user: this.authState.user, session: null },
        error: null,
      };
    }

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.data.user) {
      await this.logActivity("user_login", "auth", result.data.user.id);
    }

    return result;
  }

  /**
   * Sign up new user
   */
  async signUp(
    email: string,
    password: string,
    userData?: {
      first_name?: string;
      last_name?: string;
      display_name?: string;
      department?: string;
      phone?: string;
    },
  ) {
    if (!supabase) {
      return { data: { user: null, session: null }, error: null };
    }

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (result.data.user) {
      await this.logActivity("user_signup", "auth", result.data.user.id);
    }

    return result;
  }

  /**
   * Sign out
   */
  async signOut() {
    if (!supabase) {
      this.setAuthState({ user: null, loading: false, initialized: true });
      return { error: null };
    }

    if (this.authState.user) {
      await this.logActivity("user_logout", "auth", this.authState.user.id);
    }

    return await supabase.auth.signOut();
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>) {
    if (!supabase || !this.authState.user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const result = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", this.authState.user.id)
      .select()
      .single();

    if (result.data) {
      // Refresh user data
      const updatedUser = await this.enrichUserWithProfile(this.authState.user);
      this.setAuthState({ ...this.authState, user: updatedUser });

      await this.logActivity(
        "profile_updated",
        "user_profiles",
        this.authState.user.id,
      );
    }

    return result;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.authState.user;
    if (!user) return false;

    // Demo mode - allow common permissions
    if (!supabase) {
      const commonPermissions = [
        "read_aircraft",
        "read_employees",
        "read_tasks",
        "read_cleaning_forms",
        "create_tasks",
        "update_tasks",
        "create_cleaning_forms",
        "update_cleaning_forms",
      ];
      return commonPermissions.includes(permission);
    }

    return user.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(roleName: string): boolean {
    const user = this.authState.user;
    if (!user) return false;

    return user.roles?.some((role) => role.name === roleName) || false;
  }

  /**
   * Check if user has minimum role level
   */
  hasMinimumRoleLevel(minLevel: number): boolean {
    const user = this.authState.user;
    if (!user) return false;

    const maxLevel = Math.max(
      ...(user.roles?.map((role) => role.level) || [0]),
    );
    return maxLevel >= minLevel;
  }

  /**
   * Get user's highest role level
   */
  getUserLevel(): number {
    const user = this.authState.user;
    if (!user) return 0;

    return Math.max(...(user.roles?.map((role) => role.level) || [0]));
  }

  /**
   * Log user activity
   */
  async logActivity(
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>,
  ) {
    if (!supabase || !this.authState.user) return;

    try {
      await supabase.rpc("log_user_activity", {
        user_uuid: this.authState.user.id,
        action_name: action,
        resource_type: resourceType,
        resource_uuid: resourceId,
        details: details,
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  /**
   * Get all roles
   */
  async getRoles() {
    if (!supabase) {
      return { data: [], error: null };
    }

    return await supabase
      .from("roles")
      .select("*")
      .order("level", { ascending: false });
  }

  /**
   * Get all permissions
   */
  async getPermissions() {
    if (!supabase) {
      return { data: [], error: null };
    }

    return await supabase
      .from("permissions")
      .select("*")
      .order("resource", { ascending: true });
  }

  /**
   * Assign role to user (admin only)
   */
  async assignRole(userId: string, roleName: string) {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    if (!this.hasPermission("manage_user_roles")) {
      return { data: null, error: new Error("Insufficient permissions") };
    }

    try {
      const { data, error } = await supabase.rpc("assign_user_role", {
        target_user_id: userId,
        role_name: roleName,
        assigned_by_user_id: this.authState.user?.id,
      });

      if (!error) {
        await this.logActivity("role_assigned", "user_roles", userId, {
          role: roleName,
        });
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Remove role from user (admin only)
   */
  async removeRole(userId: string, roleName: string) {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    if (!this.hasPermission("manage_user_roles")) {
      return { data: null, error: new Error("Insufficient permissions") };
    }

    try {
      const { data, error } = await supabase.rpc("remove_user_role", {
        target_user_id: userId,
        role_name: roleName,
      });

      if (!error) {
        await this.logActivity("role_removed", "user_roles", userId, {
          role: roleName,
        });
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get all users (admin only)
   */
  async getUsers() {
    if (!supabase) {
      return { data: [], error: null };
    }

    if (!this.hasPermission("read_users")) {
      return { data: [], error: new Error("Insufficient permissions") };
    }

    return await supabase
      .from("user_management_view")
      .select("*")
      .order("display_name", { ascending: true });
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    if (!this.hasPermission("update_users")) {
      return { data: null, error: new Error("Insufficient permissions") };
    }

    const result = await supabase
      .from("user_profiles")
      .update({ is_active: isActive })
      .eq("id", userId);

    if (!result.error) {
      await this.logActivity(
        isActive ? "user_activated" : "user_deactivated",
        "user_profiles",
        userId,
      );
    }

    return result;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export types
// Types are already exported above
