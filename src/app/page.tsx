'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, loading, adminUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && adminUser) {
        router.replace('/dashboard');
      } else if (user && !adminUser) {
        router.replace('/login?error=insufficient_permissions');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, adminUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
