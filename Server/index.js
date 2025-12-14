const http = require('http');
const url = require('url');
const users = require('./users.js'); 
const ranking = require('./ranking.js');
const gameModule = require('./game.js');

const PORT = 8109; 

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

const server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;

    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    if (request.method === 'GET' && pathname === '/update') {
        const { game: gameID, nick } = parsedUrl.query; 
        
        if (!gameID || !nick) {
            response.writeHead(400, headers);
            response.end(JSON.stringify({ error: "Faltam argumentos para o update" }));
            return;
        }

        gameModule.subscribeToGame(gameID, nick, response); 
        
        request.on('close', () => {
            gameModule.processDisconnect(gameID, nick);
        });

        response.write(":ok\n\n");
        return; 
    }

    if (request.method === 'POST') {
        let body = '';
        request.on('data', chunk => { body += chunk.toString(); });

        request.on('end', () => {
            try {
                const data = body ? JSON.parse(body) : {};

                switch(pathname) {
                    case '/register':
                        if (!data.nick || !data.password) {
                            response.writeHead(400, headers);
                            response.end(JSON.stringify({ error: "Falta nick ou password" }));
                            return;
                        }

                        const result = users.register(data.nick, data.password);
                        
                        if (result.error) {
                            response.writeHead(result.status, headers);
                            response.end(JSON.stringify({ error: result.error }));
                        } else {
                            response.writeHead(result.status, headers);
                            response.end(JSON.stringify({ }));
                        }
                        break;

                    case '/ranking':
                        if (data.group === undefined || data.size === undefined) {
                            response.writeHead(400, headers);
                            response.end(JSON.stringify({ error: "Falta group ou size" }));
                            return;
                        }
                        if (isNaN(data.group) || isNaN(data.size)) {
                            response.writeHead(400, headers);
                            response.end(JSON.stringify({ error: "Argumentos inválidos" }));
                            return;
                        }
                        const list = ranking.getRanking(data.group, data.size);
                        response.writeHead(200, headers);
                        response.end(JSON.stringify({ ranking: list }));
                        break;
                    
                    case '/join':
                        const joinResult = gameModule.join(data.group, data.size, data.nick, data.password);
                        if (joinResult.error) {
                            response.writeHead(joinResult.status, headers);
                            response.end(JSON.stringify({ error: joinResult.error }));
                        } else {
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({ game: joinResult.game }));
                        }
                        if (joinResult.game) {
                            const gameObj = gameModule.getGame(joinResult.game);
                            if (gameObj && Object.keys(gameObj.players).length === 2) {
                                const updateData = {
                                    pieces: gameObj.pieces,  
                                    initial: Object.keys(gameObj.players)[0],
                                    step: "from",            
                                    turn: gameObj.turn,  
                                    players: gameObj.players  
                                };
                                gameModule.sendUpdate(joinResult.game, updateData);
                            }
                        }
                        break;

                    case '/roll':
                        const rollResult = gameModule.processRoll(data.game, data.nick, data.password);
                        if (rollResult.error) {
                            response.writeHead(rollResult.status, headers);
                            response.end(JSON.stringify({ error: rollResult.error }));
                        } else {
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({ })); 
                            const gameObj = rollResult.gameState;
                            const updateData = {
                                dice: gameObj.dice,
                                turn: gameObj.turn,
                                mustPass: gameObj.mustPass
                            };
                            gameModule.sendUpdate(data.game, updateData);
                        }
                        break;

                    case '/notify':
                        const moveResult = gameModule.processMove(data.game, data.nick, data.password, data.cell);
                        if (moveResult.error) {
                            response.writeHead(moveResult.status, headers);
                            response.end(JSON.stringify({ error: moveResult.error }));
                        } else {
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({ }));
                            const gameObj = moveResult.gameState;
                            let cellObj = null;
                            if (data.cell !== undefined && data.cell !== null && typeof data.cell === 'number') {
                                cellObj = {
                                    square: data.cell % gameObj.size,
                                    position: Math.floor(data.cell / gameObj.size)
                                };
                            }
                            let selectedData = null;
                            if (gameObj.step === "to") {
                                selectedData = gameObj.destinations; 
                            } else {
                                selectedData = gameObj.selectedPiece; 
                            }
                            const updateData = {
                                pieces: gameObj.pieces,
                                initial: Object.keys(gameObj.players)[0],
                                step: gameObj.step,
                                turn: gameObj.turn,
                                players: gameObj.players,
                                dice: gameObj.dice,
                                selected: selectedData,
                                cell: cellObj,

                                winner: gameObj.winner 
                            };
                            gameModule.sendUpdate(data.game, updateData);
                        }
                        break;

                    case '/pass':
                        const passResult = gameModule.processPass(data.game, data.nick, data.password);
                        if (passResult.error) {
                            response.writeHead(passResult.status, headers);
                            response.end(JSON.stringify({ error: passResult.error }));
                        } else {
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({}));                            
                            const gameObj = passResult.gameState;
                            const updateData = {
                            pieces: gameObj.pieces,
                            initial: Object.keys(gameObj.players)[0],
                            step: "from",
                            turn: gameObj.turn, 
                            players: gameObj.players,
                            dice: null 
                        };
                            gameModule.sendUpdate(data.game, updateData);
                        }
                        break;

                    case '/leave':
                        const leaveResult = gameModule.processLeave(data.game, data.nick, data.password);
                        if (leaveResult.error) {
                            response.writeHead(leaveResult.status, headers);
                            response.end(JSON.stringify({ error: leaveResult.error }));
                        } else {
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({ }));
                            const updateData = {
                                winner: leaveResult.winner
                            };

                            gameModule.sendUpdate(data.game, updateData);
                        }
                        break;
                        
                    default:
                        response.writeHead(404, headers);
                        response.end(JSON.stringify({ error: "Pedido desconhecido" }));
                }

            } catch (err) {
                console.error(err);
                response.writeHead(400, headers);
                response.end(JSON.stringify({ error: "Erro interno ou JSON inválido" }));
            }
        });
    } else {
        response.writeHead(404, headers);
        response.end(JSON.stringify({ error: "Método não suportado" }));
    }
});

server.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});