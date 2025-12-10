const SERVER_URL = "http://twserver.alunos.dcc.fc.up.pt:8008";
const GROUP_ID = 9;

// Usa SEMPRE o mesmo OnlineState que vem do server.js
const OnlineState = window.OnlineState || (window.OnlineState = {
    nick: null,
    password: null,
    game: null
});

window.OnlineState = OnlineState;

let updateSource = null;

async function postJSON(endpoint, body) {
    const response = await fetch(`${SERVER_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (data.error) {
        throw new Error(data.error);
    }

    return data;
}

// Register
async function registerUser(nickArg, passArg) {
    const rawNick = (typeof nickArg === "string")
        ? nickArg
        : (nickArg && typeof nickArg.value === "string" ? nickArg.value : "");

    const rawPass = (typeof passArg === "string")
        ? passArg
        : (passArg && typeof passArg.value === "string" ? passArg.value : "");

    const cleanNick = rawNick.trim();
    const cleanPass = rawPass.trim();


    if (!cleanNick && !cleanPass) {
        throw new Error("Preencha o username e a password.");
    }

    if (!cleanNick) {
        throw new Error("Preencha o username.");
    }

    if (!cleanPass) {
        throw new Error("Preencha a password.");
    }

    const body = {
        nick: cleanNick,
        password: cleanPass
    };

    const result = await postJSON("register", body);

    OnlineState.nick = cleanNick;
    OnlineState.password = cleanPass;

    return result;
}

window.registerUser = registerUser;



// Join
async function joinGame(size) {
    const nick = OnlineState.nick;
    const password = OnlineState.password;

    if (!nick || !password) {
        throw new Error("Tem de iniciar sessão antes de jogar online.");
    }

    const boardSize = Number(size);
    if (!Number.isInteger(boardSize) || boardSize <= 0) {
        throw new Error("Tamanho de tabuleiro inválido.");
    }

    const sizeStr = boardSize < 10 ? `0${boardSize}` : `${boardSize}`;
    
    const dynamicGroup = parseInt(`${GROUP_ID}${sizeStr}`); 

    const body = {
        group: dynamicGroup,
        nick: nick,
        password: password,
        size: boardSize
    };

    const result = await postJSON("join", body);

    if (!result.game) {
        throw new Error("Resposta inesperada do servidor em /join.");
    }

    OnlineState.game = String(result.game);

    return result.game;
}


function startUpdateListener() {
    if (!OnlineState.game || !OnlineState.nick) {
        return;
    }

    if (updateSource) {
        updateSource.close();
        updateSource = null;
    }

    const params = new URLSearchParams({
        game: OnlineState.game,
        nick: OnlineState.nick
    });

    const url = `${SERVER_URL}/update?${params.toString()}`;

    updateSource = new EventSource(url);

    updateSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            // <- chama a função no script.js
            handleServerUpdate(data);

        } catch (e) {
        }
    };

    updateSource.onerror = (err) => {
    };
}

function stopUpdateListener() {
    if (updateSource) {
        updateSource.close();
        updateSource = null;
    }
}


// Roll
async function rollGame() {
    const nick = OnlineState.nick;
    const password = OnlineState.password;
    const game = OnlineState.game;

    if (!nick || !password) {
        throw new Error("Tem de iniciar sessão antes de lançar os dados online.");
    }
    if (!game) {
        throw new Error("Não está em nenhum jogo online.");
    }

    const body = { nick, password, game };


    let result;
    try {
        result = await postJSON("roll", body);
    } catch (err) {
        throw err;
    }

    if (result.error) {
        // por ex: "Not your turn to play"
        throw new Error(result.error);
    }

    return result;
}

window.rollGame = rollGame;

// Pass
async function passGame() {
    const nick = OnlineState.nick;
    const password = OnlineState.password;
    const game = OnlineState.game;

    if (!nick || !password) {
        throw new Error("Tem de iniciar sessão antes de passar a vez online.");
    }
    if (!game) {
        throw new Error("Não está em nenhum jogo online.");
    }

    const body = { nick, password, game };


    let result;
    try {
        result = await postJSON("pass", body);   // POST /pass
    } catch (err) {
        throw err;
    }

    if (result.error) {
        throw new Error(result.error);
    }

    // Normalmente é {} – o novo estado (novo turno) vem depois no /update
    return result;
}

window.passGame = passGame;


// Notify 
async function notifyMove(cell) {
    if (!OnlineState.nick || !OnlineState.password) {
        throw new Error("Tem de iniciar sessão antes de jogar online.");
    }
    if (!OnlineState.game) {
        throw new Error("Não está em nenhum jogo online.");
    }

    if (!Number.isInteger(cell) || cell < 0) {
        throw new Error("cell inválido para notify: " + cell);
    }

    const body = {
        nick: OnlineState.nick,
        password: OnlineState.password,
        game: OnlineState.game,
        cell: cell
    };


    let result;
    try {
        result = await postJSON("notify", body);   // POST /notify
    } catch (err) {
        throw err;
    }

    if (result.error) {
        throw new Error(result.error);
    }

    return result;
}

window.notifyMove = notifyMove;


// Leave
async function leaveGame() {
    if (!OnlineState || !OnlineState.nick || !OnlineState.password) {
        return;
    }
    if (!OnlineState.game) {
        return;
    }

    const body = {
        nick: OnlineState.nick,
        password: OnlineState.password,
        game: OnlineState.game
    };

    let result;
    try {
        result = await postJSON("leave", body);
    } catch (err) {
        throw err;
    }

    if (result.error) {
        throw new Error(result.error);
    }


    return result;
}



window.leaveGame = leaveGame;
