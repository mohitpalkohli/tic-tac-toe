const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const gameRoutes = require('./routes/game');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

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
        playerX TEXT NOT NULL,
        playerO TEXT NOT NULL,
        currentPlayer TEXT CHECK(currentPlayer IN ('X', 'O')) NOT NULL,
        status TEXT CHECK(status IN ('IN_PROGRESS', 'COMPLETE')) NOT NULL,
        winner TEXT CHECK(winner IN ('X', 'O', 'DRAW')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS moves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gameId TEXT NOT NULL,
        player TEXT CHECK(player IN ('X', 'O')) NOT NULL,
        row INTEGER CHECK(row BETWEEN 0 AND 2),
        col INTEGER CHECK(col BETWEEN 0 AND 2),
        FOREIGN KEY (gameId) REFERENCES games(id)
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

    // Load OpenAPI spec
    const openApiSpec = YAML.load(path.join(__dirname, './docs/openapi.yaml'));
    console.log(path.join(__dirname, './docs/openapi.yaml'));

    app.use('/api/games', gameRoutes);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

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