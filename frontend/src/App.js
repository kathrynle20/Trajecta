import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import Profile from './components/profile';
import UserAvatar from './components/UserAvatar';
import Homepage from './pages/Homepage';
import './App.css';

// Header component that needs access to navigate
const AppHeader = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    navigate('/');
  };

  return (
    <header className="App-header">
      <h1 onClick={handleDashboardClick} style={{cursor: 'pointer'}}>Trajecta</h1>
      {user && (
        <div className="header-avatar">
          <UserAvatar 
            user={user} 
            onLogout={onLogout} 
            onProfileClick={handleProfileClick}
          />
        </div>
      )}
    </header>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleUserLogin = (userData) => {
    setUser(userData);
  };

  const handleUserLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Clear any other user-related data from localStorage if needed
    localStorage.clear();
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <h2>Loading Trajecta...</h2>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <AppHeader user={user} onLogin={handleUserLogin} onLogout={handleUserLogout} />
        
        <main className="App-main">
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<Homepage user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<div className="login-container"><Auth user={user} onLogin={handleUserLogin} onLogout={handleUserLogout} /></div>} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
