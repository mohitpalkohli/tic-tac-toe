const express = require('express');
const router = express.Router();
const GameService = require('../services/gameService');

// Create router handler
router.use((req, res, next) => {
  req.gameService = new GameService(req.db);
  next();
});

// Get all game sessions
router.get('/', async (req, res) => {
  try {
    const games = await req.gameService.getAllGames();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create new game session
router.post('/', async (req, res) => {
  const { playerX, playerO } = req.body;
  
  if (!playerX || !playerO) {
    return res.status(400).json({ error: 'Both player names are required' });
  }

  try {
    const game = await req.gameService.createGame(playerX, playerO);
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game - ' + error.message });
  }
});

// Get specific game session
router.get('/:id', async (req, res) => {
  try {
    const game = await req.gameService.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get games by player name
router.get('/player/:name', async (req, res) => {
  try {
    const games = await req.gameService.getGamesByPlayer(req.params.name);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Make a move
router.post('/:id/move', async (req, res) => {
  const { row, col, player } = req.body;
  const gameId = req.params.id;

  // Validate input parameters
  if (row === undefined || col === undefined || !player) {
    return res.status(400).json({ error: 'Row, column and player are required' });
  }

  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return res.status(400).json({ error: 'Row and column must be between 0 and 2' });
  }

  try {
    await req.gameService.validateMove(gameId, player, row, col);
    const result = await req.gameService.makeMove(gameId, player, row, col);
    res.json(result);
  } catch (error) {
    if (error.message === 'Game not found') {
      res.status(404).json({ error: error.message });
    } else if (['Not your turn', 'Position already taken', 'Game is already complete'].includes(error.message)) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to make move' });
    }
  }
});

module.exports = router; 