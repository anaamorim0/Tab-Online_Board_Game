const fs = require('fs');
const crypto = require('crypto');
const users = require('./users.js');

const FILE_PATH = './games.json';
const RANKING_FILE = './rankings.json'; 

function getGames() {
    try {
        if (!fs.existsSync(FILE_PATH)) return [];
        return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    } catch (err) { return []; }
}

function saveGames(games) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(games, null, 2));
}

function generateGameID(nick, date) {
    const hash = crypto.createHash('md5');
    hash.update(nick + date);
    return hash.digest('hex');
}

const connectedClients = {}; 

function getGame(gameID) {
    const games = getGames();
    return games.find(g => g.gameID === gameID);
}

function subscribeToGame(gameID, nick, response) {
    if (!connectedClients[gameID]) {
        connectedClients[gameID] = {};
    }
    connectedClients[gameID][nick] = response;
    
    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const game = getGame(gameID);
    if (game && Object.keys(game.players).length === 2) {
        const updateData = {
            pieces: game.pieces,
            initial: Object.keys(game.players)[0],
            step: "from",
            turn: game.turn,
            players: game.players
        };
        response.write(`data: ${JSON.stringify(updateData)}\n\n`);
    }

    const keepAliveInterval = setInterval(() => {
        if (!response.finished) {
            response.write(":keepalive\n\n");
        }
    }, 30000);

    response.on('close', () => {
        clearInterval(keepAliveInterval);
    });
}


function sendUpdate(gameID, data) {
    const clients = connectedClients[gameID];
    if (!clients) return;

    const sseData = `data: ${JSON.stringify(data)}\n\n`;

    Object.values(clients).forEach(response => {
        if (!response.finished) {
            response.write(sseData);
        }
    });
}

function unsubscribeFromGame(gameID, nick) {
    if (connectedClients[gameID] && connectedClients[gameID][nick]) {
        delete connectedClients[gameID][nick];
        if (Object.keys(connectedClients[gameID]).length === 0) {
            delete connectedClients[gameID];
        }
    }
}

function join(group, size, nick, pass) {
    if (!users.validateUser(nick, pass)) return { error: "User inválido", status: 401 };
    
    const sizeNum = parseInt(size);
    const groupNum = parseInt(group);
    if (isNaN(sizeNum) || isNaN(groupNum)) return { error: "Invalid args", status: 400 };

    const games = getGames();

    const myExistingGame = games.find(g => g.group === groupNum && g.size === sizeNum && g.players[nick]);
    if (myExistingGame) return { game: myExistingGame.gameID, status: 200 };

    const gameToJoin = games.find(g => g.group === groupNum && g.size === sizeNum && Object.keys(g.players).length === 1 && !g.players[nick]);
    if (gameToJoin) {
        gameToJoin.players[nick] = "Red"; 
        gameToJoin.turn = Object.keys(gameToJoin.players)[0]; 
        saveGames(games);
        return { game: gameToJoin.gameID, status: 200 };
    } 
    
    const newID = generateGameID(nick, Date.now());
    const initialPieces = initializeBoard(sizeNum); 

    const newGame = {
        gameID: newID,
        group: groupNum,
        size: sizeNum,
        players: { [nick]: "Blue" },
        turn: null, 
        pieces: initialPieces, 
        dice: null,
        step: "from",
        selectedPiece: null,
        destinations: null
    };

    games.push(newGame);
    saveGames(games);
    
    setTimeout(() => {
        const currentGames = getGames();
        const idx = currentGames.findIndex(g => g.gameID === newID);
        if (idx !== -1 && Object.keys(currentGames[idx].players).length === 1) {
            sendUpdate(newID, { winner: null });
            currentGames.splice(idx, 1);
            saveGames(currentGames);
        }
    }, 120000);

    return { game: newID, status: 200 };
}

function initializeBoard(cols) {
    const rows = 4;
    const totalCells = rows * cols;
    const pieces = new Array(totalCells).fill(null);

    for (let i = 0; i < cols; i++) {
        pieces[i] = { color: "Blue", inMotion: false, reachedLastRow: false };
    }
    const startRed = 3 * cols;
    for (let i = startRed; i < totalCells; i++) {
        pieces[i] = { color: "Red", inMotion: false, reachedLastRow: false };
    }
    return pieces;
}

