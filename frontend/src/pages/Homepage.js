import React, { useState, useEffect } from 'react';
import YourCommunities from '../components/YourCommunities';
import Feed from '../components/Feed';
import './Homepage.css';

const Homepage = ({user}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(1);
  const [selectedCommunityName, setSelectedCommunityName] = useState('Personal');

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
        <div className="communities-sidebar">
          <YourCommunities onCommunitySelect={handleCommunitySelect} />
        </div>
        <div className="main-feed">
          <Feed 
            communityId={selectedCommunityId} 
            communityName={selectedCommunityName} 
          />
        </div>
      </div>
    </div>
  );
};

export default Homepage;