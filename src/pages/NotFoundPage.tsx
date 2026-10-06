import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="glass" className="p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
        <span className="font-mono text-4xl font-bold text-accent-fg">404</span>
        <h1 className="text-xl font-bold text-fg">Page not found</h1>
        <p className="text-xs text-fg-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/')} className="mt-2">
          Go to Home
        </Button>
      </Card>
    </div>
  );
};
