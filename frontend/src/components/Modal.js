import React, { useState } from 'react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function NewGameModal({ isOpen, onClose, onSubmit }) {
  const [opponent, setOpponent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (opponent.trim()) {
      onSubmit(opponent.trim());
      setOpponent('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Game">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Who do you want to challenge?</label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Enter opponent's name"
            required
          />
        </div>
        <div className="modal-buttons">
          <button type="button" className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">
            Start Game
          </button>
        </div>
      </form>
    </Modal>
  );
} 