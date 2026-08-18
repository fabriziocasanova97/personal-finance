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

// Cloud rows win on conflict (they were synced); local-only rows survive.
// Never lets an empty cloud wipe local data (H2).
function mergeById<T extends { id: string }>(cloud: T[], local: T[]): T[] {
  const cloudIds = new Set(cloud.map((row) => row.id));
  return [...cloud, ...local.filter((row) => !cloudIds.has(row.id))];
}

function applyCloudData(cloudData: NonNullable<Awaited<ReturnType<typeof dbFetchAll>>>) {
  const store = useStore.getState();
  store.setExpenses(mergeById(cloudData.expenses, store.expenses));
  store.setFixedCosts(mergeById(cloudData.fixedCosts, store.fixedCosts));
  store.setSavings(mergeById(cloudData.savings, store.savings));
  store.setBudgets(mergeById(cloudData.budgets, store.budgets));
  if (Object.keys(cloudData.idealExpenses).length > 0) store.setIdealExpenses(cloudData.idealExpenses);
  if (Object.keys(cloudData.idealSavings).length > 0) store.setIdealSavings(cloudData.idealSavings);
}

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
            applyCloudData(cloudData);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        const cloudData = await dbFetchAll();
        if (cloudData) {
          applyCloudData(cloudData);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear local state only on an explicit sign-out, never on a missing/expired session
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
