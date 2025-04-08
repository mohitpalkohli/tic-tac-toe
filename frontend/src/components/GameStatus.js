import React from 'react';

function GameStatus({ game }) {
  if (!game) return null;

  let resultText = '';
  if (game.winner === 'DRAW') {
    resultText = 'Game ended in a draw';
  } else if (game.winner === 'X' || game.winner === 'O') {
    const winnerName = game.winner === 'X' ? game.playerX : game.playerO;
    resultText = `Player ${game.winner} wins! (${winnerName})`;
  } else if (game.currentPlayer) {
    const currentPlayerName = game.currentPlayer === 'X' ? game.playerX : game.playerO;
    resultText = `${currentPlayerName}'s turn (${game.currentPlayer})`;
  }

  return (
    <>
      <p className="player-name">Player X: {game.playerX}</p>
      <p className="player-name">Player O: {game.playerO}</p>
      <p className={game.winner ? "game-result" : "current-turn"}>{resultText}</p>
    </>
  );
}

export default GameStatus; 