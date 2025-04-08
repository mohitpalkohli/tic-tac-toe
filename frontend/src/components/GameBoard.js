import React from 'react';

function GameBoard({ board, onCellClick, isGameOver }) {
  return (
    <div className="game-board">
      {board.map((row, rowIndex) => 
        row.map((cell, colIndex) => (
          <div 
            key={`${rowIndex}-${colIndex}`}
            className={`board-cell ${cell ? 'filled' : ''} ${isGameOver ? 'disabled' : ''}`}
            onClick={!isGameOver ? () => onCellClick(rowIndex, colIndex) : undefined}
          >
            {cell || ''}
          </div>
        ))
      )}
    </div>
  );
}

export default GameBoard; 