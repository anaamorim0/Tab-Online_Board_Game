# Tâb — Online Board Game

Web Technologies course project for 2025/2026, developed in the Computer Science Bachelor's degree.

This project is a web implementation of **Tâb**, a traditional Egyptian/North African strip board game played with throwing sticks (here simulated as dice). It supports both local play (against another human or against an AI with adjustable difficulty) and online multiplayer, with user accounts, real-time game updates, and a ranking system.

## Game description

Tâb is played on a board with 4 rows and a variable number of columns (7, 9, 11, 13, or 15). Each player starts with one row of pieces on opposite ends of the board, and pieces race around the board capturing opponents along the way. Movement is determined by a stick/dice roll (1, 4, and 6 grant an extra turn), and a piece can only start moving with a roll of 1 ("Tâb"). The first player to leave the opponent with no pieces on the board wins.

Full rules (movement, captures, turn passing, etc.) are described in-app, in the "Regras" (Rules) menu.

## Repository structure

### `1&2Parte/` — Frontend (client)

| File | Description |
|---|---|
| `index.html` | Main page: game board, login, settings, rankings, and rules menus. |
| `script.js` | Client-side game logic: board rendering, local play (PvP and vs AI), UI interactions and menus. |
| `style.css` | Styling for the board, menus, and overall game UI. |
| `server.js` | Client-side networking layer: handles communication with the backend (register, join, roll, move, pass, leave, ranking) and listens to real-time game updates via Server-Sent Events. |

### `Server/` — Backend (Node.js)

| File | Description |
|---|---|
| `index.js` | HTTP server entry point: routes requests to the corresponding endpoints (`/register`, `/join`, `/roll`, `/notify`, `/pass`, `/leave`, `/ranking`, `/update`) and sets up Server-Sent Events for real-time updates. |
| `game.js` | Core game engine: board initialization, move validation, dice rolls, piece movement and capture rules, turn management, win detection, and online game lifecycle (join/leave/disconnect handling). |
| `users.js` | User management: registration and password validation (passwords are hashed before storage). |
| `ranking.js` | Computes and returns the top rankings for a given group and board size. |
| `games.json` | Persisted state of currently active online games. |
| `users.json` | Persisted registered users and their hashed passwords. |
| `rankings.json` | Persisted player statistics (victories/games) used for the ranking system. |

## Modes of play

- **Local — Player vs Player:** two players share the same browser/device.
- **Local — Player vs AI:** play against a computer opponent with three difficulty levels (Easy, Medium, Hard).
- **Online — Player vs Player:** after logging in, players are matched into an online game on a shared server, with moves synchronized in real time via Server-Sent Events (SSE).

## How to run

1. Clone the repository:
   ```bash
   git clone https://github.com/anaamorim0/Web-Technologies_Project.git
   cd Web-Technologies_Project
   ```

2. Start the backend server:
   ```bash
   cd Server
   node index.js
   ```
   The server will start listening on port `8109` by default.

3. Serve the frontend (from `1&2Parte/`), for example using a simple local HTTP server:
   ```bash
   cd "1&2Parte"
   npx serve .
   ```
   Then open `index.html` in your browser.

4. In the in-game settings menu, select the server address and port matching where the backend is running, then choose the board size and game mode.

## Technologies

- HTML5 / CSS3 / JavaScript (frontend)
- Node.js (backend, using the built-in `http` module — no external frameworks)
- Server-Sent Events (SSE) for real-time game updates
- JSON files for simple persistence (users, games, rankings)

