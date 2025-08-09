'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { verifyAdminRole, AdminUser } from '@/utils/adminVerification';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      
      if (user) {
        // Verify admin role before setting admin user
        console.log('🔐 Verifying admin role for user:', user.email);
        try {
          const adminUserData = await verifyAdminRole();
          if (adminUserData) {
            console.log('✅ Admin role verified:', adminUserData.role);
            setAdminUser(adminUserData);
            
            // Only redirect to dashboard if user is admin and on login page
            if (window.location.pathname === '/login') {
              console.log('� Admin user on login page, redirecting to dashboard...');
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1000);
            }
          } else {
            console.log('❌ User is not admin, redirecting to login');
            setAdminUser(null);
            // If user is not admin, redirect to login and show error
            if (window.location.pathname !== '/login') {
              toast.error('Access denied. Admin privileges required.');
              setTimeout(() => {
                window.location.href = '/login';
              }, 1500);
            }
          }
        } catch (error) {
          console.error('Error verifying admin role:', error);
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
        // Only redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Starting login process for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.email);
      setUser(result.user);
      
      // Verify admin role after successful login
      const adminUserData = await verifyAdminRole();
      if (adminUserData) {
        setAdminUser(adminUserData);
        toast.success('Successfully logged in as admin!');
      } else {
        // User is not admin, sign them out
        await signOut(auth);
        setUser(null);
        setAdminUser(null);
        toast.error('Access denied. Admin privileges required.');
        throw new Error('Access denied. Admin privileges required.');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAdminUser(null);
      toast.success('Successfully logged out!');
      router.push('/login');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const value = {
    user,
    adminUser,
    login,
    logout,
    loading,
    isAdmin: adminUser !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
