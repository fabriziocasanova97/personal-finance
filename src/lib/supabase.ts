import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'finclear-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Executes a Supabase query with retry mechanisms.
 * - 3 attempts
 * - 8-second timeouts
 */
export async function withRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3,
  timeoutMs = 8000
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Though JS Supabase doesn't natively accept abort signals directly on all query builders easily, 
      // we wrap the promise in a timeout race.
      const queryPromise = queryFn();
      
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase request timeout')), timeoutMs);
      });

      const result = await Promise.race([queryPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      if (result.error) {
        throw result.error;
      }

      return result;
    } catch (error) {
      console.warn(`Supabase query attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        // Show user-friendly error logic here (e.g. via toast) if needed
        return { data: null, error };
      }
      // Wait before retrying (exponential backoff or simple delay)
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }
  return { data: null, error: new Error('Unexpected retry failure') };
}
