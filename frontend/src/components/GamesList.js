import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';

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

function GameCard({ game, onClick, isSelected }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`game-card ${game.status === 'COMPLETE' ? 'complete' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <h3>Game #{game.id.slice(0, 8)}</h3>
      <p>Player X: {game.player_x}</p>
      <p>Player O: {game.player_o}</p>
      <p className="status">
        {game.status === 'IN_PROGRESS' ? 'In Progress' : 
          game.winner === 'DRAW' ? 'Draw' : `Winner: ${game.winner}`}
      </p>
      <p className="date">{formatDate(game.created_at)}</p>
    </div>
  );
}

function GameStatus({ game }) {
  if (!game) return null;

  let resultText = '';
  if (game.winner === 'DRAW') {
    resultText = 'Game ended in a draw';
  } else if (game.winner === 'X' || game.winner === 'O') {
    const winnerName = game.winner === 'X' ? game.player_x : game.player_o;
    resultText = `Player ${game.winner} wins! (${winnerName})`;
  } else if (game.current_player) {
    resultText = `${game.current_player === 'X' ? game.player_x : game.player_o}'s turn`;
  }

  return (
    <>
      <p className="player-name">Player X: {game.player_x}</p>
      <p className="player-name">Player O: {game.player_o}</p>
      <p className={game.winner ? "game-result" : "current-turn"}>{resultText}</p>
    </>
  );
}

function GamesList() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const { playerName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const playerGames = await gameService.getPlayerGames(playerName);
        const sortedGames = playerGames.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setGames(sortedGames);
        setSelectedGame(sortedGames[0]);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      }
    };

    fetchGames();
  }, [playerName]);

  const handleCellClick = (row, col) => {
    // We'll implement move functionality later
    console.log(`Clicked cell at row ${row}, col ${col}`);
  };

  return (
    <div className="game-list-container">
      <div className="sidebar">
        {games.map(game => (
          <GameCard 
            key={game.id} 
            game={game}
            onClick={() => setSelectedGame(game)}
            isSelected={selectedGame?.id === game.id}
          />
        ))}
      </div>
      <div className="main-content">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          Change Player
        </button>
        <h1>Home</h1>
        <h2>Welcome, {playerName}!</h2>
        {selectedGame && (
          <>
            <GameStatus game={selectedGame} />
            <GameBoard 
              board={selectedGame.board} 
              onCellClick={handleCellClick}
              isGameOver={selectedGame.winner !== null}
            />
            <pre style={{ textAlign: 'left' }}>
              {JSON.stringify(selectedGame, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

export default GamesList; 