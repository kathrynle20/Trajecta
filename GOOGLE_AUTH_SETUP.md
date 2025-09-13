# Google OAuth Setup Guide for Trajecta

This guide will walk you through setting up Google OAuth authentication for your Trajecta application.

## Prerequisites

- Node.js and npm installed
- A Google account
- Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (for development)
     - Add your production domain when ready
   - Save and copy the Client ID and Client Secret

## Step 2: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
SESSION_SECRET=your_random_session_secret_here

# Application Configuration
NODE_ENV=development
PORT=3000
```

**Important**: 
- Never commit your `.env` file to version control
- Generate a strong, random session secret (you can use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

## Step 3: Install Dependencies

Dependencies have already been installed, but if you need to reinstall:

```bash
npm install passport passport-google-oauth20 express-session dotenv
```

## Step 4: Start the Application

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the React frontend:
```bash
npm run client
```

Or use the combined command:
```bash
npm run dev
```

## Step 5: Test the Authentication

1. Open your browser and go to `http://localhost:3000`
2. You should see the Trajecta login page
3. Click "Sign in with Google"
4. Complete the Google OAuth flow
5. You should be redirected back to the application and see your dashboard

## File Structure

The Google OAuth implementation includes these files:

```
backend/
├── config/
│   └── passport.js          # Passport Google OAuth strategy
├── routes/
│   └── auth.js             # Authentication routes
└── app.js                  # Updated with session and passport middleware

frontend/
└── src/
    └── components/
        ├── Auth.js         # React authentication component
        └── Auth.css        # Styling for auth component

.env                        # Environment variables (not in git)
```

## Authentication Flow

1. User clicks "Sign in with Google"
2. User is redirected to Google's OAuth consent screen
3. After approval, Google redirects back to `/auth/google/callback`
4. Passport processes the callback and creates a user session
5. User is redirected to the dashboard
6. Frontend checks authentication status via `/auth/current_user`

## API Endpoints

- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/google/callback` - Handles Google OAuth callback
- `GET /auth/logout` - Logs out the user
- `GET /auth/current_user` - Returns current user info (JSON)

## Security Notes

- Sessions are configured with secure cookies in production
- The session secret should be a strong, random string
- HTTPS should be used in production
- Consider implementing CSRF protection for production use

## Troubleshooting

### Common Issues:

1. **"Error: Failed to serialize user into session"**
   - Check that passport.serializeUser is properly configured

2. **"Redirect URI mismatch"**
   - Ensure the callback URL in Google Console matches exactly: `http://localhost:3000/auth/google/callback`

3. **"Cannot read property 'emails' of undefined"**
   - Make sure the Google+ API is enabled in Google Cloud Console

4. **Session not persisting**
   - Check that SESSION_SECRET is set in your .env file
   - Verify express-session middleware is properly configured

### Debug Mode:

Add this to your .env file for more detailed logging:
```env
DEBUG=passport:*
```

## Next Steps

- Implement user data persistence (database)
- Add role-based access control
- Implement protected routes
- Add user profile management
- Set up production deployment with HTTPS

## Production Deployment

When deploying to production:

1. Update authorized redirect URIs in Google Console
2. Set NODE_ENV=production in your environment
3. Use HTTPS for all OAuth redirects
4. Generate new session secrets
5. Consider using a session store (Redis, MongoDB, etc.)
