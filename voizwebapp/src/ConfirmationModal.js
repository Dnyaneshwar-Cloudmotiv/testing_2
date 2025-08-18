import React, { useEffect } from 'react';

const ConfirmationModal = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);


  return (
    <div className="confirmation-backdrop">
      <div className="confirmation-modal">
        <button onClick={onClose} className="confirmation-close-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            <path d="M13 1L1 13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </button>
        <h3>Confirmation</h3>
        <p dangerouslySetInnerHTML={{ __html: message }} />
        <div className="confirmation-checkmark">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="#2196F3"/>
            <path d="M9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.39.39-1.03.39-1.42 0z" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
