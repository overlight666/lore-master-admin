// Test script to verify admin role checking functionality
// This file demonstrates how the admin verification works

import { verifyAdminRole, isUserAdmin } from '@/utils/adminVerification';

export const testAdminVerification = async () => {
  console.log('Testing admin verification...');
  
  try {
    const adminUser = await verifyAdminRole();
    const isAdmin = await isUserAdmin();
    
    console.log('Admin verification result:', {
      adminUser,
      isAdmin,
      userEmail: adminUser?.email,
      userRole: adminUser?.role
    });
    
    return { adminUser, isAdmin };
  } catch (error) {
    console.error('Admin verification test failed:', error);
    return null;
  }
};

// Example usage in a component:
/*
import { testAdminVerification } from '@/utils/testAdminVerification';

const MyComponent = () => {
  useEffect(() => {
    testAdminVerification();
  }, []);
  
  return <div>Check console for admin verification test results</div>;
};
*/
