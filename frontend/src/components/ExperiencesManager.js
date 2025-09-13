import React, { useState, useEffect } from 'react';
import './ExperiencesManager.css';

const PREDEFINED_TOPICS = [
  'AI/Machine Learning', 'Android Development', 'Angular', 'API Development', 'AWS', 'Backend Development', 'Blockchain', 'Business Analysis', 'C++', 'Cloud Computing', 'Content Marketing', 'CSS', 'Cybersecurity', 'Data Analysis', 'Data Science', 'Database Management', 'DevOps', 'Digital Marketing', 'Docker', 'E-commerce', 'Frontend Development', 'Full Stack Development', 'Game Development', 'Git', 'Graphic Design', 'HTML', 'iOS Development', 'Java', 'JavaScript', 'Kubernetes', 'Leadership', 'Linux', 'Machine Learning', 'Mobile Development', 'MongoDB', 'MySQL', 'Node.js', 'Photography', 'PHP', 'Product Management', 'Project Management', 'Python', 'React', 'React Native', 'Ruby', 'Sales', 'SEO', 'Social Media Marketing', 'SQL', 'Swift', 'TypeScript', 'UI/UX Design', 'Video Editing', 'Vue.js', 'Web Design', 'Web Development', 'WordPress'
];

const ExperiencesManager = ({ userExperiences = [], onExperiencesChange }) => {
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [yearsInput, setYearsInput] = useState('');
  const [filteredTopics, setFilteredTopics] = useState(PREDEFINED_TOPICS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editYears, setEditYears] = useState('');

  useEffect(() => {
    if (topicSearchTerm.trim() === '') {
      setFilteredTopics(PREDEFINED_TOPICS.filter(topic => 
        !userExperiences.some(exp => exp.topic === topic)
      ));
    } else {
      setFilteredTopics(
        PREDEFINED_TOPICS.filter(topic => 
          topic.toLowerCase().includes(topicSearchTerm.toLowerCase()) &&
          !userExperiences.some(exp => exp.topic === topic)
        )
      );
    }
  }, [topicSearchTerm, userExperiences]);

  const handleAddExperience = (topic) => {
    const years = parseInt(yearsInput) || 0;
    if (years > 0 && !userExperiences.some(exp => exp.topic === topic)) {
      const newExperience = { topic, years };
      onExperiencesChange([...userExperiences, newExperience]);
    }
    setTopicSearchTerm('');
    setYearsInput('');
    setShowDropdown(false);
  };

  const handleAddCustomExperience = () => {
    const customTopic = topicSearchTerm.trim();
    const years = parseInt(yearsInput) || 0;
    if (customTopic && years > 0 && !userExperiences.some(exp => exp.topic === customTopic)) {
      const newExperience = { topic: customTopic, years };
      onExperiencesChange([...userExperiences, newExperience]);
    }
    setTopicSearchTerm('');
    setYearsInput('');
    setShowDropdown(false);
  };

  const handleRemoveExperience = (experienceToRemove) => {
    onExperiencesChange(userExperiences.filter(exp => exp.topic !== experienceToRemove.topic));
  };

  const startEditingYears = (experience) => {
    setEditingExperience(experience.topic);
    setEditYears(experience.years.toString());
  };

  const saveEditedYears = (topic) => {
    const newYears = parseInt(editYears) || 1;
    if (newYears > 0) {
      const updatedExperiences = userExperiences.map(exp => 
        exp.topic === topic ? { ...exp, years: newYears } : exp
      );
      onExperiencesChange(updatedExperiences);
    }
    setEditingExperience(null);
    setEditYears('');
  };

  const cancelEditingYears = () => {
    setEditingExperience(null);
    setEditYears('');
  };

  const handleEditKeyPress = (e, topic) => {
    if (e.key === 'Enter') {
      saveEditedYears(topic);
    } else if (e.key === 'Escape') {
      cancelEditingYears();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const years = parseInt(yearsInput) || 0;
      if (years > 0) {
        if (filteredTopics.length > 0) {
          handleAddExperience(filteredTopics[0]);
        } else if (topicSearchTerm.trim()) {
          handleAddCustomExperience();
        }
      }
    }
  };

  const canAddExperience = () => {
    const years = parseInt(yearsInput) || 0;
    return topicSearchTerm.trim() && years > 0;
  };

  return (
    <div className="experiences-manager">
      {userExperiences.length > 0 && (
        <div className="user-experiences">
          {userExperiences.map((experience) => (
            <span key={experience.topic} className="experience-tag">
              <span className="experience-topic">{experience.topic}</span>
              {editingExperience === experience.topic ? (
                <input
                  type="number"
                  value={editYears}
                  onChange={(e) => setEditYears(e.target.value)}
                  onBlur={() => saveEditedYears(experience.topic)}
                  onKeyPress={(e) => handleEditKeyPress(e, experience.topic)}
                  className="edit-years-input"
                  min="1"
                  max="50"
                  autoFocus
                />
              ) : (
                <span 
                  className="experience-years clickable"
                  onClick={() => startEditingYears(experience)}
                  title="Click to edit years"
                >
                  {experience.years} year{experience.years !== 1 ? 's' : ''}
                </span>
              )}
              <button
                className="remove-experience"
                onClick={() => handleRemoveExperience(experience)}
                aria-label={`Remove ${experience.topic}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="experiences-input-container">
        <div className="experience-inputs">
          <div className="topic-input-container">
            <input
              type="text"
              placeholder="Search topics or add your own..."
              value={topicSearchTerm}
              onChange={(e) => setTopicSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyPress={handleKeyPress}
              className="topic-input"
            />
            
            {showDropdown && (topicSearchTerm || filteredTopics.length > 0) && (
              <div className="topics-dropdown">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic}
                    className="topic-option"
                    onClick={() => setTopicSearchTerm(topic)}
                  >
                    {topic}
                  </button>
                ))}
                {topicSearchTerm.trim() && !PREDEFINED_TOPICS.includes(topicSearchTerm.trim()) && (
                  <button
                    className="topic-option custom-option"
                    onClick={() => setTopicSearchTerm(topicSearchTerm.trim())}
                  >
                    + Add "{topicSearchTerm.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>
          
          <input
            type="number"
            placeholder="Years"
            value={yearsInput}
            onChange={(e) => setYearsInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="years-input"
            min="1"
            max="50"
          />
          
          <button
            className="add-experience-btn"
            onClick={() => {
              if (filteredTopics.includes(topicSearchTerm)) {
                handleAddExperience(topicSearchTerm);
              } else {
                handleAddCustomExperience();
              }
            }}
            disabled={!canAddExperience()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperiencesManager;
