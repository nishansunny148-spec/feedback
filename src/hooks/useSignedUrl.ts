import { useCallback, useEffect, useState } from 'react';
import { getSignedAudioUrl } from '../services/storage.service';

export interface UseSignedUrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSignedUrl(path: string | null, enabled: boolean = true): UseSignedUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl = useCallback(async () => {
    if (!path || !enabled) {
      setUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 10 minutes expiry (600 seconds)
      const signed = await getSignedAudioUrl(path, 600);
      setUrl(signed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not generate playback URL';
      setError(msg);
      setUrl(null);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    void fetchUrl();
  }, [fetchUrl]);

  return {
    url,
    loading,
    error,
    refresh: fetchUrl,
  };
}
