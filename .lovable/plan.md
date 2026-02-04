

# Login & Signup Implementation Plan

## Overview
This plan adds complete authentication to UniDash with Email/Password and Google Sign-In, user profiles, and a protected dashboard for logged-in users.

---

## What You'll Get

### New Pages
- **Login Page** (`/login`) - Beautiful form with email/password and Google sign-in button
- **Signup Page** (`/signup`) - Registration form with name, email, password, and Google option
- **Dashboard** (`/dashboard`) - Protected page showing user profile and quick stats
- **Auth Callback** (`/auth/callback`) - Handles OAuth redirects from Google

### Updated Components
- **Navbar** - Shows "Login" button when logged out, user avatar + "Dashboard" when logged in
- **Hero section** - "Get Started" buttons will link to signup page

---

## Technical Architecture

### Database Structure (Supabase)

```text
+------------------+       +------------------+
|   auth.users     |       |     profiles     |
|------------------|       |------------------|
| id (uuid)        |<------| id (uuid) [FK]   |
| email            |       | full_name        |
| ...              |       | avatar_url       |
|                  |       | created_at       |
|                  |       | updated_at       |
+------------------+       +------------------+
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Login form with Email/Password + Google |
| `src/pages/Signup.tsx` | Registration form |
| `src/pages/Dashboard.tsx` | Protected user dashboard |
| `src/pages/AuthCallback.tsx` | OAuth callback handler |
| `src/contexts/AuthContext.tsx` | Global auth state management |
| `src/components/ProtectedRoute.tsx` | Route guard for authenticated pages |
| `src/integrations/supabase/client.ts` | Supabase client configuration |
| `src/integrations/supabase/types.ts` | TypeScript types for database |

### Files to Update

| File | Changes |
|------|---------|
| `src/App.tsx` | Add AuthProvider, new routes |
| `src/components/Navbar.tsx` | Show login/user state, add logout |
| `src/components/Hero.tsx` | Link CTA buttons to signup |
| `src/components/CTA.tsx` | Link buttons to signup |

---

## Implementation Steps

### Phase 1: Supabase Setup
1. Enable Supabase Cloud integration (you'll be prompted to connect)
2. Create `profiles` table with RLS policies
3. Create trigger to auto-create profile on signup

### Phase 2: Auth Infrastructure
1. Create Supabase client integration
2. Build AuthContext with session management
3. Create ProtectedRoute component

### Phase 3: Auth Pages
1. Build Login page with:
   - Email/password form with validation
   - Google sign-in button
   - "Forgot password" link
   - Link to signup page
   
2. Build Signup page with:
   - Full name, email, password fields
   - Google sign-in option
   - Terms acceptance checkbox
   - Link to login page

3. Create AuthCallback page for OAuth redirects

### Phase 4: Dashboard
1. Create user dashboard with:
   - Welcome message with user's name
   - Profile card with avatar
   - Quick stats (placeholder for future features)
   - Edit profile section
   - Logout button

### Phase 5: Integration
1. Update Navbar with auth-aware navigation
2. Update Hero and CTA buttons to link to signup
3. Add route protection to dashboard

---

## Security Measures
- Row Level Security (RLS) on profiles table
- Users can only read/update their own profile
- Secure password handling via Supabase Auth
- OAuth state validation for Google sign-in

---

## Design Consistency
All new pages will use:
- Existing orange gradient color scheme
- Same card styles (`card-dark`, `card-feature`)
- Consistent button styles (`btn-primary`)
- Framer Motion animations
- Dark/light mode support
- Mobile-responsive layouts

---

## Google Sign-In Setup Required
After implementation, you'll need to:
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add your Supabase callback URL
4. Configure the provider in Supabase dashboard

I'll provide detailed instructions during implementation.

