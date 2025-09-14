import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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

      // Get communities for user
      fetchCommunitiesForUser();
    
      setLoading(false);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setLoading(false);
    }
  };

  const fetchCommunitiesForUser = () => {
    try {
        fetch('http://localhost:3001/feed-api/find-communities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user: user })
          })
          .then(res => res.json())
          .then(response => {
            if(response.success) {
                const communitiesData = response.communities;
                setTabs(communitiesData);
            }
          })
          .catch(error => {
            console.error('Error sending user data to backend:', error);
          });
    } catch (error) {
        console.error('Error fetching communities for user:', error);
    }
  }

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
        const newTab = {
            id: uuidv4(),
            name: newTabName.trim(),
            description: newTabDescription.trim(),
          };

        fetch('http://localhost:3001/feed-api/create-community', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user: user, forum: newTab })
          })
          .then(res => res.json())
          .then(response => {
          })
          .catch(error => {
            console.error('Error sending user data to backend:', error);
          });
        
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
                <span className="member-count">{tab.num_members} members</span>
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