function indexToRC(index, cols) {
    const rowFromBottom = Math.floor(index / cols);
    const r = 3 - rowFromBottom; 
    const dir = (r === 3 || r === 1) ? 1 : -1;
    const posInRow = index % cols;
    const c = (dir === 1) ? posInRow : (cols - 1 - posInRow);
    return { r, c };
}

function rcToIndex(r, c, cols) {
    const rowFromBottom = 3 - r;
    const dir = (r === 3 || r === 1) ? 1 : -1;
    const posInRow = (dir === 1) ? c : (cols - 1 - c);
    return rowFromBottom * cols + posInRow;
}

function calculateDestinations(game, sourceIdx) {
    const piece = game.pieces[sourceIdx];
    if (!piece) return [];
    
    const moves = game.dice.value;
    const cols = game.size;
    const { r: startR, c: startC } = indexToRC(sourceIdx, cols);
    const owner = (piece.color === "Blue") ? "A" : "V";

    if (!piece.inMotion && moves !== 1) return [];

    const getEnds = (cr, cc, steps) => {
        if (steps === 0) return [{r: cr, c: cc}];

        const paths = [];
        const dir = (cr === 3 || cr === 1) ? 1 : -1;
        const nextC = cc + dir;
        const canMoveSide = (nextC >= 0 && nextC < cols);

        if (canMoveSide) {
             return getEnds(cr, nextC, steps - 1);
        }

        if (owner === "A") { 
             if (cr === 3) paths.push(...getEnds(2, cc, steps - 1));
             else if (cr === 2) paths.push(...getEnds(1, cc, steps - 1));
             else if (cr === 1) {
                 paths.push(...getEnds(0, cc, steps - 1)); 
                 paths.push(...getEnds(2, cc, steps - 1)); 
             }
             else if (cr === 0) paths.push(...getEnds(1, cc, steps - 1));
        } else { 
             if (cr === 0) paths.push(...getEnds(1, cc, steps - 1));
             else if (cr === 1) paths.push(...getEnds(2, cc, steps - 1));
             else if (cr === 2) {
                 paths.push(...getEnds(3, cc, steps - 1)); 
                 paths.push(...getEnds(1, cc, steps - 1)); 
             }
             else if (cr === 3) paths.push(...getEnds(2, cc, steps - 1));
        }
        return paths;
    };

    const possibleEnds = getEnds(startR, startC, moves);
    
    const validIndices = [];
    possibleEnds.forEach(pos => {
        if (pos.r === undefined) return;
        const idx = rcToIndex(pos.r, pos.c, cols);
        const targetPiece = game.pieces[idx];
        if (!targetPiece || targetPiece.color !== piece.color) {
            if (!validIndices.includes(idx)) validIndices.push(idx);
        }
    });

    return validIndices;
}

function lancarPaus() {
    const sticks = [Math.random()<0.5, Math.random()<0.5, Math.random()<0.5, Math.random()<0.5];
    const brancos = sticks.filter(s => s).length;
    const valor = brancos === 0 ? 6 : brancos;
    return { stickValues: sticks, value: valor, keepPlaying: (valor===1||valor===4||valor===6) };
}

function playerHasValidMoves(game, nick, diceValue) {
    const playerColor = game.players[nick];
    for (let i = 0; i < game.pieces.length; i++) {
        const piece = game.pieces[i];
        if (piece && piece.color === playerColor) {
            if (!piece.inMotion) {
                if (diceValue === 1) return true;
            } else {
                return true;
            }
        }
    }
    return false;
}

