# tic-tac-toe
This is a toy version of a tic-tac-toe application in which two players in different browser windows can challenge one another to a game.

## AI Acknowledgement
This application was developed with the assistance of Cursor IDE. I designed and wrote the data model, strategy, and node.js APIs. I heavily used the Composer feature when creating the React UI since it is not an area of strength for me.

## [Option 1] Run the application directly
```
// Node server (runs on localhost:3000)
// Supported node version v22.14.0
cd /path/to/webapp
npm install
node server.js

// Frontend (redirects to localhost:3001)
cd /path/to/frontend
npm install
npm start
```

## [Option 2] Run the application in Docker
```
docker compose up -d
```

## Access the application
* Application UI: http://localhost:3001
* API documentation: http://localhost:3000/api-docs



## Using the application
![Screenshot of tic-tac-toe app](https://github.com/mohitpalkohli/tic-tac-toe/blob/main/App_screenshot.png)


1. Enter your username
2. You can view the games you're part of in the sidebar
3. Clicking on a current square marks your move as long as the game is in progress and it is your turn
4. Click "Change Player" to go back to the main menu
5. Click "New Game" to start a new game against another player

## Assumptions
* User authentication is not needed.
* The application will not remember which game the user last had selected when they re-enter the application.
* Long polling is appropriate for keeping current with the most recent game state.

## Future areas of improvement
* Polling: Server-side events or websockets would be more efficient
* User account creation and authentication
