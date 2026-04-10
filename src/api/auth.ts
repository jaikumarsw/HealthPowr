/**
 * Auth API - Clean authentication functions
 */
import { supabase } from "../lib/supabase";
import { getSiteUrlForAuth } from "../lib/siteUrl";
import type { UserRole } from "../types/user";

export type SignUpInput = {
  email: string;
  password: string;
  name?: string;
  role: Exclude<UserRole, "admin">;
  organization?: string;
  borough?: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type Profile = {
  id: string;
  email?: string;
  full_name?: string | null;
  role?: UserRole | null;
  avatar_url?: string | null;
  phone?: string | null;
  borough?: string | null;
};

export const authApi = {
  /**
   * Sign up a new user with Supabase Auth
   */
  async signUp(input: SignUpInput) {
    const siteUrl = getSiteUrlForAuth();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: siteUrl ? `${siteUrl}/` : undefined,
        data: {
          full_name: input.name,
          role: input.role,
          organization: input.organization,
          borough: input.borough,
        },
      },
    });

    if (error) throw error;

    const user = data.user;
    if (!user) {
      throw new Error(
        "Could not complete sign up. Please try again or sign in if you already have an account.",
      );
    }

    // With "Confirm email" enabled, Supabase returns 200 and a fake user for duplicate
    // signups (no new identity). Email confirmation off surfaces "User already registered" on `error` instead.
    const identities = user.identities ?? [];
    if (identities.length === 0) {
      throw new Error(
        "An account with this email already exists. Please sign in instead.",
      );
    }

    return { user, session: data.session };
  },

  /**
   * Sign in with email/password
   */
  async signIn(input: SignInInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Fetch user profile from profiles table
   */
  async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, full_name, avatar_url, phone, borough")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data as Profile | null;
  },

  /**
   * Upsert user profile
   */
  async upsertProfile(profile: Partial<Profile> & { id: string }) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  /**
   * Get user role - checks metadata first, then profile
   */
  async getResolvedRole(
    userId: string,
    metadataRole?: unknown,
  ): Promise<UserRole> {
    // Check metadata first
    if (
      metadataRole === "community_member" ||
      metadataRole === "organization" ||
      metadataRole === "admin"
    ) {
      return metadataRole;
    }

    // Fallback to profile
    const profile = await this.fetchProfile(userId);
    if (
      profile?.role === "community_member" ||
      profile?.role === "organization" ||
      profile?.role === "admin"
    ) {
      return profile.role;
    }

    return "community_member";
  },
};
