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
    if (communityId) {
      fetchPosts();
    }
  }, [communityId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/feed-api/find-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ forum: communityId })
      });
      
      const data = await response.json();
      console.log("Posts response:", data);
      
      if (data.success) {
        const postsData = data.posts.map(post => ({
          id: post.id,
          author: post.author_name || 'Anonymous',
          avatar: post.author_avatar,
          title: post.title,
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleString(),
          likes: post.upvotes || 0,
          comments: 0, // TODO: Add comments count
          isLiked: false
        }));
        setPosts(postsData);
      } else {
        console.error('Failed to fetch posts:', data.message);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !title.trim()) {
      alert('Please enter both title and content for your post.');
      return;
    }

    if (!user || !user.id) {
      alert('You must be logged in to create a post.');
      return;
    }

    if (!communityId) {
      alert('Please select a community first.');
      return;
    }

    console.log('Creating post for community ID:', communityId);
    console.log('User:', user);

    const post = {
      title: title.trim(),
      content: newPost.trim()
    };

    try {
      const response = await fetch('http://localhost:3001/feed-api/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user: user, forum: communityId, post: post })
      });
      
      const data = await response.json();
      console.log('Create post response:', data);
      
      if (data.success) {
        // Clear form
        setTitle('');
        setNewPost('');
        setShowCreatePost(false);
        // Refresh posts
        fetchPosts();
      } else {
        alert('Failed to create post: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    }
  };

  const handleUpvotes = (postId) => {
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
                <div className="post-avatar">
                  {post.avatar ? (
                    <img 
                      src={post.avatar} 
                      alt={`${post.author}'s avatar`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="avatar-fallback" style={{display: post.avatar ? 'none' : 'flex'}}>
                    👤
                  </div>
                </div>
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
                  onClick={() => handleUpvotes(post.id)}
                >
                  ❤️ {post.likes}
                </button>
                <button 
                  className="action-btn comment-btn"
                  onClick={() => handleComment(post.id)}
                >
                  💬 {post.comments}
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