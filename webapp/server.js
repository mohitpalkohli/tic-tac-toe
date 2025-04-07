const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const gameRoutes = require('./routes/game');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database and start server
(async () => {
  try {
    // Create SQLite database connection
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    // Initialize database tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        player_x TEXT NOT NULL,
        player_o TEXT NOT NULL,
        current_player TEXT CHECK(current_player IN ('X', 'O')) NOT NULL,
        status TEXT CHECK(status IN ('IN_PROGRESS', 'COMPLETE')) NOT NULL,
        winner TEXT CHECK(winner IN ('X', 'O', 'DRAW')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS moves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        player TEXT CHECK(player IN ('X', 'O')) NOT NULL,
        row INTEGER CHECK(row BETWEEN 0 AND 2),
        col INTEGER CHECK(col BETWEEN 0 AND 2),
        move_number INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id)
      )
    `);

    console.log('Connected to SQLite database and initialized tables');

    // Middleware
    app.use(express.json());
    app.use(cors());

    // Make database instance available in requests
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Routes
    app.use('/api/games', gameRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})(); 