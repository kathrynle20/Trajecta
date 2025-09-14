import React, { useState, useEffect } from 'react';
import ExperiencesManager from './ExperiencesManager';
import './profile.css';

const Profile = ({ user }) => {
  const [userExperiences, setUserExperiences] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', or null

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
          // Keep consistent format: skill and years_of_experience
          const formattedExperiences = data.experiences.map(exp => ({
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
<<<<<<< HEAD
    setSaveStatus(null);
=======
>>>>>>> 3d973a0 (adding experiences)
    try {
      console.log("user experiences:", userExperiences);
      const formattedExperiences = userExperiences.map(exp => ({
        id: user.id,
<<<<<<< HEAD
        skill: exp.skill,
        years_of_experience: exp.years_of_experience
      }));
      console.log("formatted experiences:", formattedExperiences);

      const response = await fetch('http://localhost:3001/profile/set-user-experiences', {
=======
        skill: exp.topic,
        years_of_experience: exp.years
      }));
      console.log("formatted experiences:", formattedExperiences);

      fetch('http://localhost:3001/profile/set-user-experiences', {
>>>>>>> 3d973a0 (adding experiences)
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ experiences: formattedExperiences })
<<<<<<< HEAD
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Backend response:', result);
        setHasUnsavedChanges(false);
        setSaveStatus('success');
        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error(result.message || 'Failed to save changes');
      }

    } catch (error) {
      console.error('Error saving experiences:', error);
      setSaveStatus('error');
      // Clear error message after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000);
=======
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
>>>>>>> 3d973a0 (adding experiences)
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">Hi {user.name}!</h1>
        <img src={user.photo} alt={user.name} className="profile-avatar" />
        <p className="profile-email">{user.email}</p>
      </div>
      
      <div className="profile-section">
        <div className="section-header">
          <h2 className="section-title">Interests</h2>
<<<<<<< HEAD
=======
          {hasUnsavedChanges && (
            <button 
              className="save-button"
              onClick={handleSaveExperiences}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
>>>>>>> 3d973a0 (adding experiences)
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
<<<<<<< HEAD
      
      {/* Save Button at Bottom */}
      <div className="profile-actions">
        <button 
          className={`save-button-bottom ${hasUnsavedChanges ? 'highlighted' : 'unhighlighted'}`}
          onClick={handleSaveExperiences}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved'}
        </button>
        
        {/* Status Message */}
        {saveStatus && (
          <div className={`status-message ${saveStatus}`}>
            {saveStatus === 'success' ? (
              <span>✓ Changes saved successfully!</span>
            ) : (
              <span>✗ Error saving changes. Please try again.</span>
            )}
          </div>
        )}
      </div>
=======
>>>>>>> 3d973a0 (adding experiences)
    </div>
  );
};

export default Profile;
