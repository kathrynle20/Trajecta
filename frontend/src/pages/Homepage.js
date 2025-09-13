import React, { useState, useEffect } from 'react';
import YourCommunities from '../components/YourCommunities';
import Feed from '../components/Feed';
import PostDetail from '../components/PostDetail';
import './Homepage.css';

const Homepage = ({user}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(1);
  const [selectedCommunityName, setSelectedCommunityName] = useState('Personal');
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
  const handleCommunitySelect = (communityId, communityName) => {
    setSelectedCommunityId(communityId);
    setSelectedCommunityName(communityName);
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
              <YourCommunities onCommunitySelect={handleCommunitySelect} />
            </div>
            <div className="main-feed">
              <Feed 
                communityId={selectedCommunityId} 
                communityName={selectedCommunityName}
                onPostSelect={handlePostSelect}
              />
            </div>
          </>
        ) : (
          <div className="post-detail-container">
            <PostDetail 
              postId={selectedPostId}
              onBack={handleBackToFeed}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;