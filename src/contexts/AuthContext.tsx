import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Clear any existing session on initial load
    supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        checkAdminStatus(session.user.email);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
          checkAdminStatus(session.user.email);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (email: string | undefined) => {
    if (!email) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('email', email)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      // Transform from snake_case to camelCase
      const userProfile: UserProfile = {
        id: data.id,
        username: data.username || "",
        email: data.email || "",
        points: data.points || 0,
        stationsAdded: data.stations_added || 0,
        feedbackGiven: data.feedback_given || 0,
        createdAt: data.created_at || ""
      };

      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // First clear all local data
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      // Clear any stored auth data
      localStorage.clear();
      sessionStorage.clear();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Navigate to home page
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isAdmin,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
