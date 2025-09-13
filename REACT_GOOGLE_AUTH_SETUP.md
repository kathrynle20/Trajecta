# React-Only Google OAuth Setup Guide

This guide shows how to set up Google OAuth authentication in a React-only application using Google Identity Services.

## Prerequisites

- Node.js and npm installed
- A Google account
- Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Identity API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Identity" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Add your production domain when ready
   - Save and copy the Client ID

## Step 2: Configure Environment Variables

1. Open the `frontend/.env` file
2. Replace the placeholder with your actual Google Client ID:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

**Important**: 
- Only put the Client ID in React .env files (never the client secret)
- The `REACT_APP_` prefix is required for React to include the variable

## Step 3: Install Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

## Step 4: Start the Application

From the root directory:

```bash
npm start
```

Or from the frontend directory:

```bash
cd frontend
npm start
```

## Step 5: Test the Authentication

1. Open your browser and go to `http://localhost:3000`
2. You should see the Trajecta login page
3. Click "Sign in with Google"
4. Complete the Google OAuth flow in the popup
5. You should see your dashboard with user information

## How It Works

### Frontend-Only Architecture

- **No Backend Required**: Uses Google Identity Services directly in the browser
- **Local Storage**: User data is stored in browser's localStorage
- **JWT Parsing**: Decodes Google's JWT token to extract user information
- **Session Management**: Handles login/logout state in React

### Authentication Flow

1. User clicks "Sign in with Google"
2. Google Identity Services shows OAuth popup
3. User completes authentication with Google
4. Google returns a JWT token
5. React app decodes the token and extracts user info
6. User data is stored in localStorage and React state
7. Dashboard is displayed with user information

### File Structure

```
frontend/
├── public/
│   └── index.html          # Includes Google Identity Services script
├── src/
│   ├── components/
│   │   ├── Auth.js         # Authentication component
│   │   └── Auth.css        # Auth styling
│   ├── App.js              # Main app with user state
│   └── App.css             # App styling
└── .env                    # Environment variables
```

## Key Features

- **No Server Required**: Pure client-side authentication
- **Persistent Sessions**: User stays logged in across browser sessions
- **Modern UI**: Beautiful gradient design with Google branding
- **Responsive**: Works on desktop and mobile
- **Secure**: Uses Google's secure OAuth 2.0 flow

## Security Notes

- User authentication is handled entirely by Google
- No sensitive credentials are stored in the React app
- JWT tokens are validated by Google's servers
- User data is only stored locally in the browser

## Customization

### Adding More User Data

To access additional user information, modify the `handleCredentialResponse` function in `Auth.js`:

```javascript
const userData = {
  id: userObject.sub,
  name: userObject.name,
  email: userObject.email,
  photo: userObject.picture,
  // Add more fields as needed
  given_name: userObject.given_name,
  family_name: userObject.family_name
};
```

### Styling

Modify `Auth.css` and `App.css` to customize the appearance:
- Change colors in the gradient backgrounds
- Modify button styles
- Adjust card layouts and spacing

## Troubleshooting

### Common Issues

1. **"Invalid client ID"**
   - Check that REACT_APP_GOOGLE_CLIENT_ID is set correctly
   - Verify the client ID in Google Cloud Console

2. **"Popup blocked"**
   - Ensure popups are allowed for localhost:3000
   - Try clicking the login button again

3. **"Origin not allowed"**
   - Add `http://localhost:3000` to authorized JavaScript origins in Google Console

4. **User data not persisting**
   - Check browser's localStorage in Developer Tools
   - Ensure localStorage is not disabled

### Debug Mode

Open browser Developer Tools (F12) to see console logs for debugging authentication flow.

## Production Deployment

When deploying to production:

1. Add your production domain to authorized JavaScript origins in Google Console
2. Update the environment variable with your production domain
3. Build the React app: `npm run build`
4. Deploy the built files to your hosting service

## Next Steps

- Add protected routes based on authentication state
- Implement role-based access control
- Add user profile editing
- Integrate with backend APIs (if needed)
- Add social features or user management
