import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';
import GameBoard from './GameBoard';
import GameCard from './GameCard';
import GameStatus from './GameStatus';
import { NewGameModal } from './Modal';

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