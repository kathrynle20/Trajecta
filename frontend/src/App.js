import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import Profile from './components/profile';
import UserAvatar from './components/UserAvatar';
import Homepage from './pages/Homepage';
import Dashboard from './components/Dashboard';
import './App.css';
import Question from './components/Question';

// Modern Header component with navigation
const AppHeader = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    navigate('/');
  };

  const handleExamClick = () => {
    navigate('/exam');
  };

  return (
    <header className="App-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-container" onClick={handleDashboardClick}>
            <div className="logo-icon">🎓</div>
            <h1 className="logo-text">Trajecta</h1>
            <span className="logo-tagline">AI Learning Paths</span>
          </div>
        </div>
        
        {user && (
          <div className="header-right">
            <nav className="header-nav">
              <button 
                className="nav-button" 
                onClick={handleDashboardClick}
                title="Dashboard"
              >
                <span className="nav-icon">🏠</span>
                <span className="nav-text">Dashboard</span>
              </button>
              <button 
                className="nav-button" 
                onClick={handleExamClick}
                title="Course Finder"
              >
                <span className="nav-icon">🔍</span>
                <span className="nav-text">Find Courses</span>
              </button>
            </nav>
            <div className="header-avatar">
              <UserAvatar 
                user={user} 
                onLogout={onLogout} 
                onProfileClick={handleProfileClick}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user'); // Clear invalid data
      }
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
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/home" element={<Homepage user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/exam" element={<Question />} />
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
