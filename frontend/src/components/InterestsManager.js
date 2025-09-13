import React, { useState, useEffect } from 'react';
import './InterestsManager.css';

const PREDEFINED_INTERESTS = [
  'Adventure', 'AI/Machine Learning', 'Art', 'Astronomy', 'Baking', 'Basketball', 'Beauty', 'Biology', 'Blockchain', 'Blogging', 'Board Games', 'Business', 'Chemistry', 'Cloud Computing', 'Coffee', 'Cooking', 'Crafts', 'Creative Writing', 'Culture', 'Cybersecurity', 'Data Science', 'Design', 'DevOps', 'Digital Art', 'Drawing', 'Entrepreneurship', 'Fashion', 'Finance', 'Fitness', 'Food', 'Football', 'Gaming', 'Graphic Design', 'Guitar', 'Hiking', 'History', 'Investing', 'Languages', 'Makeup', 'Marketing', 'Meditation', 'Mobile Development', 'Movies', 'Music', 'Music Production', 'Painting', 'Photography', 'Physics', 'Piano', 'Poetry', 'Programming', 'Reading', 'Rock Climbing', 'Running', 'Science', 'Sculpture', 'Singing', 'Skincare', 'Soccer', 'Sports', 'Style', 'Swimming', 'Technology', 'Tennis', 'Travel', 'TV Shows', 'UI/UX', 'Video Games', 'Web Development', 'Wine', 'Writing', 'Yoga'
];

const InterestsManager = ({ userInterests = [], onInterestsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInterests, setFilteredInterests] = useState(PREDEFINED_INTERESTS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInterests(PREDEFINED_INTERESTS.filter(interest => 
        !userInterests.includes(interest)
      ));
    } else {
      setFilteredInterests(
        PREDEFINED_INTERESTS.filter(interest => 
          interest.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !userInterests.includes(interest)
        )
      );
    }
  }, [searchTerm, userInterests]);

  const handleAddInterest = (interest) => {
    if (!userInterests.includes(interest)) {
      onInterestsChange([...userInterests, interest]);
    }
    setSearchTerm('');
    setShowDropdown(false);
    setShowSearchBar(false);
  };

  const handleAddCustomInterest = () => {
    const customInterest = searchTerm.trim();
    if (customInterest && !userInterests.includes(customInterest)) {
      onInterestsChange([...userInterests, customInterest]);
    }
    setSearchTerm('');
    setShowDropdown(false);
    setShowSearchBar(false);
  };

  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
    if (!showSearchBar) {
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    onInterestsChange(userInterests.filter(interest => interest !== interestToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredInterests.length > 0) {
        handleAddInterest(filteredInterests[0]);
      } else if (searchTerm.trim()) {
        handleAddCustomInterest();
      }
    }
  };

  return (
    <div className="interests-manager">
      <div className={`interests-content ${userInterests.length === 0 ? 'no-interests' : ''}`}>
        {userInterests.length > 0 && (
          <div className="user-interests">
            {userInterests.map((interest) => (
              <span key={interest} className="interest-tag">
                {interest}
                <button
                  className="remove-interest"
                  onClick={() => handleRemoveInterest(interest)}
                  aria-label={`Remove ${interest}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <button className="add-interest-btn" onClick={toggleSearchBar}>
          +
        </button>
      </div>

      {showSearchBar && (
        <div className="interests-input-container">
          <input
            type="text"
            placeholder="Search interests or add your own..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyPress={handleKeyPress}
            className="interests-input"
            autoFocus
          />
          
          {showDropdown && (searchTerm || filteredInterests.length > 0) && (
            <div className="interests-dropdown">
              {filteredInterests.map((interest) => (
                <button
                  key={interest}
                  className="interest-option"
                  onClick={() => handleAddInterest(interest)}
                >
                  {interest}
                </button>
              ))}
              {searchTerm.trim() && !PREDEFINED_INTERESTS.includes(searchTerm.trim()) && (
                <button
                  className="interest-option custom-option"
                  onClick={handleAddCustomInterest}
                >
                  + Add "{searchTerm.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterestsManager;
