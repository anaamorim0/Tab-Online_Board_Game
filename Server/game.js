// game.js
const fs = require('fs');
const crypto = require('crypto');
const users = require('./users.js'); // Para validar passwords

const FILE_PATH = './games.json';
const RANKING_FILE = './rankings.json'; 

function getGames() {
    try {
        if (!fs.existsSync(FILE_PATH)) return [];
        return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    } catch (err) { return []; }
}

// Guardar todos os jogos no ficheiro
function saveGames(games) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(games, null, 2));
}

function generateGameID(nick, date) {
    const hash = crypto.createHash('md5');
    hash.update(nick + date);
    return hash.digest('hex');
}

// --- GESTÃO DE CONEXÕES (Server-Sent Events) ---

const connectedClients = {}; // Estrutura: { gameID: { nick1: response, nick2: response } }
// Adiciona esta função nova para podermos usar no index.js
function getGame(gameID) {
    const games = getGames();
    return games.find(g => g.gameID === gameID);
}

function subscribeToGame(gameID, nick, response) {
    if (!connectedClients[gameID]) {
        connectedClients[gameID] = {};
    }
    connectedClients[gameID][nick] = response;
    
    // Cabeçalhos SSE normais
    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // 1. Enviar estado imediato SE o jogo já estiver cheio (para o 2º jogador não ficar à espera)
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

    // --- CORREÇÃO: HEARTBEAT (KEEP-ALIVE) ---
    // Envia um comentário vazio a cada 30 segundos.
    // O browser ignora linhas começadas por ':', mas isto impede a conexão de cair.
    const keepAliveInterval = setInterval(() => {
        // Só escreve se a conexão ainda estiver aberta
        if (!response.finished) {
            response.write(":keepalive\n\n");
        }
    }, 30000); // 30 segundos

    // IMPORTANTE: Parar o intervalo quando o cliente se desconecta
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
    
    // ... (validações group/size) ...
    const sizeNum = parseInt(size);
    const groupNum = parseInt(group);
    if (isNaN(sizeNum) || isNaN(groupNum)) return { error: "Invalid args", status: 400 };

    const games = getGames();

    // ... (procurar jogo existente) ...
    const myExistingGame = games.find(g => g.group === groupNum && g.size === sizeNum && g.players[nick]);
    if (myExistingGame) return { game: myExistingGame.gameID, status: 200 };

    // ... (join jogo existente) ...
    const gameToJoin = games.find(g => g.group === groupNum && g.size === sizeNum && Object.keys(g.players).length === 1 && !g.players[nick]);
    if (gameToJoin) {
        gameToJoin.players[nick] = "Red"; 
        gameToJoin.turn = Object.keys(gameToJoin.players)[0]; 
        saveGames(games);
        return { game: gameToJoin.gameID, status: 200 };
    } 
    
    // Criar Novo
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
        destinations: null // <--- NOVO: Guarda as opções [28, 10]
    };

    games.push(newGame);
    saveGames(games);
    
    // Timeout (simplificado)
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
    // No array linear:
    // 0..cols-1 são a linha 3 (Fundo/Azul)
    // ...
    // 3*cols..end são a linha 0 (Topo/Vermelho)
    // (Isto baseia-se na tua lógica de initializeBoard onde Blue está em 0..cols-1)
    
    // CORREÇÃO IMPORTANTE BASEADA NO TEU INITIALIZEBOARD:
    // O teu initializeBoard mete Blue nos índices 0..cols-1.
    // O script assume que Blue começa na Row 3.
    // Logo, índices 0..cols-1 correspondem a Row 3.
    // Indices 3*cols..end correspondem a Row 0.
    
    const rowFromBottom = Math.floor(index / cols); // 0=Row3, 3=Row0
    const r = 3 - rowFromBottom; 
    
    const dir = (r === 3 || r === 1) ? 1 : -1; // 1 = Esq->Dir, -1 = Dir->Esq
    
    const posInRow = index % cols;
    const c = (dir === 1) ? posInRow : (cols - 1 - posInRow);
    
    return { r, c };
}

