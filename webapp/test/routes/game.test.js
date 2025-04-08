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
        .send({ playerX: 'Alice', playerO: 'Bob' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        player_x: 'Alice',
        player_o: 'Bob',
        current_player: 'X',
        status: 'IN_PROGRESS'
      }));
    });

    it('should return 400 if player names missing', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both player names are required');
    });
  });

  describe('GET /', () => {
    it('should return all games', async () => {
      const mockGames = [
        { id: '123', player_x: 'Alice', player_o: 'Bob' },
        { id: '456', player_x: 'Charlie', player_o: 'Dave' }
      ];
      mockDb.all.mockResolvedValue(mockGames);

      const response = await request(app)
        .get('/api/games');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGames);
    });
  });

  describe('GET /:id', () => {
    it('should return game by id', async () => {
      const mockGame = { id: '123', player_x: 'Alice', player_o: 'Bob' };
      mockDb.get.mockResolvedValue(mockGame);

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
        { id: '123', player_x: 'Alice', player_o: 'Bob' },
        { id: '456', player_x: 'Charlie', player_o: 'Alice' }
      ];
      mockDb.all.mockResolvedValue(mockGames);

      const response = await request(app)
        .get('/api/games/player/Alice');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGames);
    });
  });

  describe('POST /:id/move', () => {
    it('should make move and return updated state', async () => {
      mockDb.get
        .mockResolvedValueOnce({ status: 'IN_PROGRESS', current_player: 'X' })
        .mockResolvedValueOnce(null) // no existing move
        .mockResolvedValueOnce({ count: 0 }); // move count
      mockDb.all.mockResolvedValue([]); // no moves for winner check

      const response = await request(app)
        .post('/api/games/123/move')
        .send({ player: 'X', row: 0, col: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        move_number: 1,
        player: 'X',
        status: 'IN_PROGRESS'
      }));
    });

    it('should return 400 for invalid move', async () => {
      mockDb.get.mockResolvedValue({ 
        status: 'IN_PROGRESS', 
        current_player: 'O' 
      });

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