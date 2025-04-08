import React from 'react';
import { formatDate } from '../utils/dateUtils';

function GameCard({ game, onClick, isSelected, currentPlayerName }) {
  const getGameCardClass = () => {
    const classes = ['game-card'];
    if (isSelected) classes.push('selected');
    
    if (game.winner && game.winner !== 'DRAW') {
      const isWinner = 
        (game.winner === 'X' && game.playerX === currentPlayerName) ||
        (game.winner === 'O' && game.playerO === currentPlayerName);
      
      classes.push(isWinner ? 'user-won' : 'user-lost');
    }
    
    return classes.join(' ');
  };

  return (
    <div 
      className={getGameCardClass()}
      onClick={onClick}
    >
      <h3>Game #{game.id.slice(0, 8)}</h3>
      <p>Player X: {game.playerX}</p>
      <p>Player O: {game.playerO}</p>
      <p className="status">
        {game.status === 'IN_PROGRESS' ? 'In Progress' : 
          game.winner === 'DRAW' ? 'Draw' : `Winner: ${game.winner}`}
      </p>
      <p className="date">{formatDate(game.createdAt)}</p>
    </div>
  );
}

export default GameCard; 