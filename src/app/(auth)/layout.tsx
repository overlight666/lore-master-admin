'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, adminUser, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  // Re-enabled smart redirect with improved conditions and better debugging
  useEffect(() => {
    console.log('=== AUTH LAYOUT DEBUG ===');
    console.log('loading:', loading);
    console.log('user:', user ? `${user.email} (${user.uid})` : 'null');
    console.log('adminUser:', adminUser ? `${adminUser.email} (${adminUser.role})` : 'null');
    console.log('isAdmin:', isAdmin);
    console.log('pathname:', pathname);
    console.log('hasRedirected.current:', hasRedirected.current);
    
    // Only redirect if:
    // 1. Not loading
    // 2. User is authenticated AND is admin
    // 3. We're on the login page specifically
    // 4. Haven't redirected yet in this session
    const shouldRedirect = !loading && user && isAdmin && pathname === '/login' && !hasRedirected.current;
    console.log('shouldRedirect:', shouldRedirect);
    
    if (shouldRedirect) {
      console.log('🚀 REDIRECTING: Admin user authenticated on login page, redirecting to dashboard');
      hasRedirected.current = true;
      
      // Try immediate redirect first
      router.push('/dashboard');
      
      // Also try with timeout as backup
      setTimeout(() => {
        console.log('🔄 Timeout redirect to dashboard');
        router.replace('/dashboard');
      }, 1000);
    }
    console.log('=== END AUTH LAYOUT DEBUG ===');
  }, [user, adminUser, isAdmin, loading, router, pathname]);

  // Reset redirect flag when user is logged out
  useEffect(() => {
    if (!user || !isAdmin) {
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

  if (user && isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manual Redirect to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is authenticated but not admin
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833-.23 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have admin privileges to access this application.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Logged in as: {user.email}
          </p>
          <button 
            onClick={() => {
              // Logout and redirect
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Try Different Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
