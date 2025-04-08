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

function GameCard({ game, onClick, isSelected, currentPlayerName }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

function Modal({ isOpen, onClose, title, children }) {
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

function NewGameModal({ isOpen, onClose, onSubmit }) {
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

function GamesList() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [error, setError] = useState(null);
  const { playerName } = useParams();
  const navigate = useNavigate();
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const fetchGameState = async (gameId) => {
    try {
      const game = await gameService.getGameById(gameId);
      setSelectedGame(game);
      // Update the game in the list as well
      setGames(games.map(g => g.id === gameId ? game : g));
      setError(null);
    } catch (error) {
      setError(`Failed to fetch game state: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const playerGames = await gameService.getPlayerGames(playerName);
        const sortedGames = playerGames.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setGames(sortedGames);
        setSelectedGame(sortedGames[0]);
        setError(null);
      } catch (error) {
        setError(`Failed to fetch games: ${error.message}`);
      }
    };

    fetchGames();
  }, [playerName]);

  useEffect(() => {
    let isSubscribed = true;

    const pollForChanges = async () => {
      if (!selectedGame || !isSubscribed) return;

      try {
        setIsPolling(true);
        const result = await gameService.pollGameById(selectedGame.id, selectedGame);
        
        if (!isSubscribed) return;

        if (!result.noChange) {
          setSelectedGame(result);
          setGames(games => games.map(g => 
            g.id === result.id ? result : g
          ));
        }

        // Immediately start next poll
        pollForChanges();
      } catch (error) {
        console.error('Polling error:', error);
        // On error, wait a bit before retrying
        if (isSubscribed) {
          setTimeout(() => pollForChanges(), 2000);
        }
      } finally {
        if (isSubscribed) {
          setIsPolling(false);
        }
      }
    };

    if (selectedGame) {
      pollForChanges();
    }

    return () => {
      isSubscribed = false;
    };
  }, [selectedGame?.id]);

  const isPlayersTurn = (game) => {
    if (!game || game.winner) return false;
    
    const isPlayerX = game.playerX === playerName;
    const isPlayerO = game.playerO === playerName;
    
    return (isPlayerX && game.currentPlayer === 'X') || 
           (isPlayerO && game.currentPlayer === 'O');
  };

  const handleCellClick = async (row, col) => {
    if (!selectedGame || selectedGame.winner || !selectedGame.board || !isPlayersTurn(selectedGame)) return;
    
    // Check if cell is already taken
    if (selectedGame.board[row][col]) return;

    try {
      await gameService.makeMove(
        selectedGame.id,
        selectedGame.currentPlayer,
        row,
        col
      );
      await fetchGameState(selectedGame.id);
      setError(null);
    } catch (error) {
      setError(`Failed to make move: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleNewGame = async (opponent) => {
    try {
      await gameService.createGame(playerName, opponent);
      const playerGames = await gameService.getPlayerGames(playerName);
      const sortedGames = playerGames.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setGames(sortedGames);
      setSelectedGame(sortedGames[0]);
      setIsNewGameModalOpen(false);
      setError(null);
    } catch (error) {
      setError(`Failed to create game: ${error.message}`);
    }
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
            currentPlayerName={playerName}
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
        <button 
          className="back-button new-game-button"
          onClick={() => setIsNewGameModalOpen(true)}
        >
          New Game
        </button>
        <h1>Tic Tac Toe</h1>
        <h2>Welcome, {playerName}!</h2>
        {error && <p className="error-message">{error}</p>}
        {selectedGame && (
          <>
            <GameStatus game={selectedGame} />
            <GameBoard 
              board={selectedGame.board} 
              onCellClick={handleCellClick}
              isGameOver={selectedGame.winner !== null || !isPlayersTurn(selectedGame)}
            />
            <div 
              className="json-toggle" 
              onClick={() => setShowJson(!showJson)}
            >
              <span className={`arrow ${showJson ? 'expanded' : ''}`}>▶</span>
              Show JSON
            </div>
            {showJson && (
              <pre className="json-content">
                {JSON.stringify(selectedGame, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onSubmit={handleNewGame}
      />
    </div>
  );
}

export default GamesList; 