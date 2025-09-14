import React, { useState, useEffect } from 'react';
import ExperiencesManager from './ExperiencesManager';
import './profile.css';

const Profile = ({ user }) => {
  const [userExperiences, setUserExperiences] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load experiences from backend on component mount
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await fetch(`http://localhost:3001/profile/experiences/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          console.log("data:", data);
          // Convert from backend format (skill, years) to frontend format (topic, years)
          const formattedExperiences = data.experiences.map(exp => ({
            id: exp.id,
            skill: exp.skill,
            years_of_experience: exp.years_of_experience
          }));
          setUserExperiences(formattedExperiences);
        }
      } catch (error) {
        console.error('Error fetching experiences:', error);
        // Fallback to localStorage if backend fails
        const savedExperiences = localStorage.getItem(`experiences_${user.id}`);
        if (savedExperiences) {
          setUserExperiences(JSON.parse(savedExperiences));
        }
      }
    };

    fetchExperiences();
  }, [user.id]);

  // Handle experiences changes (mark as unsaved)
  const handleExperiencesChange = (newExperiences) => {
    setUserExperiences(newExperiences);
    setHasUnsavedChanges(true);
    // Keep localStorage as backup
    // localStorage.setItem(`experiences_${user.id}`, JSON.stringify(newExperiences));
  };

  // Save experiences to backend
  const handleSaveExperiences = async () => {
    setIsSaving(true);
    try {
      console.log("user experiences:", userExperiences);
      const formattedExperiences = userExperiences.map(exp => ({
        id: user.id,
        skill: exp.skill,
        years_of_experience: exp.years_of_experience
      }));
      console.log("formatted experiences:", formattedExperiences);

      fetch('http://localhost:3001/profile/set-user-experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ experiences: formattedExperiences })
      })
      .then(res => res.json())
      .then(response => {
        console.log('Backend response:', response);
      })
      .catch(error => {
        console.error('Error sending user experience data to backend:', error);
      });

    } catch (error) {
      console.error('Error saving experiences:', error);
      alert('Error saving interests. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">Hi {user.name}!</h1>
        <img src={user.avatar_url} alt={user.name} className="profile-avatar" />
        <p className="profile-email">{user.email}</p>
      </div>
      
      <div className="profile-section">
        <div className="section-header">
          <h2 className="section-title">Interests</h2>
          {hasUnsavedChanges && (
            <button 
              className="save-button"
              onClick={handleSaveExperiences}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
        {userExperiences.length === 0 && (
          <p className="section-content empty-state">No interests added yet</p>
        )}
        <ExperiencesManager 
          userExperiences={userExperiences}
          onExperiencesChange={handleExperiencesChange}
        />
      </div>
      
      <div className="profile-section">
        <h2 className="section-title">Communities</h2>
        <p className="section-content empty-state">No communities joined yet</p>
      </div>
    </div>
  );
};

export default Profile;
