# Vercel Deployment Guide for Lore Master Admin

## Fixed Issues in vercel.json

### 1. **Simplified Configuration**
- Removed unnecessary `buildCommand`, `outputDirectory`, `installCommand`, and `devCommand` (Vercel auto-detects these for Next.js)
- Removed environment variable definitions from vercel.json (should be set in Vercel dashboard)
- Fixed function path to match the actual API route location

### 2. **Proper API Route Configuration**
- Configured the proxy API route (`src/pages/api/[...slug].ts`) with 30-second timeout
- Added proper CORS headers for API routes

### 3. **Security Headers**
- Added security headers for better protection
- Removed overly restrictive CSP that might block necessary resources

### 4. **Route Handling**
- Added redirect from root to `/dashboard`
- Proper handling of the proxy API functionality

## Environment Variables Setup

You need to set these environment variables in your Vercel dashboard:

### API Configuration
```
NEXT_PUBLIC_ADMIN_API_URL = https://api-pjqcolhhra-uc.a.run.app
NEXT_PUBLIC_API_URL = https://api-pjqcolhhra-uc.a.run.app
```

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY = your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID = your_app_id
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your lore-master-admin project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above with the appropriate values
5. Make sure to set them for **Production**, **Preview**, and **Development** environments

## Deployment Commands

```bash
# Build and test locally first
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod

# Or push to GitHub and let Vercel auto-deploy
git add .
git commit -m "Fix vercel.json configuration"
git push origin main
```

## Key Features of the Fixed Configuration

### 1. **API Proxy Functionality**
- The `/api/[...slug]` route acts as a proxy to your Firebase Functions API
- Handles CORS automatically
- 30-second timeout for longer operations

### 2. **Security**
- Prevents clickjacking with X-Frame-Options
- Prevents MIME type sniffing
- Sets referrer policy for better privacy

### 3. **User Experience**
- Automatic redirect from root to dashboard
- Proper Next.js framework detection

### 4. **Performance**
- Optimized for Vercel's edge network
- No unnecessary configuration overhead

## Troubleshooting

### If deployment fails:
1. Check that all environment variables are set correctly
2. Verify the Firebase configuration values
3. Ensure the API URL is accessible
4. Check Vercel function logs for any errors

### If API calls fail:
1. Verify the `NEXT_PUBLIC_ADMIN_API_URL` points to your correct Firebase Functions URL
2. Check that CORS is properly configured in your Firebase Functions
3. Verify authentication is working correctly

### If authentication fails:
1. Double-check all Firebase configuration variables
2. Ensure the Firebase project settings match your environment variables
3. Verify that the Firebase Auth domain is correct

## Next Steps

1. **Set Environment Variables**: Add all required environment variables in Vercel dashboard
2. **Deploy**: Push to GitHub or use Vercel CLI to deploy
3. **Test**: Verify all functionality works in production
4. **Monitor**: Check Vercel function logs for any issues

The configuration is now optimized for Vercel deployment and should work smoothly with your Next.js admin panel!
