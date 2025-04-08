const GameService = require('../../services/gameService');

describe('GameService', () => {
  let gameService;
  let mockDb;

  beforeEach(() => {
    // Create mock db with Jest mock functions
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };
    gameService = new GameService(mockDb);
  });

  describe('createGame', () => {
    it('should create a new game with provided players', async () => {
      const playerX = 'Jack';
      const playerO = 'Jill';

      await gameService.createGame(playerX, playerO);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO games (id, playerX, playerO, currentPlayer, status) VALUES (?, ?, ?, ?, ?)',
        expect.arrayContaining([expect.any(String), playerX, playerO, 'X', 'IN_PROGRESS'])
      );
    });
  });

  describe('getGameById', () => {
    it('should return game when found', async () => {
      const mockGame = { 
        id: '123', 
        playerX: 'Jack', 
        playerO: 'Jill',
        currentPlayer: 'X',
        status: 'IN_PROGRESS',
        winner: null
      };
      mockDb.get.mockResolvedValue(mockGame);
      mockDb.all.mockResolvedValue([]); // For board state

      const result = await gameService.getGameById('123');

      expect(result).toEqual({
        ...mockGame,
        board: [[null, null, null], [null, null, null], [null, null, null]]
      });
    });

    it('should return null when game not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await gameService.getGameById('123');

      expect(result).toBeNull();
    });
  });

  describe('validateMove', () => {
    it('should throw error if game not found', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(gameService.validateMove('123', 'X', 0, 0))
        .rejects.toThrow('Game not found');
    });

    it('should throw error if game is complete', async () => {
      mockDb.get.mockResolvedValue({ status: 'COMPLETE' });
      mockDb.all.mockResolvedValue([]);

      await expect(gameService.validateMove('123', 'X', 0, 0))
        .rejects.toThrow('Game is already complete');
    });

    it('should throw error if not player\'s turn', async () => {
      mockDb.get.mockResolvedValue({ 
        status: 'IN_PROGRESS',
        currentPlayer: 'O'
      });
      mockDb.all.mockResolvedValue([]);
      
      await expect(gameService.validateMove('123', 'X', 0, 0))
        .rejects.toThrow('Not your turn');
    });

    it('should throw error if position already taken', async () => {
      mockDb.get
        .mockResolvedValueOnce({ status: 'IN_PROGRESS', currentPlayer: 'X' })
        .mockResolvedValueOnce({ id: '123' }); // existing move
      mockDb.all.mockResolvedValue([]);
      
      await expect(gameService.validateMove('123', 'X', 0, 0))
        .rejects.toThrow('Position already taken');
    });
  });

  describe('makeMove', () => {
    it('should record move and update game state', async () => {
      mockDb.all.mockResolvedValue([]); // no moves for winner check

      const result = await gameService.makeMove('123', 'X', 0, 0);

      expect(result).toEqual(expect.objectContaining({
        id: '123',
        player: 'X',
        row: 0,
        col: 0,
        next_player: 'O',
        status: 'IN_PROGRESS',
        winner: null
      }));
    });

    it('should handle winning move', async () => {
      const winningMoves = [
        { player: 'X', row: 0, col: 0 },
        { player: 'X', row: 0, col: 1 },
        { player: 'X', row: 0, col: 2 }
      ];
      
      mockDb.all.mockResolvedValue(winningMoves);

      const result = await gameService.makeMove('123', 'X', 0, 2);

      expect(result).toEqual(expect.objectContaining({
        status: 'COMPLETE',
        winner: 'X'
      }));
    });

    it('should handle draw', async () => {
      const drawMoves = [
        { player: 'X', row: 0, col: 0 },
        { player: 'O', row: 1, col: 1 },
        { player: 'X', row: 0, col: 1 },
        { player: 'O', row: 0, col: 2 },
        { player: 'X', row: 2, col: 0 },
        { player: 'O', row: 1, col: 0 },
        { player: 'X', row: 1, col: 2 },
        { player: 'O', row: 2, col: 1 },
        { player: 'X', row: 2, col: 2 }
      ];
      
      mockDb.all.mockResolvedValue(drawMoves);

      const result = await gameService.makeMove('123', 'X', 2, 2);

      expect(result).toEqual(expect.objectContaining({
        status: 'COMPLETE',
        winner: 'DRAW'
      }));
    });
  });
}); 