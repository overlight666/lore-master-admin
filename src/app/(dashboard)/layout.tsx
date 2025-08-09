'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, adminUser, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  
  // Re-enabled dashboard protection with improved conditions
  useEffect(() => {
    console.log('Dashboard layout useEffect - loading:', loading, 'user:', !!user, 'isAdmin:', isAdmin, 'pathname:', pathname);
    
    // Only redirect to login if:
    // 1. Not loading
    // 2. No user authenticated OR user is not admin
    // 3. We're on a dashboard page
    // 4. Haven't redirected yet in this session
    // 5. Not already on login page to prevent loops
    if (!loading && (!user || !isAdmin) && pathname.startsWith('/dashboard') && !hasRedirected.current && !pathname.includes('/login')) {
      hasRedirected.current = true;
      const reason = !user ? 'User not authenticated' : 'User is not admin';
      console.log(`${reason} on dashboard, redirecting to login`);
      
      // Use a longer timeout to ensure auth state is stable
      setTimeout(() => {
        router.replace('/login');
      }, 1000); // Increased timeout for stability
    }
  }, [user, isAdmin, loading, router, pathname]);
  
//   useEffect(() => {
//     if (!loading && !user && !hasRedirected.current && !pathname.includes('/login')) {
//       hasRedirected.current = true;
//       console.log('Redirecting to login from dashboard layout');
      
//       // Add small delay to prevent race conditions
//       setTimeout(() => {
//         router.replace('/login');
//       }, 100);
//     }
//   }, [user, loading, router, pathname]);

  // Reset redirect flag when user is authenticated and is admin
  useEffect(() => {
    if (user && isAdmin) {
      hasRedirected.current = false;
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!user ? 'Redirecting to login...' : 'Verifying admin access...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
