import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import YourCommunities from '../components/YourCommunities';
import Feed from '../components/Feed';
import PostDetail from '../components/PostDetail';
import './Homepage.css';

const Homepage = ({user}) => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [selectedCommunityName, setSelectedCommunityName] = useState('');
  const [selectedCommunityDescription, setSelectedCommunityDescription] = useState('');
  const [currentView, setCurrentView] = useState('feed'); // 'feed' or 'postDetail'
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Effect hooks
  useEffect(() => {
    // Initialize component
    const initializeComponent = async () => {
      try {
        // Add initialization logic here
        setLoading(false);
      } catch (error) {
        console.error('Error initializing Homepage:', error);
        setLoading(false);
      }
    };

    initializeComponent();
  }, []);

  // Event handlers
  const handleCommunitySelect = (communityId, communityName, communityDescription) => {
    setSelectedCommunityId(communityId);
    setSelectedCommunityName(communityName);
    setSelectedCommunityDescription(communityDescription || '');
    setCurrentView('feed'); // Reset to feed view when switching communities
  };

  const handlePostSelect = (postId) => {
    setSelectedPostId(postId);
    setCurrentView('postDetail');
  };

  const handleBackToFeed = () => {
    setCurrentView('feed');
    setSelectedPostId(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="homepage-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="homepage">
      <div className="homepage-header">
        <h1>Welcome to Trajecta</h1>
        <p>Connect, share, and engage with your communities</p>
      </div>

      <div className="homepage-content">
        {currentView === 'feed' ? (
          <>
            <div className="communities-sidebar">
              <YourCommunities onCommunitySelect={handleCommunitySelect} user={user} />
            </div>
            <div className="main-feed">
              <Feed 
                user={user}
                communityId={selectedCommunityId} 
                communityName={selectedCommunityName}
                communityDescription={selectedCommunityDescription}
                onPostSelect={handlePostSelect}
              />
            </div>
          </>
        ) : (
          <div className="post-detail-container">
            <PostDetail 
              postId={selectedPostId}
              communityId={selectedCommunityId}
              onBack={handleBackToFeed}
            />
          </div>
        )}
        
        {/* User Matching Button - Fixed position in bottom left */}
        <button
          onClick={() => navigate('/matching')}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '15px 20px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            transform: 'scale(1)'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#0056b3';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#007bff';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
          }}
        >
          🎯 Find Study Buddies
        </button>
      </div>
    </div>
  );
};

export default Homepage;