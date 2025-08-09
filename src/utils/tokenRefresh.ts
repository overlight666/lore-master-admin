import { auth } from '@/lib/firebase';

/**
 * Force refresh the Firebase ID token to get updated custom claims
 */
export const forceTokenRefresh = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No current user for token refresh');
      return null;
    }

    console.log('🔄 Forcing token refresh to get updated custom claims...');
    
    // Force refresh the token (true parameter forces a server refresh)
    const token = await user.getIdToken(true);
    
    console.log('✅ Token refreshed successfully');
    
    // Parse the token to check custom claims (for debugging)
    try {
      const tokenResult = await user.getIdTokenResult(true);
      const customClaims = tokenResult.claims;
      console.log('Updated custom claims:', customClaims);
      
      if (customClaims.admin) {
        console.log('🎉 Admin claim found in refreshed token!');
      } else {
        console.log('⚠️ Admin claim still not found - may need to set custom claims or sign out/in');
      }
    } catch (claimsError) {
      console.error('Error checking custom claims:', claimsError);
    }
    
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Check if user has admin claims in their current token
 */
export const checkAdminClaims = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const tokenResult = await user.getIdTokenResult();
    const customClaims = tokenResult.claims;
    
    console.log('Current token custom claims:', customClaims);
    
    return customClaims.admin === true || customClaims.role === 'admin' || customClaims.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin claims:', error);
    return false;
  }
};

/**
 * Utility to decode JWT token for debugging (client-side only)
 */
export const decodeTokenForDebugging = (token: string) => {
  try {
    if (typeof window === 'undefined') return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload (for debugging):', {
      iss: payload.iss,
      aud: payload.aud,
      email: payload.email,
      admin: payload.admin,
      role: payload.role,
      exp: new Date(payload.exp * 1000).toISOString(),
      iat: new Date(payload.iat * 1000).toISOString()
    });
    
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
