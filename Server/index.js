// index.js
const http = require('http');
const url = require('url');
const users = require('./users.js'); 
const ranking = require('./ranking.js');
const gameModule = require('./game.js');

const PORT = 8008; 

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

const server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;

    // CORS
    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    if (request.method === 'GET' && pathname === '/update') {
        // 1. O ID do jogo é renomeado para 'gameID'
        const { game: gameID, nick } = parsedUrl.query; 
        
        if (!gameID || !nick) {
            response.writeHead(400, headers);
            response.end(JSON.stringify({ error: "Faltam argumentos para o update" }));
            return;
        }

        // 2. Usamos o nome 'gameModule' para a função
        gameModule.subscribeToGame(gameID, nick, response); 
        
        // 3. Remover a conexão quando o cliente fechar
        request.on('close', () => {
            // ANTES: gameModule.unsubscribeFromGame(gameID, nick);
            // AGORA: Chamamos a função que penaliza a saída
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
                    // --- ROTA DE REGISTO ---
                    case '/register':
                        // Validar se enviou nick e pass
                        if (!data.nick || !data.password) {
                            response.writeHead(400, headers);
                            response.end(JSON.stringify({ error: "Falta nick ou password" }));
                            return;
                        }

                        // Chamar a função do módulo users.js
                        const result = users.register(data.nick, data.password);
                        
                        // Responder com o status (200 ou 401) e a mensagem
                        if (result.error) {
                            response.writeHead(result.status, headers);
                            response.end(JSON.stringify({ error: result.error }));
                        } else {
                            response.writeHead(result.status, headers);
                            response.end(JSON.stringify({ })); // Objeto vazio {} como manda o enunciado para sucesso
                        }
                        break;
                    // ... (dentro do switch)

                    case '/ranking':
                        // O enunciado diz que se faltar group ou size, deve dar erro
                        if (data.group === undefined || data.size === undefined) {
                            response.writeHead(400, headers);
                            response.end(JSON.stringify({ error: "Falta group ou size" }));
                            return;
                        }

                        // Validar se são números válidos (opcional, mas recomendado)
                        if (isNaN(data.group) || isNaN(data.size)) {
                            response.writeHead(400, headers);
                            response.end(JSON.stringify({ error: "Argumentos inválidos" }));
                            return;
                        }

                        // Obter a lista processada pelo nosso módulo
                        const list = ranking.getRanking(data.group, data.size);

                        // Responder ao cliente
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
                            
                            // Só enviamos update se o jogo estiver cheio (2 jogadores)
                            if (gameObj && Object.keys(gameObj.players).length === 2) {
                                
                                // --- CORREÇÃO AQUI ---
                                // Criamos um objeto LIMPO, apenas com o que é pedido na imagem
                                const updateData = {
                                    pieces: gameObj.pieces,      // O tabuleiro
                                    initial: Object.keys(gameObj.players)[0],
                                    step: "from",               // O passo inicial
                                    turn: gameObj.turn,         // Quem joga
                                    players: gameObj.players    // Os nomes e cores
                                };

                                // Envia este objeto limpo
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
                            
                            // --- CORREÇÃO AQUI ---
                            // Construir o objeto limpo igual à imagem
                            const gameObj = rollResult.gameState;
                            const updateData = {
                                dice: gameObj.dice,       // Agora tem stickValues e keepPlaying
                                turn: gameObj.turn,
                                mustPass: gameObj.mustPass // null
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
                            
                            // Calcular dados da célula (linha/coluna)
                            let cellObj = null;
                            if (data.cell !== undefined && data.cell !== null && typeof data.cell === 'number') {
                                cellObj = {
                                    square: data.cell % gameObj.size,
                                    position: Math.floor(data.cell / gameObj.size)
                                };
                            }

                            // Calcular dados da seleção
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
                            // 1. Resposta ao pedido: Objeto Vazio {} (Igual à imagem)
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({}));
                            
                            // 2. Enviar Update: Mostrar que o turno mudou
                            const gameObj = passResult.gameState;
                            
                            const updateData = {
                            pieces: gameObj.pieces,
                            initial: Object.keys(gameObj.players)[0],
                            step: "from",
                            turn: gameObj.turn, // <--- Aqui vai o nome do PRÓXIMO jogador
                            players: gameObj.players,
                            // Opcional: Enviar dice a null ou nem enviar
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
                            // 1. Resposta ao pedido POST: Objeto vazio {} (Conforme imagem)
                            response.writeHead(200, headers);
                            response.end(JSON.stringify({ }));

                            // 2. Enviar Update (SSE): Apenas com a propriedade winner
                            // O leaveResult.winner já vem calculado corretamente (nome ou null)
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