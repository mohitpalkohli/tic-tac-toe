import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const gameService = {
  // We'll add more methods here later
  getGames: async () => {
    const response = await axios.get(`${API_BASE_URL}/games`);
    return response.data;
  },

  getPlayerGames: async (playerName) => {
    const response = await axios.get(`${API_BASE_URL}/games/player/${playerName}`);
    return response.data;
  },

  getGameById: async (gameId) => {
    const response = await axios.get(`${API_BASE_URL}/games/${gameId}`);
    return response.data;
  },

  makeMove: async (gameId, player, row, col) => {
    const response = await axios.post(`${API_BASE_URL}/games/${gameId}/move`, {
      player,
      row,
      col
    });
    return response.data;
  },

  createGame: async (playerX, playerO) => {
    const response = await axios.post(`${API_BASE_URL}/games`, { playerX, playerO });
    return response.data;
  },

  pollGameById: async (gameId, lastKnownState) => {
    const response = await axios.get(
      `${API_BASE_URL}/games/${gameId}/poll?state=${encodeURIComponent(JSON.stringify(lastKnownState))}`
    );
    return response.data;
  }
}; 