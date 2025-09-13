import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import './App.css';

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
    <div className="App">
      <header className="App-header">
        <h1>Trajecta</h1>
        <Auth user={user} onLogin={handleUserLogin} onLogout={handleUserLogout} />
      </header>
      
      {user && (
        <main className="App-main">
          <div className="dashboard">
            <h2>Welcome to your Dashboard</h2>
            <p>You are successfully authenticated with Google OAuth!</p>
            <div className="dashboard-content">
              <div className="card">
                <h3>Your Profile</h3>
                <p>Name: {user.name}</p>
                <p>Email: {user.email}</p>
              </div>
              <div className="card">
                <h3>Getting Started</h3>
                <p>Your authentication is working! You can now build your application features.</p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
