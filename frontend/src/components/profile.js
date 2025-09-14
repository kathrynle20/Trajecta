import React, { useState, useEffect } from 'react';
import InterestsManager from './InterestsManager';
import ExperiencesManager from './ExperiencesManager';
import './profile.css';

const Profile = ({ user }) => {
  const [userInterests, setUserInterests] = useState([]);
  const [userExperiences, setUserExperiences] = useState([]);

  // Load interests from localStorage on component mount
  useEffect(() => {
    const savedInterests = localStorage.getItem(`interests_${user.id}`);
    if (savedInterests) {
      setUserInterests(JSON.parse(savedInterests));
    }
  }, [user.id]);

  // Load experiences from localStorage on component mount
  useEffect(() => {
    const savedExperiences = localStorage.getItem(`experiences_${user.id}`);
    if (savedExperiences) {
      setUserExperiences(JSON.parse(savedExperiences));
    }
  }, [user.id]);

  // Save interests to localStorage whenever they change
  const handleInterestsChange = (newInterests) => {
    setUserInterests(newInterests);
    localStorage.setItem(`interests_${user.id}`, JSON.stringify(newInterests));
  };

  // Save experiences to localStorage whenever they change
  const handleExperiencesChange = (newExperiences) => {
    setUserExperiences(newExperiences);
    localStorage.setItem(`experiences_${user.id}`, JSON.stringify(newExperiences));
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">Hi {user.name}!</h1>
        <img src={user.photo} alt={user.name} className="profile-avatar" />
        <p className="profile-email">{user.email}</p>
      </div>
      
      <div className="profile-section">
        <h2 className="section-title">Interests</h2>
        {userInterests.length === 0 && (
          <p className="section-content empty-state">No interests added yet</p>
        )}
        <InterestsManager 
          userInterests={userInterests}
          onInterestsChange={handleInterestsChange}
        />
      </div>
      
      <div className="profile-section">
        <h2 className="section-title">Communities</h2>
        <p className="section-content empty-state">No communities joined yet</p>
      </div>

      <div className="profile-section">
        <h2 className="section-title">Experiences</h2>
        {userExperiences.length === 0 && (
          <p className="section-content empty-state">No experiences added yet</p>
        )}
        <ExperiencesManager 
          userExperiences={userExperiences}
          onExperiencesChange={handleExperiencesChange}
        />
      </div>
    </div>
  );
};

export default Profile;
