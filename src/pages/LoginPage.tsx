import { motion } from 'framer-motion';
import { Lock, Mail, Volume2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      toast.success('Signed in successfully.');
      navigate('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-safe pb-safe px-safe">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Card variant="glass" className="p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-hero bg-accent text-accent-ink flex items-center justify-center mb-2 shadow-lg shadow-accent/20">
              <Volume2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">Admin Inbox</h1>
            <p className="text-xs text-fg-2">Sign in to manage client voice feedback</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Admin email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              icon={<Lock className="w-4 h-4" />}
            />

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-control text-xs text-danger text-center">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
