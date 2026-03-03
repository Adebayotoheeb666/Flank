import { useState, useEffect } from "react";
import { supabase } from "@shared/supabase";

interface User {
  id: string;
  email?: string;
  fullName?: string;
  role?: "student" | "staff" | "visitor";
}

/**
 * Hook to get current authenticated user
 * Falls back to localStorage-based user ID if Supabase Auth is not configured
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if Supabase is properly configured
        if (!supabase) {
          // Fallback: use localStorage for demo
          const demoUserId =
            localStorage.getItem("userId") ||
            "student_" + Math.random().toString(36).substr(2, 9);
          localStorage.setItem("userId", demoUserId);
          setUser({ id: demoUserId });
          setLoading(false);
          return;
        }

        // Get current session from Supabase Auth
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn("Auth error:", error);
          // Fallback to localStorage
          const demoUserId =
            localStorage.getItem("userId") ||
            "student_" + Math.random().toString(36).substr(2, 9);
          localStorage.setItem("userId", demoUserId);
          setUser({ id: demoUserId });
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name,
          });
        } else {
          // No session, use fallback
          const demoUserId =
            localStorage.getItem("userId") ||
            "student_" + Math.random().toString(36).substr(2, 9);
          localStorage.setItem("userId", demoUserId);
          setUser({ id: demoUserId });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Fallback
        const demoUserId =
          localStorage.getItem("userId") || "student_demo_user";
        localStorage.setItem("userId", demoUserId);
        setUser({ id: demoUserId });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem("userId");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}

/**
 * Simple utility to get user ID for API calls
 * Used throughout the app for identifying the current user
 */
export function useUserId(): string {
  const { user } = useAuth();
  return user?.id || localStorage.getItem("userId") || "student_demo_user";
}