function processRoll(gameID, nick, pass) {
    if (!users.validateUser(nick, pass)) return { error: "User inválido", status: 401 };
    const games = getGames();
    const game = games.find(g => g.gameID === gameID);
    if (!game) return { error: "Not found", status: 404 };
    
    if (game.turn !== nick) return { error: "Not your turn to play", status: 400 };

    if (game.dice) {
        const hasMoves = playerHasValidMoves(game, nick, game.dice.value);
        
        if (hasMoves) {
             return { error: "You already rolled the dice and have valid moves", status: 400 };
        }

        if (!game.dice.keepPlaying) {
             return { error: "You cannot roll again, you must pass", status: 400 };
        }
    }

    game.dice = lancarPaus();
    
    let hasMoves = false;
    const myColor = game.players[nick];
    for(let i=0; i<game.pieces.length; i++) {
        const p = game.pieces[i];
        if(p && p.color === myColor) {
             const dests = calculateDestinations(game, i);
             if (dests.length > 0) { hasMoves = true; break; }
        }
    }

    if (!hasMoves && !game.dice.keepPlaying) {
        game.mustPass = nick;
    } else {
        game.mustPass = null;
    }
    
    game.step = "from";
    game.selectedPiece = null;
    game.destinations = null; 

    saveGames(games);
    return { status: 200, gameState: game };
}

function processMove(gameID, nick, pass, cell) {
    if (!users.validateUser(nick, pass)) return { error: "User inválido", status: 401 };

    const games = getGames();
    const game = games.find(g => g.gameID === gameID);
    if (!game) return { error: "Jogo não encontrado", status: 404 };

    if (game.turn !== nick) return { error: "not your turn to play", status: 400 };
    
    if (typeof cell !== 'number' || !Number.isInteger(cell)) return { error: "cell is not an integer", status: 400 };
    
    if (cell < 0) return { error: "cell is negative", status: 400 };

    const playerColor = game.players[nick];
    if (!game.step) game.step = "from";

    if (game.step === "from") {
        const sourceIdx = cell;
        const piece = game.pieces[sourceIdx];

        if (!piece || piece.color !== playerColor) return { error: "Not your piece", status: 400 };

        const destinations = calculateDestinations(game, sourceIdx);
        if (destinations.length === 0) {
            return { error: "No valid moves for this piece", status: 400 };
        }
        
        if (destinations.length === 1) {
            return executeMove(game, games, sourceIdx, destinations[0], nick);
        }

        game.selectedPiece = sourceIdx;
        game.destinations = destinations; 
        game.step = "to"; 
        saveGames(games);
        return { status: 200, gameState: game };
    } 

    else if (game.step === "to") {
        const targetIdx = cell;
        const sourceIdx = game.selectedPiece;
        
        const targetPiece = game.pieces[targetIdx];
        if (targetPiece && targetPiece.color === playerColor) {
            return { error: "cannot capture to your own piece", status: 400 };
        }

        if (!game.destinations || !game.destinations.includes(targetIdx)) {
            return { error: "Invalid move destination", status: 400 };
        }

        return executeMove(game, games, sourceIdx, targetIdx, nick);
    }
    
    return { error: "Invalid step", status: 400 };
}


function executeMove(game, games, sourceIdx, targetIdx, nick) {
    const piece = game.pieces[sourceIdx];
    
    game.pieces[targetIdx] = piece;
    game.pieces[sourceIdx] = null;
    
    if (game.pieces[targetIdx]) {
        game.pieces[targetIdx].inMotion = true;

        const cols = game.size;
        const { r: targetR } = indexToRC(targetIdx, cols);

        if (piece.color === "Blue" && targetR === 0) {
            game.pieces[targetIdx].reachedLastRow = true;
        }
        else if (piece.color === "Red" && targetR === 3) {
            game.pieces[targetIdx].reachedLastRow = true;
        }
    }

    const blueCount = game.pieces.filter(p => p && p.color === "Blue").length;
    const redCount = game.pieces.filter(p => p && p.color === "Red").length;
    
    let winnerNick = null;
    let loserNick = null;

    if (blueCount === 0) {
        winnerNick = Object.keys(game.players).find(k => game.players[k] === "Red");
        loserNick = Object.keys(game.players).find(k => game.players[k] === "Blue");
    } else if (redCount === 0) {
        winnerNick = Object.keys(game.players).find(k => game.players[k] === "Blue");
        loserNick = Object.keys(game.players).find(k => game.players[k] === "Red");
    }

    if (winnerNick) {
        game.winner = winnerNick;
        
        if (typeof updateRankingStats === "function") {
            updateRankingStats(winnerNick, loserNick, game.group, game.size);
        }

        const gameIndex = games.indexOf(game);
        if (gameIndex !== -1) games.splice(gameIndex, 1);
        saveGames(games);

        return { status: 200, gameState: game };
    }

    const canPlayAgain = game.dice && game.dice.keepPlaying;
    if (canPlayAgain) {
        game.turn = nick; 
    } else {
        const players = Object.keys(game.players);
        game.turn = players.find(p => p !== nick) || players[0];
    }

    game.dice = null;
    game.step = "from";
    game.selectedPiece = null;
    game.destinations = null;

    saveGames(games);
    return { status: 200, gameState: game };
}

