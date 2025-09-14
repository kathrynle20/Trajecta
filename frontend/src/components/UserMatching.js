import React, { useState } from 'react';

const UserMatching = () => {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [addedFriends, setAddedFriends] = useState(new Set());

  // Hardcoded users with interests and similarity explanations
  const hardcodedUsers = [
    {
      id: 1,
      name: "Jillian Chong",
      avatar: "https://media.licdn.com/dms/image/v2/D4E03AQEyv3VVVpP1Jg/profile-displayphoto-scale_400_400/B4EZjVGhpzGcAg-/0/1755921915026?e=1760572800&v=beta&t=wRpyfGX8H20S2mr7IVS5iWwp4RHXE_xyPawZ-SLy8vI",
      interests: ["Machine Learning", "Data Science", "Python"],
      similarity: "You both love ML and data analysis! Alex also enjoys working with neural networks and has experience with TensorFlow.",
      location: "San Francisco, CA",
      year: "Junior"
    },
    {
      id: 2,
      name: "Aliaksandr Melnichenka",
      avatar: "https://melnichenka.com/img/combined.png",
      interests: ["Deep Learning", "NLP", "Robotics"],
      similarity: "You both are fascinated by deep learning applications! David is building chatbots and working on robotics projects.",
      location: "Seattle, WA",
      year: "Graduate Student"
    },
    {
      id: 3,
      name: "Emma Johnson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      interests: ["Data Analytics", "Statistics", "Business Intelligence"],
      similarity: "You both enjoy turning data into insights! Emma specializes in business analytics and loves creating data visualizations.",
      location: "New York, NY",
      year: "Senior"
    },
    {
      id: 4,
      name: "Michael Rodriguez",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      interests: ["Web Development", "Full Stack", "JavaScript"],
      similarity: "You both have strong programming backgrounds! Michael builds web apps and is passionate about modern JavaScript frameworks.",
      location: "Austin, TX",
      year: "Junior"
    },
    {
      id: 5,
      name: "Lisa Wang",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      interests: ["Quantum Computing", "Physics", "Mathematics"],
      similarity: "You both love complex mathematical concepts! Lisa is exploring quantum algorithms and their applications in machine learning.",
      location: "Cambridge, MA",
      year: "PhD Student"
    }
  ];

  const currentUser = hardcodedUsers[currentUserIndex];

  const handleNextUser = () => {
    setCurrentUserIndex((prev) => (prev + 1) % hardcodedUsers.length);
  };

  const handleAddFriend = (userId) => {
    setAddedFriends(prev => new Set([...prev, userId]));
  };

  const handleSkip = () => {
    handleNextUser();
  };

  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      maxWidth: '600px', 
      margin: '2rem auto', 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: '#333',
        fontSize: '28px'
      }}>
        🎯 Find Your Study Buddy
      </h2>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {/* User Avatar */}
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '20px',
            border: '4px solid #007bff'
          }}
        />

        {/* User Info */}
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '24px',
          color: '#333'
        }}>
          {currentUser.name}
        </h3>

        <div style={{ 
          color: '#666', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          📍 {currentUser.location} • 🎓 {currentUser.year}
        </div>

        {/* Interests */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ 
            margin: '0 0 10px 0', 
            color: '#555',
            fontSize: '16px'
          }}>
            Interests:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {currentUser.interests.map((interest, index) => (
              <span 
                key={index}
                style={{
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Similarity Explanation */}
        <div style={{
          backgroundColor: '#f0f8ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#1976d2',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🤝 Why you might connect:
          </h4>
          <p style={{ 
            margin: 0, 
            color: '#555',
            lineHeight: '1.5',
            fontSize: '14px'
          }}>
            {currentUser.similarity}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleSkip}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              minWidth: '120px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            ⏭️ Skip
          </button>

          <button
            onClick={() => handleAddFriend(currentUser.id)}
            disabled={addedFriends.has(currentUser.id)}
            style={{
              backgroundColor: addedFriends.has(currentUser.id) ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: addedFriends.has(currentUser.id) ? 'default' : 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              minWidth: '120px',
              opacity: addedFriends.has(currentUser.id) ? 0.8 : 1
            }}
            onMouseOver={(e) => {
              if (!addedFriends.has(currentUser.id)) {
                e.target.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseOut={(e) => {
              if (!addedFriends.has(currentUser.id)) {
                e.target.style.backgroundColor = '#007bff';
              }
            }}
          >
            {addedFriends.has(currentUser.id) ? '✅ Added!' : '👋 Add Friend'}
          </button>
        </div>

        {/* Progress Indicator */}
        <div style={{ 
          marginTop: '25px',
          color: '#666',
          fontSize: '14px'
        }}>
          User {currentUserIndex + 1} of {hardcodedUsers.length}
        </div>

        {/* Friends Counter */}
        {addedFriends.size > 0 && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            color: '#155724',
            fontSize: '14px'
          }}>
            🎉 You've added {addedFriends.size} friend{addedFriends.size !== 1 ? 's' : ''}!
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        color: '#666',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        💡 <strong>Tip:</strong> Connect with users who share your academic interests and learning goals!
      </div>
    </div>
  );
};

export default UserMatching;
