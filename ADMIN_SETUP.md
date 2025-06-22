# Admin Dashboard Setup - Backend Integration

This document outlines the updates made to integrate the admin dashboard with the HeySolana backend API.

## Changes Made

### 1. Environment Configuration
- Created `src/config/env.ts` for environment-specific API URLs
- Supports both development and production environments
- Development: `http://localhost:8000/api`
- Production: `https://api.yraytestings.com.ng/api`

### 2. API Service Updates (`src/services/api.ts`)
- Updated `UserProfile` interface to match backend structure:
  - `id: number`
  - `name: string` (instead of `username` and `fullName`)
  - `email: string`
  - `email_verified_at?: string`
  - `token?: string`
  - `created_at?: string`
  - `updated_at?: string`

- Implemented two-step authentication flow:
  1. `loginUser()` - Sends email/password, returns verification needed
  2. `verifyAdmin()` - Verifies the email code and completes login

- Added new API endpoints:
  - `/login-admin` - First step authentication
  - `/verify-admin` - Second step verification
  - `/create-admin` - Create new admin users
  - `/fetch-admins` - Get all admin users

### 3. AuthContext Updates (`src/components/AuthContext.tsx`)
- Added `needsVerification` state
- Split login process into two steps:
  - `login()` - Initial authentication
  - `verify()` - Email verification
- Added proper error handling and navigation

### 4. SignIn Component Updates (`src/pages/SignIn.tsx`)
- Redesigned for two-step authentication
- Email/password form for initial login
- Verification code form for second step
- Improved UX with step indicators and back navigation

### 5. UI Component Updates
- Updated `DashboardLayout.tsx` to use new user fields
- Updated `ProfileForm.tsx` to work with backend structure
- Updated `Dashboard.tsx` welcome message
- Removed references to deprecated fields (`username`, `fullName`, `avatar`)

## Backend API Endpoints

The dashboard now integrates with these backend endpoints:

### Authentication
- `POST /api/login-admin` - Login with email/password
- `POST /api/verify-admin` - Verify with email code
- `POST /api/create-admin` - Create new admin (requires auth)
- `POST /api/fetch-admins` - Get all admins (requires auth)

### Waitlist Management
- `GET /api/get_waitlist` - Get all waitlist users
- `POST /api/add_to_waitlist` - Add user to waitlist

## Environment Setup

To set up different environments, the app automatically detects:
- Development: When `import.meta.env.DEV` is true
- Production: When `VITE_NODE_ENV` is set to "production"

You can override the API URL by setting `VITE_API_BASE_URL` in your environment variables.

## Authentication Flow

1. User enters email and password
2. Backend sends verification code to email
3. User enters 6-digit verification code
4. Backend validates and returns JWT token
5. Token is stored and used for authenticated requests

## Notes

- All avatar functionality has been removed (no backend support)
- Profile updates currently only work with localStorage (no backend endpoint)
- The app gracefully handles the transition between authentication states
- Error handling includes user-friendly toast notifications

## Development

To run the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

The build should complete successfully with no TypeScript errors. 