function processPass(gameID, nick, pass) {
    if (!users.validateUser(nick, pass)) return { error: "User inválido", status: 401 };
    
    const games = getGames();
    const game = games.find(g => g.gameID === gameID);
    if (!game) return { error: "Jogo não encontrado", status: 404 };

    if (game.turn !== nick) {
        return { error: "Not your turn to play", status: 400 };
    }

    if (!game.dice) {
         return { error: "Wait for dice roll", status: 400 };
    }

    if (game.dice.keepPlaying) {
        return { 
            error: "You already rolled the dice but can roll it again", 
            status: 400 
        };
    }

    const hasMoves = playerHasValidMoves(game, nick, game.dice.value);
    if (hasMoves) {
        return { 
            error: "You already rolled the dice and have valid moves", 
            status: 400 
        };
    }

    const playersList = Object.keys(game.players);
    const currentIndex = playersList.indexOf(nick);
    const nextIndex = (currentIndex + 1) % playersList.length;
    
    game.turn = playersList[nextIndex];
    game.dice = null;
    game.mustPass = null;
    game.step = "from"; 

    saveGames(games);
    return { status: 200, gameState: game };
}

function getRankings() {
    try {
        if (!fs.existsSync(RANKING_FILE)) return [];
        return JSON.parse(fs.readFileSync(RANKING_FILE, 'utf8'));
    } catch (e) { return []; }
}

function saveRankings(data) {
    fs.writeFileSync(RANKING_FILE, JSON.stringify(data, null, 2));
}

function updateRankingStats(winnerNick, loserNick, group, size) {
    const rankings = getRankings();

    const updatePlayer = (nick, isWinner) => {
        let entry = rankings.find(r => r.nick === nick && r.group === group && r.size === size);
        
        if (!entry) {
            entry = { 
                nick: nick, 
                victories: 0, 
                games: 0, 
                group: group, 
                size: size 
            };
            rankings.push(entry);
        }

        entry.games += 1;
        if (isWinner) {
            entry.victories += 1;
        }
    };

    if (winnerNick) updatePlayer(winnerNick, true);
    if (loserNick) updatePlayer(loserNick, false);

    saveRankings(rankings);
}

function processLeave(gameID, nick, pass) {
    if (!users.validateUser(nick, pass)) return { error: "User inválido", status: 401 };

    const games = getGames();
    const gameIndex = games.findIndex(g => g.gameID === gameID);
    
    if (gameIndex === -1) return { error: "Jogo não encontrado", status: 404 };

    const game = games[gameIndex];
    
    let winner = null;
    const playersList = Object.keys(game.players);

    if (playersList.length === 2) {
        winner = playersList.find(p => p !== nick);
        const loser = nick;

        updateRankingStats(winner, loser, game.group, game.size);
    } 
    else {
        winner = null;
    }

    games.splice(gameIndex, 1);
    saveGames(games);

    return { status: 200, winner: winner };
}

function processDisconnect(gameID, nick) {
    const games = getGames();
    const gameIndex = games.findIndex(g => g.gameID === gameID);
    
    if (gameIndex !== -1) {
        const game = games[gameIndex];
        const playersList = Object.keys(game.players);

        if (game.players[nick]) {
            
            let winner = null;

            if (playersList.length === 2) {
                winner = playersList.find(p => p !== nick);
                
                if (typeof updateRankingStats === "function") {
                    updateRankingStats(winner, nick, game.group, game.size);
                }

                sendUpdate(gameID, { winner: winner });
            } 

            games.splice(gameIndex, 1);
            saveGames(games);
        }
    }

    unsubscribeFromGame(gameID, nick);
}

module.exports = { 
    getGame, 
    join, 
    sendUpdate, 
    subscribeToGame,
    unsubscribeFromGame,
    processRoll,
    processMove,
    processPass,
    processLeave,
    processDisconnect
};