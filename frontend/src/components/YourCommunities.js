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
      console.log("Fetching communities for user:", user);
      
      // Check if user has required properties
      if (!user || !user.id) {
        console.error('User object is missing or has no ID:', user);
        setError('User information is missing');
        setLoading(false);
        return;
      }
      
      await fetchCommunitiesForUser();
    
      setLoading(false);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to fetch communities');
      setLoading(false);
    }
  };

  const fetchCommunitiesForUser = async () => {
    try {
      console.log("Fetching communities for user in frontend:", user);
      console.log("User ID being sent:", user?.id);
      
      const response = await fetch('http://localhost:3001/feed-api/find-communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user: user })
      });
      
      const data = await response.json();
      console.log("Communities response:", data);
      
      if (data.success && data.communities) {
        console.log("Communities found:", data.communities);
        const communitiesData = Array.isArray(data.communities) ? data.communities : [];
        setTabs(communitiesData);
        return communitiesData;
      } else {
        console.log("No communities found or error:", data.message);
        setTabs([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching communities for user:', error);
      setError('Network error while fetching communities');
      throw error;
    }
  };

  // Load communities on component mount
  useEffect(() => {
    if (user && user.id) {
      fetchCommunities();
    } else {
      console.log('User not ready yet, skipping community fetch:', user);
    }
  }, [user]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const selectedTab = Array.isArray(tabs) ? tabs.find(tab => tab.id === tabId) : null;
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
        
        setTabs(prevTabs => [...(Array.isArray(prevTabs) ? prevTabs : []), newTab]);
        setNewTabName('');
        setNewTabDescription('');
        setShowAddForm(false);
      } catch (err) {
        setError('Failed to create community');
      }
    }
  };

  const getActiveTabContent = () => {
    const currentTab = Array.isArray(tabs) ? tabs.find(tab => tab.id === activeTab) : null;
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

  // // Error state
  // if (error) {
  //   return (
  //     <div className="your-communities">
  //       <div className="communities-header">
  //         <h2>Your Communities</h2>
  //       </div>
  //       <div className="communities-error">
  //         <p>{error}</p>
  //         <button onClick={fetchCommunities} className="retry-btn">
  //           Retry
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="your-communities">
      <div className="communities-header">
        <h2>Your Communities</h2>
      </div>

      <div className="tabs-container">
        <div className="tabs-list">
          {Array.isArray(tabs) && tabs.map(tab => (
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
          {(!Array.isArray(tabs) || tabs.length === 0) && (
            <div className="no-communities">
              <p>No communities found. Create your first community!</p>
            </div>
          )}
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