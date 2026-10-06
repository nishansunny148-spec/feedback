import React, { Component, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Skeleton } from './components/ui/Skeleton';
import { envStatus } from './lib/env';
import { initTheme, useResolvedTheme } from './lib/theme';
import { FeedbackPage } from './pages/FeedbackPage';
import { NotFoundPage } from './pages/NotFoundPage';

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

// Initialise theme store early
initTheme();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('App Root Exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-fg">
          <Card variant="glass" className="p-8 max-w-md w-full flex flex-col gap-4 text-center">
            <h2 className="text-xl font-bold text-fg">Something went wrong</h2>
            <p className="text-xs text-fg-2">
              An unexpected error occurred while running the application.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-raised border border-line/10 rounded-control text-left text-[11px] font-mono text-danger overflow-x-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <Button variant="primary" size="md" onClick={() => window.location.reload()}>
              Reload application
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

const Atmosphere: React.FC = () => {
  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo-glow atmo-glow-a" />
      <div className="atmo-glow atmo-glow-b" />
      <div className="atmo-grain" />
    </div>
  );
};

const EnvMissingScreen: React.FC<{ problems: string[] }> = ({ problems }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-fg">
      <Card variant="glass" className="p-8 max-w-lg w-full flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="eyebrow text-warning">Setup Required</span>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Configuration Missing</h1>
          <p className="text-xs text-fg-2">
            Please check your <code>.env</code> file. The following issues were found:
          </p>
        </div>

        <ul className="flex flex-col gap-2 p-4 bg-raised border border-warning/20 rounded-card text-xs font-mono text-warning">
          {problems.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-fg-3">
          Update <code>.env</code> in your project directory and restart the Vite development server.
        </p>
      </Card>
    </div>
  );
};

export const App: React.FC = () => {
  const theme = useResolvedTheme();

  if (!envStatus.ok) {
    return <EnvMissingScreen problems={envStatus.problems} />;
  }

  return (
    <RootErrorBoundary>
      <Atmosphere />
      <Toaster
        theme={theme}
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--glass-fill))',
            color: 'rgb(var(--fg))',
            border: '1px solid rgb(var(--line) / var(--line-a))',
            borderRadius: '12px',
          },
        }}
      />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center p-8 bg-bg">
              <Skeleton className="h-64 w-full max-w-lg rounded-hero" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<FeedbackPage />} />
            <Route path="/f" element={<FeedbackPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </RootErrorBoundary>
  );
};

export default App;
