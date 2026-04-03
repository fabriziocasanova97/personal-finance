'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import { dbFetchAll } from '@/lib/db';
import { useStore } from '@/lib/store';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          const cloudData = await dbFetchAll();
          if (cloudData) {
            useStore.getState().setExpenses(cloudData.expenses);
            useStore.getState().setFixedCosts(cloudData.fixedCosts);
            useStore.getState().setSavings(cloudData.savings);
            useStore.getState().setBudgets(cloudData.budgets);
            useStore.getState().setIdealExpenses(cloudData.idealExpenses);
            useStore.getState().setIdealSavings(cloudData.idealSavings);
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        const cloudData = await dbFetchAll();
        if (cloudData) {
          useStore.getState().setExpenses(cloudData.expenses);
          useStore.getState().setFixedCosts(cloudData.fixedCosts);
          useStore.getState().setSavings(cloudData.savings);
          useStore.getState().setBudgets(cloudData.budgets);
          useStore.getState().setIdealExpenses(cloudData.idealExpenses);
          useStore.getState().setIdealSavings(cloudData.idealSavings);
        }
      } else {
        // Clear local state heavily if logged out
        useStore.getState().setExpenses([]);
        useStore.getState().setFixedCosts([]);
        useStore.getState().setSavings([]);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Redirect logic: if not loading, not logged in, and not on /login
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {/* If loading and not on login page, we can show a spinner. Alternatively, let it render to avoid jumping, but prevent dashboard access */}
      {loading && pathname !== '/login' ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
