import React, { useState, useEffect, useCallback } from 'react';
import './Auth.css';

const Auth = ({ user, onLogin, onLogout }) => {
  const [loading, setLoading] = useState(true);

  const parseJwt = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  };

  const handleCredentialResponse = useCallback((response) => {
    // Decode the JWT token to get user info
    const userObject = parseJwt(response.credential);
    const userData = {
      id: userObject.sub,
      name: userObject.name,
      email: userObject.email,
      photo: userObject.picture
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    onLogin(userData);
  }, [onLogin]);

  useEffect(() => {
    setLoading(false);

    // Wait for Google Identity Services to load
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        
        if (!clientId || clientId === 'your_google_client_id_here') {
          console.error('Google Client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
          return;
        }

        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: false
          });
          console.log('Google Identity Services initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Identity Services:', error);
        }
      } else {
        // Retry after a short delay if Google hasn't loaded yet
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();
  }, [handleCredentialResponse]);

  // Auto-render Google button when component mounts and Google is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      renderGoogleButton();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === 'your_google_client_id_here') {
      alert('Google Client ID not configured. Please check your .env file.');
      return;
    }

    if (window.google && window.google.accounts) {
      // Use renderButton instead of prompt to avoid CORS issues
      renderGoogleButton();
    } else {
      console.error('Google Identity Services not loaded');
    }
  };

  const renderGoogleButton = () => {
    const buttonDiv = document.getElementById('google-signin-button');
    if (buttonDiv && window.google) {
      // Clear any existing content
      buttonDiv.innerHTML = '';
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular'
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    // Re-render the Google button after logout
    setTimeout(() => {
      renderGoogleButton();
    }, 100);
  };

  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  return (
    <div className="auth-container">
      {user ? (
        <div className="user-info">
          <div className="user-profile">
            <img src={user.photo} alt={user.name} className="user-avatar" />
            <div className="user-details">
              <h3>Welcome, {user.name}!</h3>
              <p>{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <div className="login-section">
          <h2>Sign in to Trajecta</h2>
          {!process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID === 'your_google_client_id_here' ? (
            <div className="config-warning">
              <p>⚠️ Google OAuth not configured</p>
              <p>Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file</p>
            </div>
          ) : (
            <div>
              <div className="login-instructions">
                <p>Click the Google button below to sign in:</p>
              </div>
              <div id="google-signin-button" className="google-button-container"></div>
              <div className="troubleshooting">
                <p><strong>Having trouble?</strong></p>
                <ul>
                  <li>Make sure popups are enabled for this site</li>
                  <li>Try refreshing the page if the button doesn't appear</li>
                  <li>Check that you're using http://localhost:3000</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Auth;
