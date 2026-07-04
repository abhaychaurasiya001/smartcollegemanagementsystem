'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
