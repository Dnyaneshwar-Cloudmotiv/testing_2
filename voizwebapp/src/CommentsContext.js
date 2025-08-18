import React, { createContext, useContext, useState, useEffect } from 'react';

const CommentsContext = createContext();

export function CommentsProvider({ children }) {
  const [showComments, setShowComments] = useState(() => {
    return localStorage.getItem('showComments') === 'true';
  });
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('showComments', showComments);
  }, [showComments]);

  const getCurrentTimestamp = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const fetchComments = async (songId) => {
    if (!songId) {
      setError('Song ID is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://hl9z99pvmk.execute-api.ap-south-1.amazonaws.com/voiz/song/comments?song_id=${songId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const sortedComments = data.sort((a, b) => {
          return parseInt(b.comment_id) - parseInt(a.comment_id);
        });
        setComments(sortedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.message);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const postComment = async (songId, comment) => {
    if (!songId || !comment.trim()) {
      setError('Song ID and comment are required');
      return false;
    }

    setError(null);
    const userId = localStorage.getItem('user_id') || '1';
    const fullName = localStorage.getItem('FullName') || 'User';
    const stageName = localStorage.getItem('StageName') || 'User';
    const timestamp = getCurrentTimestamp();
    
    try {
      const response = await fetch(
        'https://hl9z99pvmk.execute-api.ap-south-1.amazonaws.com/voiz/song/comment', 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            song_id: songId,
            comments: comment.trim(),
            FullName: fullName,
            StageName: stageName,
            updatedTimestamp: timestamp,
            createdTimestamp: timestamp
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      // Instead of refreshing, manually add the new comment to the state
      const newComment = {
        user_id: userId,
        comments: comment.trim(),
        comment_id: Date.now().toString(), // Temporary ID until refresh
        FullName: fullName,
        StageName: stageName,
        profilePhotoUrl: localStorage.getItem('ProfilePhotoUrl') || ''
      };

      setComments(prevComments => [newComment, ...prevComments]);
      return true;

    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
      return false;
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value = {
    showComments,
    setShowComments,
    comments,
    isLoading,
    error,
    fetchComments,
    postComment
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
}