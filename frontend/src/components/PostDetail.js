import React, { useState, useEffect } from 'react';
import './PostDetail.css';

const PostDetail = ({ postId, onBack }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Sample post data - TODO: Replace with API calls
  const samplePosts = {
    1: {
      id: 1,
      author: 'John Doe',
      avatar: '👤',
      content: 'Welcome to the General community! This is a great place to share general discussions.',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 3,
      isLiked: false
    },
    2: {
      id: 2,
      author: 'Sarah Wilson',
      avatar: '👩',
      content: 'Has anyone tried the new features in the latest update? Would love to hear your thoughts!',
      timestamp: '4 hours ago',
      likes: 8,
      comments: 5,
      isLiked: true
    },
    3: {
      id: 3,
      author: 'Mike Chen',
      avatar: '👨‍💻',
      content: 'Just discovered this amazing React hook pattern for managing complex state. Check it out!',
      timestamp: '1 hour ago',
      likes: 25,
      comments: 8,
      isLiked: false
    },
    4: {
      id: 4,
      author: 'Alex Rodriguez',
      avatar: '🧑‍💻',
      content: 'Anyone working with TypeScript? I have some questions about advanced type patterns.',
      timestamp: '3 hours ago',
      likes: 15,
      comments: 12,
      isLiked: true
    },
    5: {
      id: 5,
      author: 'Emma Thompson',
      avatar: '📚',
      content: 'Starting a new study group for algorithms and data structures. Who\'s interested?',
      timestamp: '30 minutes ago',
      likes: 18,
      comments: 6,
      isLiked: false
    }
  };

  // Sample comments data
  const sampleComments = {
    1: [
      { id: 1, author: 'Jane Smith', avatar: '👩‍💼', content: 'Great post! Thanks for sharing.', timestamp: '1 hour ago' },
      { id: 2, author: 'Bob Johnson', avatar: '👨‍🔧', content: 'I totally agree with this perspective.', timestamp: '45 minutes ago' },
      { id: 3, author: 'Alice Brown', avatar: '👩‍🎨', content: 'This is exactly what I was looking for!', timestamp: '30 minutes ago' }
    ],
    2: [
      { id: 4, author: 'Tom Wilson', avatar: '👨‍💻', content: 'The new features are amazing! Especially the dark mode.', timestamp: '2 hours ago' },
      { id: 5, author: 'Lisa Davis', avatar: '👩‍🔬', content: 'I had some issues with the update initially, but they\'re resolved now.', timestamp: '1 hour ago' }
    ],
    3: [
      { id: 6, author: 'David Lee', avatar: '👨‍🎓', content: 'Could you share more details about this pattern?', timestamp: '45 minutes ago' },
      { id: 7, author: 'Maria Garcia', avatar: '👩‍💻', content: 'This is a game changer! Thanks for the tip.', timestamp: '20 minutes ago' }
    ]
  };

  useEffect(() => {
    // Simulate loading post and comments
    setLoading(true);
    setTimeout(() => {
      setPost(samplePosts[postId]);
      setComments(sampleComments[postId] || []);
      setLoading(false);
    }, 500);
  }, [postId]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        author: 'You',
        avatar: '😊',
        content: newComment.trim(),
        timestamp: 'Just now'
      };
      setComments([...comments, comment]);
      setNewComment('');
      
      // Update post comment count
      if (post) {
        setPost({ ...post, comments: post.comments + 1 });
      }
    }
  };

  const handleLikePost = () => {
    if (post) {
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <p>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-error">
        <p>Post not found</p>
        <button onClick={onBack} className="back-btn">← Back to Feed</button>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <div className="post-detail-header">
        <button onClick={onBack} className="back-btn">← Back to Feed</button>
        <h2>Post Details</h2>
      </div>

      <div className="post-detail-content">
        <div className="post-item-detail">
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
              onClick={handleLikePost}
            >
              ❤️ {post.likes}
            </button>
            <button className="action-btn comment-btn">
              💬 {post.comments}
            </button>
            <button className="action-btn share-btn">
              🔗 Share
            </button>
          </div>
        </div>

        <div className="comments-section">
          <h3>Comments ({comments.length})</h3>
          
          <div className="add-comment">
            <textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button onClick={handleAddComment} className="comment-submit-btn">
              Post Comment
            </button>
          </div>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-avatar">{comment.avatar}</div>
                    <div className="comment-meta">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-timestamp">{comment.timestamp}</span>
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
