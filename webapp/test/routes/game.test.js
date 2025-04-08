const request = require('supertest');
const express = require('express');
const gameRoutes = require('../../routes/game');

describe('Game Routes', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock db
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };

    // Add mock db to requests
    app.use((req, res, next) => {
      req.db = mockDb;
      next();
    });

    app.use('/api/games', gameRoutes);
  });

  describe('POST /', () => {
    it('should create new game', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({ playerX: 'Joe', playerO: 'Jack' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        playerX: 'Joe',
        playerO: 'Jack',
        currentPlayer: 'X',
        status: 'IN_PROGRESS',
        winner: null
      }));
    });

    it('should return 400 if player names missing', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both player names are required');
    });

    it('should return 400 if playerX is missing', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({ playerO: 'Jack' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both player names are required');
    });

    it('should return 400 if playerO is missing', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({ playerX: 'Joe' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both player names are required');
    });
  });

  describe('GET /', () => {
    it('should return all games', async () => {
      const mockGames = [
        { 
          id: '123', 
          playerX: 'Jack', 
          playerO: 'Jill', 
          currentPlayer: 'X', 
          status: 'IN_PROGRESS',
          winner: null,
          board: [[null, null, null], [null, null, null], [null, null, null]]
        },
        { 
          id: '456', 
          playerX: 'Charlie', 
          playerO: 'Dave', 
          currentPlayer: 'O', 
          status: 'IN_PROGRESS',
          winner: null,
          board: [[null, null, null], [null, null, null], [null, null, null]]
        }
      ];
      mockDb.all
      .mockResolvedValueOnce(mockGames) // For game state
      .mockResolvedValue([]); // For board state

      const response = await request(app)
        .get('/api/games');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGames);
    });
  });

  describe('GET /:id', () => {
    it('should return game by id', async () => {
      const mockGame = { 
        id: '123', 
        playerX: 'Jack', 
        playerO: 'Jill',
        currentPlayer: 'X',
        status: 'IN_PROGRESS',
        winner: null,
        board: [[null, null, null], [null, null, null], [null, null, null]]
      };
      mockDb.get.mockResolvedValue(mockGame);
      mockDb.all.mockResolvedValue([]); // For board state

      const response = await request(app)
        .get('/api/games/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGame);
    });

    it('should return 404 if game not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/games/123');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /player/:name', () => {
    it('should return games for player', async () => {
      const mockGames = [
        { 
          id: '123', 
          playerX: 'Jack', 
          playerO: 'Jill',
          currentPlayer: 'X',
          status: 'IN_PROGRESS',
          winner: null,
          board: [[null, null, null], [null, null, null], [null, null, null]]
        },
        { 
          id: '456', 
          playerX: 'Charlie', 
          playerO: 'Jack',
          currentPlayer: 'O',
          status: 'IN_PROGRESS',
          winner: null,
          board: [[null, null, null], [null, null, null], [null, null, null]]
        }
      ];
      
      mockDb.all
        .mockResolvedValueOnce(mockGames) // For game state
        .mockResolvedValue([]); // For board state

      const response = await request(app)
        .get('/api/games/player/Jack');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGames);
    });
  });

  describe('POST /:id/move', () => {
    it('should make move and return updated state', async () => {
      mockDb.get
        .mockResolvedValueOnce({ status: 'IN_PROGRESS', currentPlayer: 'X' })
        .mockResolvedValueOnce(null); // no existing move
      mockDb.all.mockResolvedValue([]); // no moves for winner check

      const response = await request(app)
        .post('/api/games/123/move')
        .send({ player: 'X', row: 0, col: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        player: 'X',
        row: 0,
        col: 0,
        status: 'IN_PROGRESS',
        winner: null
      }));
    });

    it('should return 400 for invalid move', async () => {
      mockDb.get.mockResolvedValue({ 
        id: '123', 
        playerX: 'Jack', 
        playerO: 'Jill',
        currentPlayer: 'O',
        status: 'IN_PROGRESS',
        winner: null,
      });

      mockDb.all.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/games/123/move')
        .send({ player: 'X', row: 0, col: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Not your turn');
    });

    it('should return 400 for invalid row/col values', async () => {
      const response = await request(app)
        .post('/api/games/123/move')
        .send({ player: 'X', row: 3, col: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Row and column must be between 0 and 2');
    });
  });
}); 