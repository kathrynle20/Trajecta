import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="dashboard">
      <h2>Welcome to your Dashboard</h2>
      <p>You are successfully authenticated with Google OAuth!</p>
      <div className="dashboard-content">
        <div className="card">
          <h3>Getting Started</h3>
          <p>Your authentication is working! You can now build your application features.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
