import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getClientByToken } from '../services/clients.service';
import type { Client } from '../types/feedback';

export interface UseClientTokenResult {
  token: string | null;
  client: Client | null;
  loading: boolean;
  error: boolean;
}

export function useClientToken(): UseClientTokenResult {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('c')?.trim() || null;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setClient(null);
      setLoading(false);
      setError(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    getClientByToken(token)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setClient(res);
          setError(false);
        } else {
          setClient(null);
          setError(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setClient(null);
        setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return { token, client, loading, error };
}
