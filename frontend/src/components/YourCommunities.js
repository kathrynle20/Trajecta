import React, { useState, useEffect } from 'react';
import './YourCommunities.css';

const YourCommunities = ({ onCommunitySelect, user }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(1);
  const [newTabName, setNewTabName] = useState('');
  const [newTabDescription, setNewTabDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Async function to fetch communities data
  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
    
      // Fallback to mock data if API fails or for development
      const communitiesData = [
        { id: 1, name: 'Personal', description: 'Your personal space for thoughts and updates', isActive: true, memberCount: 1 },
        { id: 2, name: 'Tech Talk', description: 'Discussions about technology, programming, and innovation', isActive: false, memberCount: 890 },
        { id: 3, name: 'Study Groups', description: 'Collaborative learning and academic support', isActive: false, memberCount: 567 }
      ];
      
      setTabs(communitiesData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching communities:', err);
      
      // Use mock data as fallback
      const mockData = [
        { id: 1, name: 'Personal', description: 'Your personal space for thoughts and updates', isActive: true, memberCount: 1 },
        { id: 2, name: 'Tech Talk', description: 'Discussions about technology, programming, and innovation', isActive: false, memberCount: 890 },
        { id: 3, name: 'Study Groups', description: 'Collaborative learning and academic support', isActive: false, memberCount: 567 }
      ];
      
      setTabs(mockData);
      setLoading(false);
    }
  };

  // Load communities on component mount
  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const selectedTab = tabs.find(tab => tab.id === tabId);
    if (onCommunitySelect && selectedTab) {
      onCommunitySelect(tabId, selectedTab.name, selectedTab.description);
    }
  };

  const addNewTab = async () => {
    if (newTabName.trim() && newTabDescription.trim()) {
      try {
        // TODO: Replace with actual API call to create new community
        const newTab = {
          id: Date.now(),
          name: newTabName.trim(),
          description: newTabDescription.trim(),
          isActive: false,
          memberCount: 1 // User joins as first member
        };
        
        setTabs([...tabs, newTab]);
        setNewTabName('');
        setNewTabDescription('');
        setShowAddForm(false);
      } catch (err) {
        setError('Failed to create community');
      }
    }
  };

  const getActiveTabContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? currentTab.name : 'Personal';
  };

  // Loading state
  if (loading) {
    return (
      <div className="your-communities">
        <div className="communities-header">
          <h2>Your Communities</h2>
        </div>
        <div className="communities-loading">
          <p>Loading communities...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="your-communities">
        <div className="communities-header">
          <h2>Your Communities</h2>
        </div>
        <div className="communities-error">
          <p>{error}</p>
          <button onClick={fetchCommunities} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="your-communities">
      <div className="communities-header">
        <h2>Your Communities</h2>
      </div>

      <div className="tabs-container">
        <div className="tabs-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <div className="tab-content">
                <span className="tab-name">{tab.name}</span>
                <span className="member-count">{tab.memberCount} members</span>
              </div>
            </div>
          ))}
        </div>

        <div className="create-community-section">
          <button 
            className="create-community-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Create Community
          </button>

          {showAddForm && (
            <div className="create-community-form">
              <input
                type="text"
                placeholder="Community name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                className="community-name-input"
              />
              <textarea
                placeholder="Community description"
                value={newTabDescription}
                onChange={(e) => setNewTabDescription(e.target.value)}
                rows={3}
                className="community-description-input"
              />
              <div className="form-actions">
                <button 
                  onClick={addNewTab} 
                  className="create-btn"
                  disabled={!newTabName.trim() || !newTabDescription.trim()}
                >
                  Create
                </button>
                <button 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTabName('');
                    setNewTabDescription('');
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YourCommunities;