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
    let revision = 0;
    const verifySession = () => {
      const request = ++revision;
      setSession(null);
      setLoading(true);
      // Run outside Supabase's auth callback lock.
      void Promise.resolve().then(getSession).then((verified) => {
        if (isMounted && request === revision) {
          setSession(verified);
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted && request === revision) {
          setSession(null);
          setLoading(false);
        }
      });
    };

    const unsubscribe = onAuthChange((newSession) => {
      if (isMounted) {
        if (newSession) {
          verifySession();
        } else {
          revision++;
          setSession(null);
          setLoading(false);
        }
      }
    });
    verifySession();

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