// Converte {r, c} para índice linear
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
    // Iterar sobre pieces
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
    
    // Validar Turno
    if (game.turn !== nick) return { error: "Not your turn to play", status: 400 };

    // --- CORREÇÃO: Impedir re-roll ilegal ---
    if (game.dice) {
        // Se o dado já existe, verificamos se o jogador tem movimentos
        const hasMoves = playerHasValidMoves(game, nick, game.dice.value);
        
        // Se tem movimentos, é OBRIGADO a jogar, não pode lançar de novo
        if (hasMoves) {
             return { error: "You already rolled the dice and have valid moves", status: 400 };
        }
        
        // Se NÃO tem movimentos, só pode lançar se o dado permitir (keepPlaying: true)
        // Ex: Saiu 6 e está bloqueado -> Pode lançar.
        // Ex: Saiu 2 e está bloqueado -> Não pode lançar, tem de passar.
        if (!game.dice.keepPlaying) {
             return { error: "You cannot roll again, you must pass", status: 400 };
        }
    }

    // Se passou as verificações, lança o dado
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

    // 1. Validar Turno (Minúscula conforme imagem "Mover - jogadas inválidas")
    if (game.turn !== nick) return { error: "not your turn to play", status: 400 };
    
    // 2. Validar Inteiro
    if (typeof cell !== 'number' || !Number.isInteger(cell)) return { error: "cell is not an integer", status: 400 };
    
    // 3. Validar Negativo
    if (cell < 0) return { error: "cell is negative", status: 400 };

    const playerColor = game.players[nick];
    if (!game.step) game.step = "from";

    // --- FASE 1: FROM ---
    if (game.step === "from") {
        const sourceIdx = cell;
        const piece = game.pieces[sourceIdx];

        // Validar peça própria
        if (!piece || piece.color !== playerColor) return { error: "Not your piece", status: 400 };

        const destinations = calculateDestinations(game, sourceIdx);
        if (destinations.length === 0) {
            // Nota: A imagem não especifica este erro exato, mas "No valid moves" é standard.
            return { error: "No valid moves for this piece", status: 400 };
        }
        
        // Auto-Move ou Bifurcação
        if (destinations.length === 1) {
            return executeMove(game, games, sourceIdx, destinations[0], nick);
        }

        game.selectedPiece = sourceIdx;
        game.destinations = destinations; 
        game.step = "to"; 
        saveGames(games);
        return { status: 200, gameState: game };
    } 

    // --- FASE 2: TO ---
    else if (game.step === "to") {
        const targetIdx = cell;
        const sourceIdx = game.selectedPiece;
        
        // CORREÇÃO: Validar Captura Própria (Rigoroso)
        const targetPiece = game.pieces[targetIdx];
        if (targetPiece && targetPiece.color === playerColor) {
            // Se clicar numa peça sua, DEVE dar erro 400 (conforme imagem)
            return { error: "cannot capture to your own piece", status: 400 };
        }

        // Validar Destino
        if (!game.destinations || !game.destinations.includes(targetIdx)) {
            return { error: "Invalid move destination", status: 400 };
        }

        return executeMove(game, games, sourceIdx, targetIdx, nick);
    }
    
    return { error: "Invalid step", status: 400 };
}

// game.js -> Substituir a função executeMove existente por esta:

