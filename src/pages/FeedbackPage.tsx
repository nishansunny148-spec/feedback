import React from 'react';
import { FeedbackForm } from '../components/form/FeedbackForm';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useClientToken } from '../hooks/useClientToken';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

export const FeedbackPage: React.FC = () => {
  const { token, client, loading: clientLoading, error: clientError } = useClientToken();
  const recorder = useVoiceRecorder();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 pt-safe pb-safe px-safe">
      <div className="w-full max-w-form my-auto flex flex-col gap-6">
        <header className="flex justify-center pt-2">
          <BrandLogo className="w-[100px] sm:w-[100px]" />
        </header>

        {clientLoading ? (
          <Card variant="glass" className="p-8 flex flex-col gap-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-48 w-full rounded-hero" />
            <Skeleton className="h-32 w-full" />
          </Card>
        ) : (
          <>
            {clientError && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-control text-xs text-warning text-center">
                The feedback link format wasn't recognized, but you can still submit feedback using the form below.
              </div>
            )}
            <FeedbackForm clientToken={token} client={client} recorder={recorder} />
          </>
        )}
      </div>

      {/* Clean client-side footer */}
      <footer className="mt-8 text-center text-xs text-fg-3">
        <span>Powered by Voice Feedback</span>
      </footer>
    </div>
  );
};
