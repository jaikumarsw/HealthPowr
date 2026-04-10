import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User, UserRole } from "../types/user";
import { supabase } from "../lib/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { authApi } from "../api/auth";
import { organizationsApi } from "../lib/organzationsApi";

type Profile = {
  id: string;
  email?: string;
  full_name?: string | null;
  role?: UserRole | null;
  avatar_url?: string | null;
  phone?: string | null;
  borough?: string | null;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  signIn: (params: {
    email: string;
    password: string;
    expectedRole?: UserRole;
  }) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    name?: string;
    role: Exclude<UserRole, "admin">;
    organization?: string;
    borough?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isSubmitting: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingExpectedRoleRef = useRef<UserRole | null>(null);
  const didBootstrapOrgForUserRef = useRef<string | null>(null);
  const maybeBootstrapOrganization = async (input: {
    userId: string;
    email: string;
    role: UserRole;
    organizationName?: string;
    borough?: string;
  }) => {
    if (input.role !== "organization") return;
    if (!input.organizationName?.trim()) return;

    // Ensure we only attempt once per app session for a given user.
    if (didBootstrapOrgForUserRef.current === input.userId) return;
    didBootstrapOrgForUserRef.current = input.userId;

    try {
      await organizationsApi.setupOrganizationForUser({
        ownerId: input.userId,
        name: input.organizationName,
        borough: input.borough ?? "Manhattan",
        email: input.email,
      });
    } catch {
      // Non-blocking
    }
  };

  const applyResolvedIdentity = (mapped: User, profileData: Profile | null) => {
    const nextUser: User = {
      ...mapped,
      role: (profileData?.role as UserRole) ?? mapped.role,
      name: profileData?.full_name ?? mapped.name,
      avatar: profileData?.avatar_url ?? mapped.avatar,
    };

    setProfile((prev) => {
      if (
        prev?.id === profileData?.id &&
        prev?.role === profileData?.role &&
        prev?.full_name === profileData?.full_name &&
        prev?.avatar_url === profileData?.avatar_url &&
        prev?.phone === profileData?.phone &&
        prev?.borough === profileData?.borough
      ) {
        return prev;
      }
      return profileData;
    });

    setUser((prev) => {
      if (
        prev?.id === nextUser.id &&
        prev?.email === nextUser.email &&
        prev?.name === nextUser.name &&
        prev?.role === nextUser.role &&
        prev?.organization === nextUser.organization &&
        prev?.avatar === nextUser.avatar
      ) {
        return prev;
      }
      return nextUser;
    });
  };

  const mapSupabaseUserToAppUser = useMemo(() => {
    return (supabaseUser: SupabaseUser): User => {
      const metadata = (supabaseUser.user_metadata ?? {}) as Record<
        string,
        unknown
      >;
      const roleFromMeta = metadata.role;
      const role: UserRole =
        roleFromMeta === "community_member" ||
        roleFromMeta === "organization" ||
        roleFromMeta === "admin"
          ? roleFromMeta
          : "community_member";

      const email = supabaseUser.email ?? "";
      const nameFromMeta =
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
            : undefined;
      const nameFromEmail = email ? email.split("@")[0] : "User";
      const name = nameFromMeta ?? nameFromEmail;
      const organization =
        typeof metadata.organization === "string"
          ? metadata.organization
          : undefined;
      const avatar =
        typeof metadata.avatar === "string" ? metadata.avatar : undefined;

      return {
        id: supabaseUser.id,
        email,
        name,
        role,
        organization,
        avatar,
      };
    };
  }, []);

  const fetchProfile = async (id: string): Promise<Profile | null> => {
    // Use the clean authApi
    return authApi.fetchProfile(id);
  };

  const getResolvedRole = async (
    supabaseUser: SupabaseUser,
  ): Promise<UserRole> => {
    const metadata = (supabaseUser.user_metadata ?? {}) as Record<
      string,
      unknown
    >;
    // Use authApi for clean role resolution
    return authApi.getResolvedRole(supabaseUser.id, metadata.role);
  };

  // Helper: wrap a promise with a timeout so long-running requests don't block UI
  const withTimeout = async <T,>(
    p: Promise<T>,
    ms = 3000,
  ): Promise<T | null> => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const result = await Promise.race([
        p,
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), ms);
        }),
      ]);
      return result as T | null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(data.session ?? null);

        const supaUser = data.session?.user ?? null;
        if (!supaUser) {
          setUser(null);
          setProfile(null);
          return;
        }

        const mapped = mapSupabaseUserToAppUser(supaUser);
        const profileData = await withTimeout(fetchProfile(supaUser.id), 3000);
        if (!isMounted) return;
        // No org bootstrap on login.
        applyResolvedIdentity(mapped, profileData);

        // Fallback: if user signed up with email verification and no session existed at signup,
        // create the organization on first successful login.
        const resolvedRole = (profileData?.role as UserRole) ?? mapped.role;
        await maybeBootstrapOrganization({
          userId: supaUser.id,
          email: mapped.email,
          role: resolvedRole,
          organizationName: mapped.organization,
          borough: profileData?.borough ?? undefined,
        });
      } catch {
        // Avoid logging session/bootstrap details in the client
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        try {
          if (!isMounted) return;
          setSession(nextSession ?? null);

          // Token refreshes should not re-hydrate user/profile; doing so re-triggers page data effects.
          if (event === "TOKEN_REFRESHED") return;

          const supaUser = nextSession?.user ?? null;
          if (event === "SIGNED_OUT" || !supaUser) {
            setUser(null);
            setProfile(null);
            didBootstrapOrgForUserRef.current = null;
            return;
          }

          if (supaUser) {
            // Role middleware: reject wrong-portal sign-in before triggering heavy app bootstrap.
            const expectedRole = pendingExpectedRoleRef.current;
            if (expectedRole) {
              const actualRole = await getResolvedRole(supaUser);
              const isAllowed =
                expectedRole === "organization"
                  ? actualRole === "organization" || actualRole === "admin"
                  : actualRole === expectedRole;
              if (!isAllowed) {
                pendingExpectedRoleRef.current = null;
                await supabase.auth.signOut();
                return;
              }
              pendingExpectedRoleRef.current = null;
            }

            const mapped = mapSupabaseUserToAppUser(supaUser);
            const profileData = await withTimeout(
              fetchProfile(supaUser.id),
              3000,
            );
            if (!isMounted) return;
            // No org bootstrap on login.
            applyResolvedIdentity(mapped, profileData);

            const resolvedRole = (profileData?.role as UserRole) ?? mapped.role;
            await maybeBootstrapOrganization({
              userId: supaUser.id,
              email: mapped.email,
              role: resolvedRole,
              organizationName: mapped.organization,
              borough: profileData?.borough ?? undefined,
            });
          }
        } catch {
          // Avoid logging auth handler details in the client
        } finally {
          if (isMounted) setIsLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [mapSupabaseUserToAppUser]);

  const signIn: AuthContextType["signIn"] = async ({
    email,
    password,
    expectedRole,
  }) => {
    setIsSubmitting(true);
    try {
      pendingExpectedRoleRef.current = expectedRole ?? null;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (expectedRole) {
        const signedInUser = data.user;
        if (!signedInUser) throw new Error("Sign in failed. Please try again.");
        const actualRole = await getResolvedRole(signedInUser);
        const isAllowed =
          expectedRole === "organization"
            ? actualRole === "organization" || actualRole === "admin"
            : actualRole === expectedRole;
        if (!isAllowed) {
          await supabase.auth.signOut();
          pendingExpectedRoleRef.current = null;
          throw new Error(
            expectedRole === "community_member"
              ? "This account is a Provider account. Please switch to Provider Portal to sign in."
              : expectedRole === "organization"
                ? "This account is a Client account. Please switch to Client Portal to sign in."
                : "This account is not an Admin account.",
          );
        }
      }
      // Keep pendingExpectedRoleRef set until auth listener runs so it can block user hydration.
      if (!expectedRole) {
        pendingExpectedRoleRef.current = null;
      }
    } catch (err) {
      pendingExpectedRoleRef.current = null;
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp: AuthContextType["signUp"] = async ({
    email,
    password,
    name,
    role,
    organization,
    borough,
  }) => {
    setIsSubmitting(true);
    try {
      // 1. Create auth user using clean API
      const { user: supaUser, session: newSession } = await authApi.signUp({
        email,
        password,
        name,
        role,
        organization,
        borough,
      });

      // 2. Check if we have an active session (email confirmation might be required)
      const hasActiveSession = !!newSession;

      if (!hasActiveSession) {
        return;
      }

      // 3. If organization role, create the organization now
      if (role === "organization" && organization) {
        try {
          await organizationsApi.setupOrganizationForUser({
            ownerId: supaUser.id,
            name: organization,
            borough: borough || "Manhattan",
            email: email,
          });
        } catch {
          // Non-blocking — do not log signup/org details in the client
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut: AuthContextType["signOut"] = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      // Clear local auth state immediately so UI updates without waiting for auth listener
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        signIn,
        signUp,
        signOut,
        isLoading,
        isSubmitting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
