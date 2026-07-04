'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from 'next-themes';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && !profile && retryCount < 3) {
      // Try to refresh profile if user exists but profile doesn't
      const timer = setTimeout(() => {
        refreshProfile();
        setRetryCount(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, profile, loading, router, refreshProfile, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-500 dark:text-slate-400">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
