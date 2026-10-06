import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getSession, onAuthChange, signIn, signOut } from '../services/auth.service';

export interface UseAuthResult {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: typeof signIn;
  signOut: typeof signOut;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then((s) => {
        if (isMounted) {
          setSession(s);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
      });

    const unsubscribe = onAuthChange((newSession) => {
      if (isMounted) {
        setSession(newSession);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signOut,
  };
}