function executeMove(game, games, sourceIdx, targetIdx, nick) {
    const piece = game.pieces[sourceIdx];
    
    // 1. Mover a peça
    game.pieces[targetIdx] = piece;
    game.pieces[sourceIdx] = null;
    
    if (game.pieces[targetIdx]) {
        game.pieces[targetIdx].inMotion = true;

        // Atualizar se chegou à última linha (meta)
        const cols = game.size;
        const { r: targetR } = indexToRC(targetIdx, cols);

        if (piece.color === "Blue" && targetR === 0) {
            game.pieces[targetIdx].reachedLastRow = true;
        }
        else if (piece.color === "Red" && targetR === 3) {
            game.pieces[targetIdx].reachedLastRow = true;
        }
    }

    // 2. VERIFICAR VITÓRIA (O código que faltava!)
    // Contamos quantas peças sobraram de cada cor
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

    // Se alguém ganhou...
    if (winnerNick) {
        game.winner = winnerNick; // <--- Guardamos o vencedor aqui
        
        // Atualiza Ranking
        if (typeof updateRankingStats === "function") {
            updateRankingStats(winnerNick, loserNick, game.group, game.size);
        }

        // Apaga o jogo
        const gameIndex = games.indexOf(game);
        if (gameIndex !== -1) games.splice(gameIndex, 1);
        saveGames(games);

        return { status: 200, gameState: game };
    }

    // 3. Se ninguém ganhou, continua o jogo
    const canPlayAgain = game.dice && game.dice.keepPlaying;
    if (canPlayAgain) {
        game.turn = nick; 
    } else {
        const players = Object.keys(game.players);
        game.turn = players.find(p => p !== nick) || players[0];
    }

    // Limpezas de turno
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

    // Erro 1: Se saiu 1, 4, 6 (pode jogar de novo), não pode passar
    if (game.dice.keepPlaying) {
        return { 
            error: "You already rolled the dice but can roll it again", 
            status: 400 
        };
    }

    // CORREÇÃO (Erro 2): Se tem jogadas válidas, não pode passar
    const hasMoves = playerHasValidMoves(game, nick, game.dice.value);
    if (hasMoves) {
        return { 
            error: "You already rolled the dice and have valid moves", 
            status: 400 
        };
    }

    // Sucesso: Troca o turno
    const playersList = Object.keys(game.players);
    const currentIndex = playersList.indexOf(nick);
    const nextIndex = (currentIndex + 1) % playersList.length;
    
    game.turn = playersList[nextIndex];
    game.dice = null;
    game.mustPass = null;
    game.step = "from"; // Reset step

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

// Esta função recebe o vencedor e o perdedor e atualiza o JSON
function updateRankingStats(winnerNick, loserNick, group, size) {
    const rankings = getRankings();

    // Função auxiliar para atualizar ou criar um jogador
    const updatePlayer = (nick, isWinner) => {
        // Procura se este jogador já tem estatísticas neste grupo e tamanho
        let entry = rankings.find(r => r.nick === nick && r.group === group && r.size === size);
        
        if (!entry) {
            // Se não existe, cria do zero
            entry = { 
                nick: nick, 
                victories: 0, 
                games: 0, 
                group: group, 
                size: size 
            };
            rankings.push(entry);
        }

        // Atualiza os valores
        entry.games += 1;
        if (isWinner) {
            entry.victories += 1;
        }
    };

    // Só atualizamos se os nicks existirem
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

    // Cenário A: Jogo a decorrer (2 jogadores)
    if (playersList.length === 2) {
        winner = playersList.find(p => p !== nick); // Quem ficou ganhou
        const loser = nick; // Quem saiu perdeu

        // --- AQUI ESTÁ A CORREÇÃO MÁGICA ---
        // Antes de apagar o jogo, guardamos o resultado no ranking!
        updateRankingStats(winner, loser, game.group, game.size);
    } 
    else {
        winner = null;
    }

    // Agora sim, podemos apagar o jogo sem perder a história
    games.splice(gameIndex, 1);
    saveGames(games);

    return { status: 200, winner: winner };
}
// --- NOVA FUNÇÃO: Tratar desconexão como desistência ---
function processDisconnect(gameID, nick) {
    const games = getGames();
    const gameIndex = games.findIndex(g => g.gameID === gameID);
    
    // Se o jogo existe na base de dados
    if (gameIndex !== -1) {
        const game = games[gameIndex];
        const playersList = Object.keys(game.players);

        // Confirmar se o jogador que saiu faz parte deste jogo
        if (game.players[nick]) {
            
            let winner = null;

            // Se o jogo tinha 2 jogadores, o que ficou GANHA
            if (playersList.length === 2) {
                winner = playersList.find(p => p !== nick);
                
                // Atualizar Rankings (se tiveres a função updateRankingStats implementada)
                if (typeof updateRankingStats === "function") {
                    updateRankingStats(winner, nick, game.group, game.size);
                }

                // Avisar o sobrevivente que ganhou
                sendUpdate(gameID, { winner: winner });
            } 
            // Se só tinha 1 jogador, não há vencedor (cancelado)
            
            // APAGAR O JOGO
            games.splice(gameIndex, 1);
            saveGames(games);
        }
    }

    // Limpar a conexão da memória RAM
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