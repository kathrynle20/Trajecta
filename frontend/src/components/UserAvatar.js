import React, { useState, useRef, useEffect } from 'react';
import './UserAvatar.css';

const UserAvatar = ({ user, onLogout, onProfileClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    onProfileClick();
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Default avatar component
  const DefaultAvatar = ({ size = '40px', className = '' }) => (
    <div 
      className={`default-avatar ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: size === '40px' ? '16px' : '20px'
      }}
    >
      {getInitials(user.name)}
    </div>
  );

  return (
    <div className="user-avatar-container" ref={dropdownRef}>
      <button className="avatar-button" onClick={toggleDropdown}>
        {!imageError && user.photo ? (
          <img 
            src={user.photo} 
            alt={user.name} 
            className="avatar-image" 
            onError={handleImageError}
          />
        ) : (
          <DefaultAvatar />
        )}
      </button>
      
      {isDropdownOpen && (
        <div className="avatar-dropdown">
          <div className="dropdown-header">
            {!imageError && user.photo ? (
              <img 
                src={user.photo} 
                alt={user.name} 
                className="dropdown-avatar" 
                onError={handleImageError}
              />
            ) : (
              <DefaultAvatar size="48px" className="dropdown-avatar" />
            )}
            <div className="dropdown-user-info">
              <p className="dropdown-name">{user.name}</p>
              <p className="dropdown-email">{user.email}</p>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={handleProfileClick}>
              <span className="dropdown-icon">👤</span>
              Profile
            </button>
            <button className="dropdown-item" onClick={() => {}}>
              <span className="dropdown-icon">⚙️</span>
              Settings
            </button>
            <button className="dropdown-item logout" onClick={handleLogoutClick}>
              <span className="dropdown-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
