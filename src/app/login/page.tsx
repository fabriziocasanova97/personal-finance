'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        alert('Check your email for the confirmation link!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] flex items-center justify-center px-1">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-sm border border-gray-100">
        <h1 className="text-3xl font-heading font-bold text-accent mb-2 text-center">
          FinClear
        </h1>
        <p className="text-center text-gray-500 mb-8 font-mono text-sm">
          {isSignUp ? 'Create an account to start syncing' : 'Log in to access your finances'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono text-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 px-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono text-base"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-mono text-center bg-red-50 py-2 rounded-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-accent text-white rounded-sm active:scale-[0.98] font-medium hover:bg-opacity-90 transition-all font-mono tracking-wider shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm font-mono text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-accent hover:underline font-medium"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
