import React, { useState, useEffect } from 'react';
import './Feed.css';

const Feed = ({ user, communityId, communityName, communityDescription, onPostSelect }) => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sample posts data - TODO: Replace with API calls
  const samplePosts = {
    1: [ // Your Feed
      {
        id: 1,
        author: 'John Doe',
        avatar: '👤',
        content: 'Welcome to the General community! This is a great place to share general discussions.',
        timestamp: '2 hours ago',
        likes: 12,
        comments: 3,
        isLiked: false
      },
      {
        id: 2,
        author: 'Sarah Wilson',
        avatar: '👩',
        content: 'Has anyone tried the new features in the latest update? Would love to hear your thoughts!',
        timestamp: '4 hours ago',
        likes: 8,
        comments: 5,
        isLiked: true
      }
    ],
    2: [ // Tech Talk
      {
        id: 3,
        author: 'Mike Chen',
        avatar: '👨‍💻',
        content: 'Just discovered this amazing React hook pattern for managing complex state. Check it out!',
        timestamp: '1 hour ago',
        likes: 25,
        comments: 8,
        isLiked: false
      },
      {
        id: 4,
        author: 'Alex Rodriguez',
        avatar: '🧑‍💻',
        content: 'Anyone working with TypeScript? I have some questions about advanced type patterns.',
        timestamp: '3 hours ago',
        likes: 15,
        comments: 12,
        isLiked: true
      }
    ],
    3: [ // Study Groups
      {
        id: 5,
        author: 'Emma Thompson',
        avatar: '📚',
        content: 'Starting a new study group for algorithms and data structures. Who\'s interested?',
        timestamp: '30 minutes ago',
        likes: 18,
        comments: 6,
        isLiked: false
      }
    ]
  };

  useEffect(() => {
    // Load posts for the current community
    fetchPosts();
    setLoading(true);
    setTimeout(() => {
      // setPosts(samplePosts[communityId] || []);
      setLoading(false);
    });
  }, [communityId]);

  const fetchPosts = () => {
    try {
      fetch('http://localhost:3001/feed-api/find-posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ forum: communityId })
        })
        .then(res => res.json())
        .then(response => {
          console.log("FORUM ID:", communityId);
          console.log(response);
          if(response.success) {
            const postsData = response.posts;
            setPosts(postsData);
          }
        })
        .catch(error => {
          console.error('Error sending user data to backend:', error);
        });
    } catch (error) {
        console.error('Error creating post for user:', error);
    }
  }

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const post = {
        id: Date.now(),
        author: 'You',
        avatar: '😊',
        title: title,
        content: newPost.trim(),
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isLiked: false
      };

      try {
        fetch('http://localhost:3001/feed-api/create-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user: user, forum: communityId, post: post })
          })
          .then(res => res.json())
          .then(response => {
            console.log(response);
          })
          .catch(error => {
            console.error('Error sending user data to backend:', error);
          });
      } catch (error) {
          console.error('Error creating post for user:', error);
      }

      setNewPost('');
      setShowCreatePost(false);
    }
  };

  const handleLikePost = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleComment = (postId) => {
    if (onPostSelect) {
      onPostSelect(postId);
    }
  };

  if (loading) {
    return (
      <div className="feed-loading">
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <div className="feed-header-content">
          <h3>{communityName} Feed</h3>
          {communityDescription && (
            <p className="community-description">{communityDescription}</p>
          )}
        </div>
        <button 
          className="create-post-btn"
          onClick={() => setShowCreatePost(!showCreatePost)}
        >
          + Create Post
        </button>
      </div>

      {showCreatePost && (
        <div className="create-post-form">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder={`What's on your mind in ${communityName}?`}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
          />
          <div className="form-actions">
            <button onClick={handleCreatePost} className="post-btn">Post</button>
            <button onClick={() => setShowCreatePost(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet in {communityName}.</p>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-item">
              <div className="post-header">
                <div className="post-avatar">{post.avatar}</div>
                <div className="post-meta">
                  <span className="post-author">{post.author}</span>
                  <span className="post-timestamp">{post.timestamp}</span>
                </div>
              </div>
              
              <div className="post-content">
                <p>{post.content}</p>
              </div>
              
              <div className="post-actions">
                <button 
                  className={`action-btn like-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleLikePost(post.id)}
                >
                  ❤️ {post.likes}
                </button>
                <button 
                  className="action-btn comment-btn"
                  onClick={() => handleComment(post.id)}
                >
                  💬 {post.comments}
                </button>
                <button className="action-btn share-btn">
                  🔗 Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;