import React, { useState } from 'react';
import './YourCommunities.css';

const YourCommunities = ({ onCommunitySelect }) => {
    // TODO: Change tabs to pull from database of communities
  const [tabs, setTabs] = useState([
    { id: 1, name: 'Personal', isActive: true, memberCount: 1250 },
    { id: 2, name: 'Tech Talk', isActive: false, memberCount: 890 },
    { id: 3, name: 'Study Groups', isActive: false, memberCount: 567 }
  ]);
  
  const [activeTab, setActiveTab] = useState(1);
  const [newTabName, setNewTabName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const selectedTab = tabs.find(tab => tab.id === tabId);
    if (onCommunitySelect && selectedTab) {
      onCommunitySelect(tabId, selectedTab.name);
    }
  };

  const addNewTab = () => {
    if (newTabName.trim()) {
      const newTab = {
        id: Date.now(),
        name: newTabName.trim(),
        isActive: false,
        memberCount: 0
      };
      setTabs([...tabs, newTab]);
      setNewTabName('');
      setShowAddForm(false);
    }
  };

  const getActiveTabContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? currentTab.name : 'Personal';
  };

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

      </div>
    </div>
  );
};

export default YourCommunities;