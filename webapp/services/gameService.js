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
      'INSERT INTO games (id, player_x, player_o, current_player, status) VALUES (?, ?, ?, ?, ?)',
      [gameId, playerX, playerO, 'X', 'IN_PROGRESS']
    );
    
    return {
      id: gameId,
      player_x: playerX,
      player_o: playerO,
      current_player: 'X',
      status: 'IN_PROGRESS',
      winner: null
    };
  }

  async getGameById(gameId) {
    return await this.db.get('SELECT * FROM games WHERE id = ?', [gameId]);
  }

  async getAllGames() {
    return await this.db.all('SELECT * FROM games ORDER BY created_at DESC');
  }

  async getGamesByPlayer(playerName) {
    return await this.db.all(
      `SELECT * FROM games 
       WHERE player_x = ? OR player_o = ? 
       ORDER BY created_at DESC`,
      [playerName, playerName]
    );
  }

  async validateMove(gameId, player, row, col) {
    const game = await this.getGameById(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    if (game.status !== 'IN_PROGRESS') {
      throw new Error('Game is already complete');
    }
    if ((game.current_player == 'X' && game.player_x !== player)
      || (game.current_player == 'O' && game.player_o !== player)) {
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
      'SELECT * FROM moves WHERE game_id = ? AND row = ? AND col = ?',
      [gameId, row, col]
    );
  }

  async getAllMovesForGame(gameId) {
    return await this.db.all(
      'SELECT player, row, col FROM moves WHERE game_id = ?',
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
    const result = await this.db.get(
      'SELECT COUNT(*) as count FROM moves WHERE game_id = ?',
      [gameId]
    );

    const moveNumber = result.count + 1;
    const nextPlayer = player === 'X' ? 'O' : 'X';

    await this.recordMove(gameId, player, row, col, moveNumber);

    const moves = await this.getAllMovesForGame(gameId);
    const gameResult = this.checkWinner(moves);

    if (gameResult) {
      await this.db.run(
        'UPDATE games SET status = ?, winner = ?, current_player = ? WHERE id = ?',
        ['COMPLETE', gameResult, player, gameId]
      );

      return {
        id: gameId,
        move_number: moveNumber,
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
        move_number: moveNumber,
        player,
        row,
        col,
        next_player: nextPlayer,
        status: 'IN_PROGRESS',
        winner: null
      };
    }
  }

  async recordMove(gameId, player, row, col, moveNumber) {
    await this.db.run(
      'INSERT INTO moves (game_id, player, row, col, move_number) VALUES (?, ?, ?, ?, ?)',
      [gameId, player, row, col, moveNumber]
    );
  }

  async updateCurrentPlayer(gameId, nextPlayer) {
    await this.db.run(
      'UPDATE games SET current_player = ? WHERE id = ?',
      [nextPlayer, gameId]
    );
  }
}

module.exports = GameService; 