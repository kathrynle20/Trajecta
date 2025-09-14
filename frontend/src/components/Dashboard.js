import React, { useState, useEffect } from 'react';
import PeopleGraph from './PeopleGraph';

const Dashboard = ({ user }) => {
  const [peopleData, setPeopleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPeopleGraph = async () => {
    if (!user?.id) {
      setError("User ID not available");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/exam/people-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentUserId: user.id // Google ID
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setPeopleData(data.output || data);
    } catch (err) {
      setError(`Failed to fetch people data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (selectedUser) => {
    console.log('User clicked:', selectedUser);
    // You can add more functionality here, like navigation to user profile
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      margin: '1rem auto',
      maxWidth: 1400,
      padding: '0 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        color: '#1a1a1a'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: 'center'
        }}>Welcome to your Dashboard</h2>
        
        <p style={{ 
          textAlign: 'center', 
          fontSize: '1.1rem', 
          color: '#6b7280', 
          marginBottom: '2rem' 
        }}>
          Discover and connect with like-minded learners in your community!
        </p>

        <div className="dashboard-content">
          {/* People Graph Section */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#1e40af',
                margin: 0
              }}>Community Network</h3>
              
              <button
                onClick={fetchPeopleGraph}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                {loading ? 'Loading...' : 'Show People Network'}
              </button>
            </div>

            {error && (
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                borderRadius: '12px',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                fontWeight: '600',
                marginBottom: '20px'
              }}>
                ⚠️ Error: {error}
              </div>
            )}

            {peopleData && !error && (
              <div>
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                      {peopleData.total_users || 0}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Users</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                      {peopleData.edges?.length || 0}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Connections</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                      {peopleData.top_5_closest?.length || 0}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Similar Users</div>
                  </div>
                </div>

                <PeopleGraph
                  vertices={peopleData.vertices}
                  edges={peopleData.edges}
                  currentUserId={peopleData.current_user_id}
                  top5Closest={peopleData.top_5_closest}
                  onUserClick={handleUserClick}
                />
              </div>
            )}

            {!peopleData && !loading && !error && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
                <h4 style={{ color: '#374151', marginBottom: '8px' }}>Discover Your Learning Community</h4>
                <p>Click "Show People Network" to see other learners and find people with similar interests!</p>
              </div>
            )}
          </div>

          {/* Getting Started Section */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#166534',
              margin: '0 0 16px 0'
            }}>Getting Started</h3>
            <p style={{ color: '#374151', lineHeight: '1.6', margin: 0 }}>
              Your authentication is working! Explore the people network to connect with other learners, 
              or visit the Course Finder to discover personalized learning paths based on your interests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
