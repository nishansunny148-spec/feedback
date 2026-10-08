import { Inbox, LogOut, Moon, Sun } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useResolvedTheme, setThemePreference } from '../../lib/theme';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';

export interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const theme = useResolvedTheme();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setThemePreference(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-fg">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-line/10 bg-raised/40 p-4 gap-6 shrink-0">
        <div className="flex items-center px-2 py-2">
          <BrandLogo className="w-[120px]" />
        </div>

        <nav className="flex flex-col gap-1">
          <button
            type="button"
            className="flex items-center gap-3 px-3 py-2.5 rounded-control bg-accent/15 text-accent-fg font-medium text-sm"
          >
            <Inbox className="w-4 h-4" />
            <span>Inbox</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-line/10">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-fg-3 truncate max-w-[140px]" title={user?.email}>
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full text-fg-3 hover:text-fg"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            icon={<LogOut className="w-4 h-4 text-danger" />}
            className="justify-start text-danger hover:bg-danger/10"
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Topbar - Mobile */}
      <header className="flex md:hidden items-center justify-between p-4 border-b border-line/10 bg-raised/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center">
          <BrandLogo className="w-[96px]" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full text-fg-3 hover:text-fg"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-8 h-8 rounded-full text-danger hover:bg-danger/10"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-8 max-w-admin mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
