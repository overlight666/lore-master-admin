import { auth } from '@/lib/firebase';
import { forceTokenRefresh, checkAdminClaims, decodeTokenForDebugging } from '@/utils/tokenRefresh';

/**
 * Debug the current authentication state and token
 */
export const debugAuthState = async () => {
  console.log('🔍 === DEBUGGING AUTH STATE ===');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No current user authenticated');
      return {
        authenticated: false,
        hasAdminClaims: false,
        error: 'No user authenticated'
      };
    }
    
    console.log('✅ User authenticated:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous
    });
    
    // Get current token and decode it
    console.log('🔑 Getting current token...');
    const token = await user.getIdToken(false); // Don't force refresh yet
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 100) + '...');
    
    // Decode token for debugging
    const decodedToken = decodeTokenForDebugging(token);
    
    // Check token result for custom claims
    console.log('🎫 Getting token result with custom claims...');
    const tokenResult = await user.getIdTokenResult(false);
    console.log('Token issued at:', new Date(tokenResult.issuedAtTime));
    console.log('Token expires at:', new Date(tokenResult.expirationTime));
    console.log('Custom claims:', tokenResult.claims);
    
    // Check if admin claims exist
    const hasAdminClaims = tokenResult.claims.admin === true || 
                          tokenResult.claims.role === 'admin' || 
                          tokenResult.claims.role === 'super_admin';
    
    console.log('Admin claims status:', hasAdminClaims);
    
    if (!hasAdminClaims) {
      console.log('⚠️ No admin claims found in current token');
      console.log('Available claims:', Object.keys(tokenResult.claims));
      
      // Try refreshing token
      console.log('🔄 Attempting token refresh...');
      const refreshedToken = await user.getIdToken(true); // Force refresh
      const refreshedTokenResult = await user.getIdTokenResult(true);
      
      console.log('Refreshed token custom claims:', refreshedTokenResult.claims);
      
      const hasAdminClaimsAfterRefresh = refreshedTokenResult.claims.admin === true || 
                                        refreshedTokenResult.claims.role === 'admin' || 
                                        refreshedTokenResult.claims.role === 'super_admin';
      
      console.log('Admin claims after refresh:', hasAdminClaimsAfterRefresh);
      
      return {
        authenticated: true,
        hasAdminClaims: hasAdminClaimsAfterRefresh,
        needsSetup: !hasAdminClaimsAfterRefresh,
        tokenRefreshed: true,
        claims: refreshedTokenResult.claims
      };
    }
    
    return {
      authenticated: true,
      hasAdminClaims: true,
      claims: tokenResult.claims
    };
    
  } catch (error) {
    console.error('❌ Debug auth state error:', error);
    return {
      authenticated: false,
      hasAdminClaims: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  console.log('🔍 === END AUTH DEBUG ===');
};

/**
 * Test API call with detailed logging
 */
export const testApiCall = async (endpoint: string = '/admin/dashboard/stats') => {
  console.log('🧪 === TESTING API CALL ===');
  console.log('Endpoint:', endpoint);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user authenticated');
    }
    
    // Get fresh token
    const token = await user.getIdToken(true);
    console.log('Using fresh token for API call');
    
    // Make manual fetch request to see raw response
    const apiUrl = `${process.env.NEXT_PUBLIC_ADMIN_API_URL}${endpoint}`;
    console.log('Full API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error JSON:', errorJson);
      } catch (e) {
        console.log('Error response is not JSON');
      }
      
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API call successful:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
  
  console.log('🧪 === END API TEST ===');
};
