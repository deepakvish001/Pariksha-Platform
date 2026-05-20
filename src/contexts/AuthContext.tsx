import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ExtendedProfile {
  id: string;
  user_id: string;
  mobile_number: string | null;
  user_type: "student" | "professional" | "other";
  college_name: string | null;
  course_name: string | null;
  branch: string | null;
  study_year: string | null;
  company_name: string | null;
  role: string | null;
  experience: string | null;
  other_description: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  extendedProfile: ExtendedProfile | null;
  loading: boolean;
  onboardingCompleted: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshExtendedProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  };

  const fetchExtendedProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles_extended")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching extended profile:", error);
      return null;
    }
    return data as ExtendedProfile | null;
  };

  const refreshExtendedProfile = async () => {
    if (user) {
      const extendedData = await fetchExtendedProfile(user.id);
      setExtendedProfile(extendedData);
    }
  };

  useEffect(() => {
    // Track the user id we've already loaded profile data for, so token
    // refresh events (which fire frequently) don't re-trigger profile fetches
    // and re-render the entire app. Only an actual sign-in / sign-out / user
    // switch should refetch.
    let loadedUserId: string | null = null;
    let cancelled = false;

    // onAuthStateChange fires INITIAL_SESSION on subscribe with the restored
    // session from storage, so we don't need a separate getSession() call —
    // doing both caused duplicate state updates and double profile fetches
    // on every page load (the "checking multiple times" flicker).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (cancelled) return;

        const nextUser = nextSession?.user ?? null;
        setSession(nextSession);
        setUser(nextUser);

        // Ignore pure token refreshes — user identity hasn't changed, no need
        // to refetch profile or flip loading. Same for USER_UPDATED metadata
        // pings that don't change the user id.
        const sameUser = nextUser?.id && nextUser.id === loadedUserId;

        if (nextUser && !sameUser) {
          loadedUserId = nextUser.id;
          // Defer to next tick so we don't block the auth callback (avoids
          // Supabase deadlocks) and don't run inside React's render phase.
          setTimeout(async () => {
            const [profileData, extendedData] = await Promise.all([
              fetchProfile(nextUser.id),
              fetchExtendedProfile(nextUser.id),
            ]);
            if (cancelled) return;
            setProfile(profileData);
            setExtendedProfile(extendedData);
            setLoading(false);
          }, 0);
        } else if (!nextUser) {
          loadedUserId = null;
          setProfile(null);
          setExtendedProfile(null);
          setLoading(false);
        } else {
          // Same user, token refresh — auth is already ready.
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear all client-side auth/session artifacts so gated pages can't be re-opened
    try {
      sessionStorage.removeItem("skippedOnboarding");
      sessionStorage.removeItem("delayedLoginSkipped");
      localStorage.removeItem("lastVisitedRoute");
      localStorage.removeItem("pendingAuthAction");
    } catch {
      // ignore storage errors
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setExtendedProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (!error) {
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    }

    return { error };
  };

  const onboardingCompleted = extendedProfile?.onboarding_completed ?? false;

  const value = {
    user,
    session,
    profile,
    extendedProfile,
    loading,
    onboardingCompleted,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshExtendedProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
