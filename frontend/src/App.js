import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import GamesList from './components/GamesList';
import './App.css';

function PlayerNameForm() {
  const [playerName, setPlayerName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/games/${playerName}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Tic Tac Toe</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
            <button type="submit">Play</button>
          </div>
        </form>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlayerNameForm />} />
        <Route path="/games/:playerName" element={<GamesList />} />
      </Routes>
    </Router>
  );
}

export default App; 