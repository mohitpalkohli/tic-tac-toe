import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';

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
        setSelectedGame(sortedGames[0]); // Select first game by default
      } catch (error) {
        console.error('Failed to fetch games:', error);
      }
    };

    fetchGames();
  }, [playerName]);

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
        <pre style={{ textAlign: 'left' }}>
          {JSON.stringify(selectedGame, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default GamesList; 