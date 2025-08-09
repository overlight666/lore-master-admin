import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export const verifyAdminRole = async (): Promise<AdminUser | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user');
      return null;
    }

    // Get fresh token to check custom claims
    const tokenResult = await user.getIdTokenResult();
    const customClaims = tokenResult.claims;
    
    console.log('Custom claims check:', customClaims);
    
    // Check custom claims first (faster and more reliable)
    if (customClaims.admin === true || customClaims.role === 'admin' || customClaims.role === 'super_admin') {
      console.log('Admin access granted via custom claims');
      return {
        uid: user.uid,
        email: user.email || '',
        role: (customClaims.role as 'admin' | 'super_admin') || 'admin'
      };
    }

    // Fallback to Firestore check (for users without custom claims yet)
    console.log('Custom claims not found, checking Firestore...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.log('User document not found in Firestore');
      return null;
    }

    const userData = userDoc.data();
    
    // Check if user has admin role
    if (!userData?.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      console.log('User does not have admin role:', userData?.role);
      return null;
    }

    console.log('Admin role verified via Firestore (consider refreshing token for custom claims)');
    return {
      uid: user.uid,
      email: user.email || '',
      role: userData.role
    };
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return null;
  }
};

export const isUserAdmin = async (): Promise<boolean> => {
  const adminUser = await verifyAdminRole();
  return adminUser !== null;
};
