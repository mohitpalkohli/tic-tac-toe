const { v4: uuidv4 } = require('uuid');

const WIN_PATTERNS = [
  // Rows
  [[0,0], [0,1], [0,2]],
  [[1,0], [1,1], [1,2]],
  [[2,0], [2,1], [2,2]],
  // Columns
  [[0,0], [1,0], [2,0]],
  [[0,1], [1,1], [2,1]],
  [[0,2], [1,2], [2,2]],
  // Diagonals
  [[0,0], [1,1], [2,2]],
  [[0,2], [1,1], [2,0]]
];

class GameService {
  constructor(db) {
    this.db = db;
  }

  async createGame(playerX, playerO) {
    const gameId = uuidv4();
    await this.db.run(
      'INSERT INTO games (id, playerX, playerO, currentPlayer, status) VALUES (?, ?, ?, ?, ?)',
      [gameId, playerX, playerO, 'X', 'IN_PROGRESS']
    );
    
    return {
      id: gameId,
      playerX,
      playerO,
      currentPlayer: 'X',
      status: 'IN_PROGRESS',
      winner: null
    };
  }

  async getGameById(gameId) {
    const game = await this.db.get('SELECT * FROM games WHERE id = ?', [gameId]);
    if (game) {
      game.board = await this.getBoardForGame(game);
    }
    return game;
  }

  async getBoardForGame(game) {
    const board = [[null, null, null], [null, null, null], [null, null, null]];
    if (!game) {
      return board;
    }
    const moves = await this.db.all('SELECT * FROM moves WHERE gameId = ?', [game.id]);
    for (const move of moves) {
      board[move.row][move.col] = move.player;
    }
    return board;
  }

  async getAllGames() {
    const games = await this.db.all('SELECT * FROM games ORDER BY createdAt DESC');
    for (const game of games) {
      game.board = await this.getBoardForGame(game);
    }
    return games;
  }

  async getGamesByPlayer(playerName) {
    const games = await this.db.all(
      `SELECT * FROM games 
       WHERE playerX = ? OR playerO = ? 
       ORDER BY createdAt DESC`,
      [playerName, playerName]
    );
    for (const game of games) {
      game.board = await this.getBoardForGame(game);
    }
    return games;
  }

  async validateMove(gameId, player, row, col) {
    const game = await this.getGameById(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    if (game.status !== 'IN_PROGRESS') {
      throw new Error('Game is already complete');
    }
    if (game.currentPlayer !== player) {
      throw new Error('Not your turn');
    }

    const existingMove = await this.getMoveAtPosition(gameId, row, col);
    if (existingMove) {
      throw new Error('Position already taken');
    }

    return game;
  }

  async getMoveAtPosition(gameId, row, col) {
    return await this.db.get(
      'SELECT * FROM moves WHERE gameId = ? AND row = ? AND col = ?',
      [gameId, row, col]
    );
  }

  async getAllMovesForGame(gameId) {
    return await this.db.all(
      'SELECT player, row, col FROM moves WHERE gameId = ?',
      [gameId]
    );
  }

  checkWinner(moves) {
    // Create a board representation
    const board = Array(3).fill(null).map(() => Array(3).fill(null));
    moves.forEach(move => {
      board[move.row][move.col] = move.player;
    });

    // Check each win pattern
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a[0]][a[1]] && 
          board[a[0]][a[1]] === board[b[0]][b[1]] && 
          board[a[0]][a[1]] === board[c[0]][c[1]]) {
        return board[a[0]][a[1]]; // Return the winning player
      }
    }

    // Check for draw. We can probably optimize this later since a draw could be seen earlier
    if (moves.length === 9) {
      return 'DRAW';
    }

    return null; // no winner or draw
  }

  async makeMove(gameId, player, row, col) {
    await this.recordMove(gameId, player, row, col);

    const moves = await this.getAllMovesForGame(gameId);
    const gameResult = this.checkWinner(moves);
    const nextPlayer = player === 'X' ? 'O' : 'X';

    if (gameResult) {
      await this.db.run(
        'UPDATE games SET status = ?, winner = ?, currentPlayer = ? WHERE id = ?',
        ['COMPLETE', gameResult, player, gameId]
      );

      return {
        id: gameId,
        player,
        row,
        col,
        next_player: nextPlayer,
        status: 'COMPLETE',
        winner: gameResult
      };
    } else {
      await this.updateCurrentPlayer(gameId, nextPlayer);
      
      return {
        id: gameId,
        player,
        row,
        col,
        next_player: nextPlayer,
        status: 'IN_PROGRESS',
        winner: null
      };
    }
  }

  async recordMove(gameId, player, row, col) {
    await this.db.run(
      'INSERT INTO moves (gameId, player, row, col) VALUES (?, ?, ?, ?)',
      [gameId, player, row, col]
    );
  }

  async updateCurrentPlayer(gameId, nextPlayer) {
    await this.db.run(
      'UPDATE games SET currentPlayer = ? WHERE id = ?',
      [nextPlayer, gameId]
    );
  }
}

module.exports = GameService; 