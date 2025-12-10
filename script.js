document.addEventListener("DOMContentLoaded", () => {
    const closedBox = document.getElementById("closedBox");
    const openWrap = document.getElementById("openWrap");
    const logo = document.getElementById("logo");
    const userButton = document.getElementById("userButton");
    const loginMenu = document.getElementById("loginMenu");
    const settingsButton = document.getElementById("settingsButton");
    const settingsMenu = document.getElementById("settingsMenu");
    const jogador = document.getElementById("jogador");
    const ia = document.getElementById("ia");
    const jogadorText = document.getElementById("jogadorText");
    const iaText = document.getElementById("iaText");
    const dadosWrap = document.getElementById("dadosWrap");
    const regrasButton = document.getElementById("regrasButton");
    const regrasMenu = document.getElementById("regrasMenu");
    const classButton = document.getElementById("classButton");
    const classMenu = document.getElementById("classMenu");
    const voltarButton = document.getElementById("voltarButton");
    const desistirButton = document.getElementById("desistirButton");
    const clearBtn = document.getElementById("clearButton");
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const buttonEntrar = document.getElementById("buttonEntrar");
    const loggedMenu = document.getElementById("loggedMenu");
    const loggedUsername = document.getElementById("loggedUsername");
    const logoutButton = document.getElementById("logoutButton");
    const sizeSelect = document.getElementById("sizeSelect");
    
    const settingsIcon = settingsButton.querySelector("img");
    const loginIcon = userButton.querySelector("img");
    const regrasIcon = regrasButton.querySelector("img");
    const classIcon = classButton.querySelector("img");


    // Abre a "caixa" inicial que contêm o jogo
    closedBox.addEventListener("click", () => {
        closedBox.classList.add("hidden");
        openWrap.classList.remove("hidden");
        logo.classList.remove("hidden");
    });

    // Estado inicial para todos os menus 
    const closeAllMenus = () => {
        [loginMenu, loggedMenu, settingsMenu, regrasMenu, classMenu].forEach(menu => menu.classList.add("hidden"));
        loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo.png";
        settingsIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/settings_logo.png";
        regrasIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/regras_logo.png";
        classIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/classificacoes_logo.png";
    };

    function ensurePanelVisible(panel) {
        if (!panel) return;
        // mede no estado atual
        const r = panel.getBoundingClientRect();
        const fits =
            r.left >= 0 &&
            r.right <= window.innerWidth &&
            r.top >= 0 &&
            r.bottom <= window.innerHeight;

        // se não couber, ativa overlay; se couber, volta ao layout normal
        panel.classList.toggle("panel-overlay", !fits);
    }

    window.addEventListener("resize", () => {
        if (!regrasMenu.classList.contains("hidden")) ensurePanelVisible(regrasMenu);
        if (!classMenu.classList.contains("hidden"))  ensurePanelVisible(classMenu);
    });


    // Menu Login
    let isLoggedIn = false;

    userButton.addEventListener("click", () => {
        if (!isLoggedIn) {
            if (loginMenu.classList.contains("hidden")) {
                closeAllMenus();
                loginMenu.classList.remove("hidden");
                loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo_2.png";
            } else {
                loginMenu.classList.add("hidden");
                loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo.png";
            }
        } else {
            if (loggedMenu.classList.contains("hidden")) {
                closeAllMenus();
                loggedMenu.classList.remove("hidden");
                loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo_2.png";
            } else {
                loggedMenu.classList.add("hidden");
                loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo.png";
            }
        }
    });



    function updateLoginButtonState() {
        const hasNick = usernameInput.value.trim() !== "";
        const hasPass = passwordInput.value.trim() !== "";
    }

    usernameInput.addEventListener("input", updateLoginButtonState);
    passwordInput.addEventListener("input", updateLoginButtonState);~

    loginForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        const nick = usernameInput.value;  
        const pass = passwordInput.value; 

        try {
            await registerUser(nick, pass);

            isLoggedIn = true;
            loggedUsername.textContent = nick;

            loginMenu.classList.add("hidden");
            loggedMenu.classList.add("hidden");
            loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo.png";

            passwordInput.value = "";
        } catch (err) {
            let msg = err.message;
            if (msg.includes("User registered with a different password")) {
                msg = "A password está incorreta.";
            }
            alert(msg);
        }
    });


    logoutButton.addEventListener("click", () => {
        isLoggedIn = false;
        loggedUsername.textContent = "Username";
        restartToModeSelection();
        closeAllMenus();

        if (typeof stopUpdateListener === "function") {
            stopUpdateListener();
        }
    });


    // Menu Confiurações
    settingsButton.addEventListener("click", () => {
        if (settingsMenu.classList.contains("hidden")) {
            closeAllMenus();
            settingsMenu.classList.remove("hidden");
            settingsIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/settings_logo_2.png";
        } else {
            settingsMenu.classList.add("hidden");
            settingsIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/settings_logo.png";
        }
    });

    // Menu Classificações
    classButton.addEventListener("click", () => {
        if (classMenu.classList.contains("hidden")) {
            closeAllMenus();
            renderClassifications();
            classMenu.classList.remove("hidden");
            classIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/classificacoes_logo_2.png";
            ensurePanelVisible(classMenu);  
        } else {
            classMenu.classList.add("hidden");
            classIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/classificacoes_logo.png";
        }
    });

    // Menu Regras
    regrasButton.addEventListener("click", () => {
        if (regrasMenu.classList.contains("hidden")) {
            closeAllMenus();
            regrasMenu.classList.remove("hidden");
            regrasIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/regras_logo_2.png";
            ensurePanelVisible(regrasMenu);  
        } else {
            regrasMenu.classList.add("hidden");
            regrasIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/regras_logo.png";
        }
    });

    (function () {
        const container = document.getElementById("regrasContent");
        if (!container) return;
        function toggle(head) {
            const body = document.getElementById(head.getAttribute("aria-controls"));
            if (!body) return;
            const wasOpen = head.getAttribute("aria-expanded") === "true";
            container.querySelectorAll('.regras-head[aria-expanded="true"]').forEach(h => {
                h.setAttribute("aria-expanded", "false");
                const b = document.getElementById(h.getAttribute("aria-controls"));
                if (b) b.hidden = true;
            });
            if (!wasOpen) {
                head.setAttribute("aria-expanded", "true");
                body.hidden = false;
            }
        }
        container.addEventListener("click", e => {
            const head = e.target.closest(".regras-head");
            if (head) toggle(head);
        });
        container.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                const head = e.target.closest(".regras-head");
                if (head) { e.preventDefault(); toggle(head); }
            }
        });
    })();

    // Botão Voltar ao início
    if (voltarButton) {
        voltarButton.addEventListener("click", () => {
            restartToModeSelection();
            closeAllMenus();
        });
    }

    // Jogador vs Jogador
    function iniciarJogoUI_vsJogador() {
        jogador.classList.add("hidden");
        ia.classList.add("hidden");
        jogadorText.classList.remove("hidden");
        dadosWrap.classList.remove("hidden");
        if (desistirButton) desistirButton.classList.remove("hidden");

        GameState.inGame = true;
        GameState.stats.startTime = Date.now();
        GameState.stats.moves = 0;
        GameState.vsAI = false;
        toggleMsgPanel(true);

        announceAwaitRoll(GameState.currentPlayer);
        
        if (!OnlineState.game || GameState.myColor) {
            renderBoard(); 
        }

        updateRollUI();
        updateDesistirUI();
        closeAllMenus();
    }

    jogador.addEventListener("click", async () => {
        closeAllMenus();

        if (!isLoggedIn) {
            loginMenu.classList.remove("hidden");
            loginIcon.src = "http://www.alunos.dcc.fc.up.pt/~up202207213/img/user_logo_2.png";

            alert("Tem de iniciar sessão para jogar online.");
            return;
        }

        const size = parseInt(sizeSelect.value, 10);

        GameState.myColor = null;
        GameState.opponentColor = null;
        GameState.isMyTurn = false;
        
        try {
            const gameId = await joinGame(size);
        
            iniciarJogoUI_vsJogador();  
            startUpdateListener();

        } catch (err) {
            alert("Erro ao entrar em jogo online: " + err.message);
            console.error(err);
        }

    });


    // Jogador vs IA
    ia.addEventListener("click", () => {
        jogador.classList.add("hidden");
        ia.classList.add("hidden");
        iaText.classList.remove("hidden");
        dadosWrap.classList.remove("hidden");
        desistirButton.classList.remove("hidden");

        GameState.inGame = true;
        GameState.stats.startTime = Date.now();
        GameState.stats.moves = 0;
        GameState.vsAI = true;
        GameState.aiColorLabel = "Vermelho";
        GameState.currentPlayer = getFirstPlayer();

        toggleMsgPanel(true);

        renderBoard();
        updateRollUI();
        updateDesistirUI();
        closeAllMenus();


        if (GameState.currentPlayer === GameState.aiColorLabel) {
            setMsg("A IA vai lançar os dados...");
            scheduleAI(AI_DELAY.ROLL);
        } else {
            setMsg('Carregue em "Lançar Dados".');
        }
    });

    // Botão Desistir - atribui vencedor, guarda classificação e recomeça
    desistirButton.addEventListener("click", async () => {
        if (!GameState.inGame) return;

        if (!OnlineState.game && !isHumanTurnNow()) {
            return;
        }

        const confirma = confirm("Tens a certeza que queres desistir do jogo?");
        if (!confirma) return;

        if (OnlineState.game) {
            try {
                await leaveGame(); 
            } catch (err) {
                alert("Erro ao comunicar com o servidor.");
            }
        }

        closeAllMenus();

        const winnerColor = GameState.vsAI
            ? GameState.aiColorLabel
            : (GameState.currentPlayer === "Azul" ? "Vermelho" : "Azul");

        const winnerDisplay = winnerLabelForDisplay(winnerColor);

        try {
            const nivel = GameState.vsAI ? (GameState.aiDifficulty || "Fácil") : "PvP";
            saveClassification(nivel, winnerDisplay);
            if (!classMenu.classList.contains("hidden")) renderClassifications();
        } catch (_) { }

        const DESISTIR_DELAY = 1200;
        setMsgTemp(`Jogador desistiu do jogo.\n${winnerDisplay} ganhou.`, DESISTIR_DELAY);

        setTimeout(() => {
            restartToModeSelection();
            desistirButton.classList.add("hidden");
            updateDesistirUI();
        }, DESISTIR_DELAY);
    });


    // Animação Dados
    function baralharDados() {
        document.querySelectorAll(".dado").forEach(dado => {
            const cima = Math.random() < 0.5;
            dado.classList.toggle("up", cima);
            dado.classList.toggle("down", !cima);
        });
    }

    // Reset Dados
    function resetDiceVisual() {
        document.querySelectorAll(".dado").forEach(d => {
            d.classList.remove("up");
            d.classList.add("down");
        });
    }

    function setDiceVisualFromStickValues(stickValues) {
        const diceEls = Array.from(document.querySelectorAll(".dado"));
        diceEls.forEach((el, i) => {
            const up = !!(stickValues && stickValues[i]);
            el.classList.toggle("up", up);
            el.classList.toggle("down", !up);
        });
    }


    // Mensagens 
    let statusEl = document.querySelector(".statusMsg");
    if (!statusEl) {
        let panel = document.querySelector(".msgPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.classList.add("msgPanel");
            document.body.appendChild(panel);
        }

        statusEl = document.createElement("div");
        statusEl.classList.add("statusMsg");
        panel.appendChild(statusEl);
        toggleMsgPanel(false);
    }

    function setMsg(t, { force = false } = {}) {
        const msgEl = document.querySelector(".statusMsg");
        if (!msgEl) return;
        
        // Se o jogo não está a decorrer e não é mensagem forçada, limpa
        if (!GameState.inGame && !force) {
            msgEl.textContent = "";
            return;
        }
        
        if (!t) return;

        let header = "";

        // 1. MODO ONLINE
        if (OnlineState && OnlineState.game) {
            if (GameState.isMyTurn) {
                header = "É a sua vez de jogar.";
            } else {
                header = "É a vez do adversário.";
            }
        } 
        // 2. MODO IA
        else if (GameState.vsAI) {
            const isAIturn = GameState.currentPlayer === GameState.aiColorLabel;
            header = isAIturn ? "É a vez da IA jogar." : "É a sua vez de jogar.";
        } 
        // 3. MODO PvP LOCAL
        else {
            header = `É a vez do jogador ${GameState.currentPlayer}.`;
        }

        msgEl.textContent = `${header}\n${t}`;
    }

    function setMsgTemp(texto, ms = 2000, { force = true } = {}) {
        toggleMsgPanel(true);
        setMsg(texto, { force });
        clearTimeout(setMsgTemp._timer);
        setMsgTemp._timer = setTimeout(() => {
            setMsg("", { force: true });
            toggleMsgPanel(false);
        }, ms);
    }

    function toggleMsgPanel(show) {
        document.querySelector(".msgPanel")?.classList.toggle("hidden", !show);
    }

    function announceAwaitRoll(playerLabel = GameState.currentPlayer) {
        const isAI = GameState.vsAI && playerLabel === GameState.aiColorLabel;
        const body = isAI ? "A IA vai lançar os dados..." : "Carregue em \"Lançar Dados\".";
        setMsg(body);
    }

    function clearHighlights() {
        document.querySelectorAll(".tabuleiro div.hl").forEach(el => el.classList.remove("hl"));
    }

    // Constantes para os estados de progresso das peças
    const STAGE = { NOT_MOVED: 0, MOVED_NOT_LAST: 1, HAS_BEEN_LAST: 2 };

    // Estado global do jogo
    const GameState = {
        mode: "awaitRoll",
        currentPlayer: "Azul",
        dice: { sum: null, value: null, canRepeat: false },
        selected: null,
        rows: 4,
        cols: parseInt(document.getElementById("sizeSelect")?.value || "9", 10),
        board: [],
        vsAI: false,
        aiColorLabel: "Vermelho",
        aiDifficulty: "Fácil",
        mustPass: false,
        nextPlayer: null,
        inGame: false,
        aiTimer: null,
        isRolling: false,
        stats: { startTime: null, moves: 0 },

        myColor: null, 
        opponentColor: null,
        isMyTurn: false
    };

    const OnlineState = window.OnlineState;


    function normalizePlayers(players, myNick, turnNick) {
        let myColorServer = null;
        let oppColorServer = null;
        let turnColorServer = null;

        if (!players) {
            return { myColorServer, oppColorServer, turnColorServer };
        }

        if (players[myNick] != null) {
            myColorServer = players[myNick];
        }
        if (turnNick && players[turnNick] != null) {
            turnColorServer = players[turnNick];
        }

        if (!myColorServer || !turnColorServer) {
            const blueNick = players.Blue ?? players["1"];
            const redNick  = players.Red  ?? players["2"];

            if (!myColorServer) {
                if (blueNick === myNick) myColorServer = "Blue";
                else if (redNick === myNick) myColorServer = "Red";
            }

            if (turnNick && !turnColorServer) {
                if (blueNick === turnNick) turnColorServer = "Blue";
                else if (redNick === turnNick) turnColorServer = "Red";
            }
        }

        if (myColorServer) {
            oppColorServer = (myColorServer === "Blue" || myColorServer === 1 || myColorServer === "1")
                ? "Red"
                : "Blue";
        }

        return { myColorServer, oppColorServer, turnColorServer };
    }


    function applyOnlineTurnInfoFromState(state) {
        if (!OnlineState.game || !state.players) return;

        const myNick = OnlineState.nick;
        
        // Tenta encontrar o turno em qualquer lado possível
        let turnNick = state.turn || (state.dice && state.dice.turn) || null;

        // SE O SERVIDOR NÃO MANDOU TURNO (ex: num notify intermédio),
        // mantemos o isMyTurn como estava, em vez de definir como false!
        if (turnNick) {
             if (myNick) {
                 GameState.isMyTurn = (turnNick.trim().toLowerCase() === myNick.trim().toLowerCase());
             }
        } else {
            // Se turnNick é null, NÃO alteramos o GameState.isMyTurn.
            // Mantemos o estado anterior.
        }
        
        // Se ainda não temos turnNick para normalizar cores, tentamos usar o último conhecido
        if (!turnNick && GameState.lastTurnNick) {
            turnNick = GameState.lastTurnNick;
        }

        const { myColorServer, oppColorServer, turnColorServer } =
            normalizePlayers(state.players, myNick, turnNick);

        // ... (resto da função de cores mantém-se igual)
        if (myColorServer != null) {
            const myColor = mapServerColor(myColorServer);
            if (myColor) {
                GameState.myColor = myColor;
                GameState.opponentColor = oppColorServer
                    ? mapServerColor(oppColorServer)
                    : (myColor === "Azul" ? "Vermelho" : "Azul");
            }
        }
        if (turnColorServer != null) {
            const turnColor = mapServerColor(turnColorServer);
            if (turnColor) {
                GameState.currentPlayer = turnColor;
                // Rede de segurança extra baseada na cor
                if (GameState.myColor && GameState.currentPlayer === GameState.myColor) {
                    GameState.isMyTurn = true;
                }
            }
        }
    }

    // Definição do Vencedor conforme a cor
    function winnerLabelForDisplay(winnerColor) {
        if (!GameState.vsAI) return winnerColor;
        return (winnerColor === GameState.aiColorLabel) ? "IA" : "Jogador";
    }

    // Helper para agendar a próxima ação da IA com delay controlado
    function scheduleAI(ms) {
        if (!GameState.vsAI) return;
        if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
        GameState.aiTimer = setTimeout(() => {
            GameState.aiTimer = null;
            aiMaybeAct();
        }, ms);
    }

    // Classificações
    function saveClassification(nivelAI, vencedorDisplay) {
        const classificacoes = JSON.parse(localStorage.getItem("classificacoes")) || [];

        const data = new Date()
            .toLocaleString("pt-PT", { hour12: false })
            .replace(",", "");

        classificacoes.push({ data, nivelAI, vencedor: vencedorDisplay });

        const limit = 8;
        const classificacoesLimitadas = classificacoes.slice(-limit);

        localStorage.setItem("classificacoes", JSON.stringify(classificacoesLimitadas));
        renderClassifications();
    }


    function renderClassifications() {
        const tbody = document.getElementById("classTbody");
        const clearBtn = document.getElementById("clearButton");
        if (!tbody) return;

        const list = JSON.parse(localStorage.getItem("classificacoes")) || [];

        const rows = [...list].reverse();

        tbody.innerHTML = "";
        rows.forEach(({ data, nivelAI, vencedor }) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${data}</td>
            <td>${nivelAI}</td>
            <td>${vencedor}</td>
            `;
            tbody.appendChild(tr);
        });

        if (clearBtn) clearBtn.disabled = list.length === 0;
    }

    // Classificações - atualiza a tabela
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            localStorage.removeItem("classificacoes");
            renderClassifications();
        });
    }

    // Restart do jogo
    function restartToModeSelection() {
        jogador.classList.remove("hidden");
        ia.classList.remove("hidden");
        jogadorText.classList.add("hidden");
        iaText.classList.add("hidden");
        if (dadosWrap) dadosWrap.classList.add("hidden");

        GameState.inGame = false;
        toggleMsgPanel(false);
        GameState.mode = "awaitRoll";
        GameState.currentPlayer = "Azul";
        GameState.selected = null;
        GameState.dice = { sum: null, value: null, canRepeat: false };
        GameState.mustPass = false;
        GameState.nextPlayer = null;
        GameState.stats.startTime = null;
        GameState.stats.moves = 0;

        // 👇 LIMPAR ESTADO ONLINE
        GameState.myColor = null;
        GameState.opponentColor = null;
        GameState.isMyTurn = false;

        resetDiceVisual();
        initBoardState(GameState.cols);
        renderBoard();
        clearHighlights();
        updateRollUI();
    }


    // Menu Configurações 
    // Nível IA
    const nivelAISelect = document.querySelector(".nivelAI");
    if (nivelAISelect) {
        GameState.aiDifficulty = nivelAISelect.value || "Fácil";
        nivelAISelect.addEventListener("change", () => {
            GameState.aiDifficulty = nivelAISelect.value || "Fácil";
            setMsg(`Nível da IA: ${GameState.aiDifficulty}`);
        });
    }
    // 1º Jogador
    const firstPlayerSelect = document.querySelector(".first-player");
    function getFirstPlayer() {
        return (firstPlayerSelect?.value === "Vermelho") ? "Vermelho" : "Azul";
    }
    GameState.currentPlayer = getFirstPlayer();

    firstPlayerSelect?.addEventListener("change", () => {
        GameState.currentPlayer = getFirstPlayer();
        if (!GameState.inGame) return;
        if (GameState.mode === "awaitRoll" || GameState.mode === "finished") {
            renderBoard();
            announceAwaitRoll(GameState.currentPlayer);
            updateRollUI();
            if (GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel && GameState.mode === "awaitRoll") {
                scheduleAI(AI_DELAY.ROLL);
            }
        }
    });

    // Delays da IA
    const AI_DELAY = { ROLL: 1800, PICK: 3500, BRANCH: 2200, CHAIN: 1800 };

    function fromView(vr, vc, player) {
        if (player === "Azul") return { r: vr, c: vc };
        return { r: GameState.rows - 1 - vr, c: GameState.cols - 1 - vc };
    }

    function toView(r, c, player) {
        if (player === "Azul") return { vr: r, vc: c };
        return { vr: GameState.rows - 1 - r, vc: GameState.cols - 1 - c };
    }


    function getPerspectivePlayer() {
        if (OnlineState && OnlineState.game && GameState.myColor) {
            return GameState.myColor;
        }
        return "Azul";   // fallback quando não temos cor
    }


    function cellIndexToRC(cell) {
        const cols = GameState.cols;
        const rows = GameState.rows; // 4

        const rowFromBottom = Math.floor(cell / cols); // 0 = linha de baixo
        const posInRow     = cell % cols;              // posição ao longo do caminho

        // linha do tabuleiro (0 = topo, 3 = baixo)
        const r = rows - 1 - rowFromBottom;

        // direção nessa linha (já usas isto na lógica local)
        const dir = dirForRow(r); // +1 (esq->dir) ou -1 (dir->esq)

        let c;
        if (dir === +1) {
            // linha que anda da esquerda para a direita
            c = posInRow;
        } else {
            // linha que anda da direita para a esquerda
            c = cols - 1 - posInRow;
        }

        return { r, c };
    }

    function rcToCellIndex(r, c) {
        const cols = GameState.cols;
        const rows = GameState.rows; // 4

        // converter linha do tabuleiro para "linha a partir de baixo"
        const rowFromBottom = rows - 1 - r;

        const dir = dirForRow(r); // +1 (esq->dir) ou -1 (dir->esq)

        // posição ao longo do caminho nessa linha
        const posInRow = (dir === +1)
            ? c                // esq->dir
            : (cols - 1 - c);  // dir->esq

        return rowFromBottom * cols + posInRow;
    }

    function updateRollUI() {
        const btn = document.getElementById("baralharDados");
        const dadosWrap = document.getElementById("dadosWrap");
        updateDesistirUI();

        if (!btn) return;

        // 🟢 1. PRIORIDADE MÁXIMA: Se o jogo acabou, mostra o botão "Jogar de novo"
        // (Fazemos isto ANTES de verificar !inGame, porque quando acaba, inGame passa a false)
        if (GameState.mode === "finished") {
            if (dadosWrap) dadosWrap.classList.remove("hidden");
            btn.style.display = "inline-block";
            btn.display = "none";
            return;
        }

        // 🟢 2. Se o jogo não está a decorrer (e não está finished), esconde tudo
        if (!GameState.inGame) {
            if (dadosWrap) dadosWrap.classList.add("hidden");
            btn.style.display = "none";
            return;
        }

        // Se for turno da IA (modo local), esconde
        const aiTurn = GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel;
        if (aiTurn) {
            btn.style.display = "none";
            return;
        }

        const isOnline = !!OnlineState.game;

        // ===============================================
        //           MODO ONLINE SIMPLIFICADO
        // ===============================================
        if (isOnline) {
            if (dadosWrap) dadosWrap.classList.remove("hidden");
            btn.style.display = "inline-block";

            // 🟢 CORREÇÃO: Usar apenas truthiness (removemos o "=== true")
            // E adicionamos a verificação das Cores como fallback extra aqui também
            let myTurn = !!GameState.isMyTurn;
            
            if (!myTurn && GameState.myColor && GameState.currentPlayer) {
                 if (GameState.myColor === GameState.currentPlayer) myTurn = true;
            }

            if (myTurn) {
                btn.disabled = false; 
                if (GameState.mustPass && !GameState.dice?.canRepeat) {
                    btn.textContent = "Passar a vez";
                } else {
                    btn.textContent = "Lançar Dados";
                }
            } else {
                btn.disabled = true; 
                btn.textContent = "Aguardando adversário...";
            }
            return;
        }

        // ===============================================
        //                MODO LOCAL
        // ===============================================
        if (GameState.mustPass) {
            if (dadosWrap) dadosWrap.classList.remove("hidden");
            btn.style.display = "inline-block";
            btn.disabled = false;
            btn.textContent = (GameState.nextPlayer === GameState.currentPlayer)
                ? "Lançar Dados"
                : "Passar a vez";
            return;
        }

        if (GameState.mode === "awaitRoll") {
            if (dadosWrap) dadosWrap.classList.remove("hidden");
            btn.style.display = "inline-block";
            btn.disabled = false;
            btn.textContent = "Lançar Dados";
            return;
        }

        btn.style.display = "none";
    }

    function mapServerColor(c) {
        // Servidor pode mandar "Blue"/"Red", ou 1/2, ou "1"/"2"
        if (c === "Blue" || c === 1 || c === "1") return "Azul";
        if (c === "Red"  || c === 2 || c === "2") return "Vermelho";

        // No pior caso, se for "Azul"/"Vermelho" já normalizado, devolve tal e qual
        if (c === "Azul" || c === "Vermelho") return c;

        return null;
    }


    // Atualiza botão de desistir
    function updateDesistirUI() {
        if (!desistirButton) return;

        const hide = !GameState.inGame || GameState.mode === "finished" || !isHumanTurnNow();
        desistirButton.classList.toggle("hidden", hide);
        desistirButton.disabled = hide;
    }

    // Regras Tabuleiro
    function dirForRow(r) { return (r === 3 || r === 1) ? +1 : -1; }
    function initialRow(owner) { return owner === "A" ? 3 : 0; }

    // Validação
    function isFrontOfStartRow(r, c) {
        const cell = GameState.board[r][c];
        if (!cell) return false;
        const owner = cell.owner;
        if (r !== initialRow(owner) || cell.stage !== STAGE.NOT_MOVED) return true;
        const dir = dirForRow(r);
        if (dir === +1) {
            for (let cc = GameState.cols - 1; cc >= 0; cc--) {
                const v = GameState.board[r][cc];
                if (v && v.owner === owner && v.stage === STAGE.NOT_MOVED) return cc === c;
            }
        } else {
            for (let cc = 0; cc < GameState.cols; cc++) {
                const v = GameState.board[r][cc];
                if (v && v.owner === owner && v.stage === STAGE.NOT_MOVED) return cc === c;
            }
        }
        return false;
    }

    const boardEl = document.getElementById("tabuleiro");

    function cellElView(vr, vc) {
        return document.querySelector(`.tabuleiro div[data-vr="${vr}"][data-vc="${vc}"]`);
    }

    // Iniciaçização Tabuleiro
    function initBoardState(cols) {
        GameState.cols = cols;
        GameState.board = Array.from({ length: GameState.rows }, (_, r) =>
            Array.from({ length: GameState.cols }, (_, c) => {
                if (r === 3) return { owner: "A", stage: STAGE.NOT_MOVED };
                if (r === 0) return { owner: "V", stage: STAGE.NOT_MOVED };
                return null;
            })
        );
    }

    function renderBoard() {
        boardEl.style.setProperty("--cols", GameState.cols);
        boardEl.style.setProperty("--rows", GameState.rows);
        boardEl.innerHTML = "";
        const persp = getPerspectivePlayer();
        for (let vr = 0; vr < GameState.rows; vr++) {
            for (let vc = 0; vc < GameState.cols; vc++) {
                const { r, c } = fromView(vr, vc, persp);
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.vr = vr;
                cell.dataset.vc = vc;

                const v = GameState.board[r][c];
                if (v) {
                    cell.textContent = "";
                    const piece = document.createElement("div");
                    piece.className = "piece " + (v.owner === "A" ? "azul" : "vermelha");
                    cell.appendChild(piece);
                }

                cell.addEventListener("click", onCellClick);
                boardEl.appendChild(cell);
            }
        }
    }

    // Reinicia o Tabuleiro para o número de colunas scolhido pelo utilizador
    function resetAndRender(cols) {
        initBoardState(cols);
        renderBoard();
        GameState.currentPlayer = getFirstPlayer();
        GameState.mode = "awaitRoll";
        GameState.selected = null;
        GameState.dice = { sum: null, value: null, canRepeat: false };
        if (GameState.inGame) {
            announceAwaitRoll(GameState.currentPlayer);
            if (GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel) {
                scheduleAI(AI_DELAY.ROLL);
            }
        } else {
            setMsg("");
        }

        resetDiceVisual();
        clearHighlights();
        updateRollUI();
    }

    if (sizeSelect && boardEl) {
        resetAndRender(parseInt(sizeSelect.value, 10));
        sizeSelect.addEventListener("change", e => {
            resetAndRender(parseInt(e.target.value, 10));
        });
    }

    // Dados
    // qual o valor? e que regras implica?
    function lerLancamentoPaus() {
        const claros = Array.from(document.querySelectorAll(".dado"))
            .reduce((acc, d) => acc + (d.classList.contains("up") ? 1 : 0), 0);
        const value = claros === 0 ? 6 : claros;
        const canRepeat = (value === 1 || value === 4 || value === 6);
        return { sum: claros, value, canRepeat };
    }
    // botão

    function applyRollResult(d) {
        GameState.dice = d;
        GameState.mode = "awaitPiece";
        GameState.selected = null;

        let msg = `Saiu ${d.value}.\n`;

        msg += (GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel)
            ? "A IA vai escolher uma peça para jogar."
            : "Escolha uma peça para jogar.";

        if (d.canRepeat) msg += `\nComo saiu ${d.value} pode voltar a lançar os dados.\n`;

        setMsg(msg);
        clearHighlights();
        updateRollUI();
        if (!isAITurnNow()) {
            highlightMoveablePieces();
        }

        GameState.isRolling = false;
        scheduleAI(AI_DELAY.PICK);
    }

    const btnDados = document.getElementById("baralharDados");

    if (btnDados) {
        btnDados.addEventListener("click", () => {
            closeAllMenus();
            
            // Se o jogo acabou, o botão serve para reiniciar
            if (GameState.mode === "finished") {
                restartToModeSelection();
                return;
            }
            
            // Evitar cliques duplos enquanto processa
            if (GameState.isRolling) return;

            // =====================================================
            //                  MODO ONLINE
            // =====================================================
            if (OnlineState.game) {

                // 1. Verificar se é a minha vez
                // (Se o botão estiver visível mas desativado, o click não entra aqui,
                // mas se por acaso entrar, garantimos que não faz nada).
                if (GameState.isMyTurn === false) {
                    setMsg("É a vez do adversário.");
                    return;
                }

                // 2. Verificar o estado do jogo

                // CASO B: Tenho de passar a vez (mustPass) e NÃO posso repetir
                // O botão deve funcionar como "Passar"
                if (GameState.mustPass && !GameState.dice?.canRepeat) {
                    const btn = document.getElementById("baralharDados");
                    if (btn) btn.disabled = true;

                    setMsg("A passar a vez...");

                    passGame()
                        .then(() => {
                            // Sucesso, aguarda update do servidor
                        })
                        .catch(err => {
                            alert(err.message || "Erro ao passar a vez online.");
                            if (btn) btn.disabled = false;
                        });
                    return;
                }

                // CASO C: Lançar Dados (awaitRoll ou repetição)
                // Se chegámos aqui, vamos tentar lançar.
                GameState.isRolling = true;
                const btn = document.getElementById("baralharDados");
                if (btn) btn.disabled = true;

                setMsg("A lançar dados online...");

                rollGame()
                    .then(() => {
                        // Sucesso, o resultado vem no handleServerUpdate
                    })
                    .catch(err => {
                        alert(err.message || "Erro ao lançar dados online.");
                        GameState.isRolling = false;
                        if (btn) btn.disabled = false;
                    });

                return; 
            }


            // =====================================================
            //           MODO LOCAL (PvP / IA) - Mantém-se igual
            // =====================================================
            if (GameState.mode === "awaitRoll" && GameState.mustPass) {
                GameState.mustPass = false;
                GameState.currentPlayer = GameState.nextPlayer || GameState.currentPlayer;
                GameState.nextPlayer = null;
                announceAwaitRoll(GameState.currentPlayer);
                updateRollUI();
                scheduleAI(AI_DELAY.CHAIN);
                return;
            }
            
            // Só deixa lançar localmente se estiver em awaitRoll
            if (GameState.mode !== "awaitRoll") return;

            GameState.isRolling = true;

            const SPINS = 8;
            const STEP = 60;
            for (let i = 0; i < SPINS; i++) {
                setTimeout(baralharDados, i * STEP);
            }

            setTimeout(() => {
                const d = lerLancamentoPaus();
                applyRollResult(d);
            }, SPINS * STEP + 10);
        });
    }

    function meOwner(label) { return label === "Azul" ? "A" : "V"; }
    function onFourthRow(r, owner) { return (owner === "A" && r === 0) || (owner === "V" && r === 3); }
    function hasOwnInInitialRow(owner) {
        const row = initialRow(owner);
        return GameState.board[row].some(cell => cell && cell.owner === owner);
    }

    function isOwnPiece(r, c, cellIndexForOnline) {
        // Obter a peça do tabuleiro (que já está sincronizado com o servidor)
        const piece = GameState.board[r][c];
        
        // Se a casa está vazia, não é minha
        if (!piece) return false;

        // MODO ONLINE
        if (OnlineState && OnlineState.game) {
            // Se ainda não sei a minha cor, não posso assumir que é minha
            if (!GameState.myColor) return false;
            
            // Converter "Azul"/"Vermelho" para "A"/"V"
            const me = (GameState.myColor === "Azul" ? "A" : "V");
            return piece.owner === me;
        }

        // MODO LOCAL
        const label = GameState.currentPlayer;
        const me = meOwner(label);
        return piece.owner === me;
    }



    function canLand(r, c) {
        const me = meOwner(GameState.currentPlayer);
        const v = GameState.board[r][c];
        return !v || v.owner !== me;
    }

    // Jogo
    // Cálculo do destino das peças 
    function possibleAdvanceFrom(r, c, steps) {
        const piece = GameState.board[r][c];
        if (!piece) return { r: null, c: null, needsChoice: false };

        if (onFourthRow(r, piece.owner) && hasOwnInInitialRow(piece.owner)) {
            return { r: null, c: null, needsChoice: false };
        }

        if (piece.stage === STAGE.NOT_MOVED && steps !== 1) {
            return { r: null, c: null, needsChoice: false };
        }

        if (piece.stage === STAGE.NOT_MOVED && steps === 1) {
            const d0 = dirForRow(r);
            const nc = c + d0;
            if (nc >= 0 && nc < GameState.cols && canLand(r, nc)) {
                return { r, c: nc, needsChoice: false };
            }
            const nr = (piece.owner === "A") ? r - 1 : r + 1;
            if (nr >= 0 && nr < GameState.rows && canLand(nr, c)) {
                return { r: nr, c, needsChoice: false };
            }
            return { r: null, c: null, needsChoice: false };
        }

        // Azul bifurca ao sair da linha absoluta 1 (para 0 ou 2)
        // Vermelho bifurca ao sair da linha absoluta 2 (para 3 ou 1)
        let curR = r, curC = c, rem = steps;

        while (rem > 0) {
            const d = dirForRow(curR);

            if (d === +1 && curC < GameState.cols - 1) { curC++; rem--; continue; }
            if (d === -1 && curC > 0) { curC--; rem--; continue; }

            if (rem > 0) {
                if (curR === 3) { curR = 2; rem--; continue; }
                if (curR === 0) { curR = 1; rem--; continue; }

                if (piece.owner === "A") {
                    if (curR === 2) { curR = 1; rem--; continue; }
                    if (curR === 1) {
                        const up = (piece.stage === STAGE.HAS_BEEN_LAST) ? null : { r: 0, c: curC };
                        const down = { r: 2, c: curC };
                        const opts = [];
                        if (up) opts.push(up);
                        opts.push(down);

                        if (opts.length > 1) {
                            return { needsChoice: true, options: opts, remaining: rem - 1 };
                        } else {
                            const end = walkStepsOwner("A", opts[0].r, opts[0].c, rem - 1);
                            return { r: end.r, c: end.c, needsChoice: false };
                        }
                    }
                } else {
                    if (curR === 1) { curR = 2; rem--; continue; }
                    if (curR === 2) {
                        const up = (piece.stage === STAGE.HAS_BEEN_LAST) ? null : { r: 3, c: curC };
                        const down = { r: 1, c: curC };
                        const opts = [];
                        if (up) opts.push(up);
                        opts.push(down);

                        if (opts.length > 1) {
                            return { needsChoice: true, options: opts, remaining: rem - 1 };
                        } else {
                            const end = walkStepsOwner("V", opts[0].r, opts[0].c, rem - 1);
                            return { r: end.r, c: end.c, needsChoice: false };
                        }
                    }
                }

            }
        }

        return { r: curR, c: curC, needsChoice: false };
    }

    function displayCoords(r, c) {
        const persp = getPerspectivePlayer();
        const { vr, vc } = toView(r, c, persp);
        const rowNum = (GameState.rows) - vr;
        const isLR = (rowNum === 1 || rowNum === 3);
        const colLabel = isLR ? (vc + 1) : (GameState.cols - vc);
        return { row: rowNum, col: colLabel };
    }


    function applyMove(from, to) {
        const me = meOwner(GameState.currentPlayer);
        const piece = GameState.board[from.r][from.c];

        GameState.board[to.r][to.c] = { owner: me, stage: piece.stage };
        GameState.board[from.r][from.c] = null;

        if (GameState.board[to.r][to.c].stage === STAGE.NOT_MOVED) {
            GameState.board[to.r][to.c].stage = STAGE.MOVED_NOT_LAST;
        }
        if ((me === "A" && to.r === 0) || (me === "V" && to.r === 3)) {
            GameState.board[to.r][to.c].stage = STAGE.HAS_BEEN_LAST;
        }

        renderBoard();
        GameState.stats.moves += 1;

        const a = displayCoords(from.r, from.c);
        const b = displayCoords(to.r, to.c);
        setMsg(`Movimento: (${a.row},${a.col}) ➜ (${b.row},${b.col}).`);
    }

    function countPieces(owner) {
        let n = 0;
        for (let r = 0; r < GameState.rows; r++) {
            for (let c = 0; c < GameState.cols; c++) {
                const v = GameState.board[r][c];
                if (v && v.owner === owner) n++;
            }
        }
        return n;
    }

    // Fim do jogo
    function checkWin() {
        const a = countPieces("A");
        const v = countPieces("V");

        if (a === 0 || v === 0) {
            const winnerColor = a > 0 ? "Azul" : "Vermelho";

            const winnerDisplay = winnerLabelForDisplay(winnerColor);

            setMsg(`Fim do jogo!\n${winnerDisplay} ganhou!`);

            GameState.mode = "finished";
            clearHighlights();
            GameState.dice = { sum: null, value: null, canRepeat: false };

            updateRollUI();
            updateDesistirUI();

            try {
                const nivel = GameState.vsAI ? (GameState.aiDifficulty || "Fácil") : "PvP";
                saveClassification(nivel, winnerDisplay);
                if (!classMenu.classList.contains("hidden")) renderClassifications();
            } catch (_) { /* silencioso */ }

            return true;
        }
        return false;
    }

    function endTurnOrRepeat() {
        const repeated = GameState.dice.canRepeat;
        GameState.dice = { sum: null, value: null, canRepeat: false };

        if (repeated) {
            GameState.mode = "awaitRoll";
            announceAwaitRoll(GameState.currentPlayer);
            renderBoard();
        } else {
            GameState.currentPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
            GameState.mode = "awaitRoll";
            announceAwaitRoll(GameState.currentPlayer);
            renderBoard();
        }

        updateRollUI();
        scheduleAI(AI_DELAY.CHAIN);

    }

    // Destaca peças com jogadas possíveis
    function highlightCells(modelCells) {
        clearHighlights();
        const persp = getPerspectivePlayer();
        modelCells.forEach(({ r, c }) => {
            const { vr, vc } = toView(r, c, persp);
            const el = cellElView(vr, vc);
            if (el) el.classList.add("hl");
        });
    }

    function highlightMoveablePieces() {
        const me = meOwner(GameState.currentPlayer);
        const cells = [];
        for (let r = 0; r < GameState.rows; r++) {
            for (let c = 0; c < GameState.cols; c++) {
                const v = GameState.board[r][c];
                if (!v || v.owner !== me) continue;

                if (onFourthRow(r, v.owner) && hasOwnInInitialRow(v.owner)) continue;

                if (v.stage === STAGE.NOT_MOVED && !isFrontOfStartRow(r, c)) continue;
                if (v.stage === STAGE.NOT_MOVED && GameState.dice.value !== 1) continue;

                const dest = possibleAdvanceFrom(r, c, GameState.dice.value);
                if (dest.needsChoice || (dest.r != null && canLand(dest.r, dest.c))) {
                    cells.push({ r, c });
                }
            }
        }
        highlightCells(cells);

        // 👉 MODO ONLINE:
        // Se não há jogadas possíveis COM ESTE VALOR e o dado permite repetir,
        // então o cliente tem de pedir novo lançamento.
        if (OnlineState.game) {
            if (cells.length === 0 && GameState.dice && GameState.dice.canRepeat) {
                GameState.mustPass = true;       // “passar” este valor de dado
                GameState.mode = "awaitRoll";    // volta ao estado de lançar

                const v = GameState.dice.value;
                setMsg(
                    `Saiu ${v}.\n` +
                    `Não tens jogadas válidas com este valor.\n` +
                    `Como podes jogar de novo, lança o dado outra vez.`
                );

                updateRollUI();   // aqui o botão fica visível e diz "Lançar Dados"
            }
            return; // não mexemos no resto da lógica local
        }

        // Daqui para baixo fica só para modo LOCAL
        if (cells.length === 0) {
            GameState.mustPass = true;

            const isAI = GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel;
            const v = GameState.dice.value;

            if (GameState.dice.canRepeat) {
                GameState.nextPlayer = GameState.currentPlayer;
                setMsg(
                    `Saiu ${v}.\n` +
                    `Não é uma jogada válida.\n` +
                    `Como saiu ${v}, ${isAI ? "a IA" : "lança"} de novo o dado.`
                );
            } else {
                GameState.nextPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
                setMsg(
                    `Saiu ${v}.\n` +
                    `Não é uma jogada válida.\n` +
                    `${isAI ? "A IA passa a vez." : "Clique em 'Passar a vez'."}`
                );
            }

            GameState.mode = "awaitRoll";
            GameState.dice = { sum: null, value: null, canRepeat: false };
            clearHighlights();
            renderBoard();
            updateRollUI();

            if (isAI) {
                if (GameState.nextPlayer === GameState.currentPlayer) {
                    scheduleAI(AI_DELAY.ROLL);
                } else {
                    scheduleAI(AI_DELAY.CHAIN);
                }
            }
            return;
        }
    }


    // IA 
    // Heurística de progresso para a IA 
    function progressHeuristic(ownerChar, from, to) {
        const rowScore = ownerChar === "A" ? (3 - to.r) : (to.r - 0);
        const d = dirForRow(from.r);
        const horizGain = (to.r === from.r) ? ((to.c - from.c) * d) : 0;
        const branchBonus = (from.r === 1 && to.r !== from.r) ? 0.5 : 0;
        return rowScore * 100 + horizGain * 5 + branchBonus;
    }

    // Geração de jogadas
    function enumerateMovesFrom(r, c, steps, playerLabel) {
        const piece = GameState.board[r][c];
        const moves = [];
        if (!piece) return moves;
        const me = meOwner(playerLabel);
        if (piece.owner !== me) return moves;

        if (onFourthRow(r, me) && hasOwnInInitialRow(me)) return moves;

        if (piece.stage === STAGE.NOT_MOVED) {
            if (!isFrontOfStartRow(r, c)) return moves;
            if (steps !== 1) return moves;

            const d = dirForRow(r);
            const nc = c + d;

            if (nc >= 0 && nc < GameState.cols && canLand(r, nc)) {
                const cap = !!(GameState.board[r][nc] && GameState.board[r][nc].owner !== me);
                moves.push({ from: { r, c }, to: { r, c: nc }, capture: cap, progress: progressHeuristic(me, { r, c }, { r, c: nc }) });
                return moves;
            }
            const nr = (piece.owner === "A") ? r - 1 : r + 1;
            if (nr >= 0 && nr < GameState.rows && canLand(nr, c)) {
                const cap = !!(GameState.board[nr][c] && GameState.board[nr][c].owner !== me);
                moves.push({ from: { r, c }, to: { r: nr, c }, capture: cap, progress: progressHeuristic(me, { r, c }, { r: nr, c }) });
            }
            return moves;
        }

        const probe = possibleAdvanceFrom(r, c, steps);
        if (probe.needsChoice) {
            for (const opt of probe.options) {
                const end = walkStepsOwner(me, opt.r, opt.c, probe.remaining);
                if (end.r == null) continue;
                if (!canLand(end.r, end.c)) continue;
                const cap = !!(GameState.board[end.r][end.c] && GameState.board[end.r][end.c].owner !== me);
                moves.push({
                    from: { r, c },
                    to: { r: end.r, c: end.c },
                    capture: cap,
                    progress: progressHeuristic(me, { r, c }, { r: end.r, c: end.c }),
                });
            }
            return moves;
        }

        if (probe.r != null && canLand(probe.r, probe.c)) {
            const cap = !!(GameState.board[probe.r][probe.c] && GameState.board[probe.r][probe.c].owner !== me);
            moves.push({ from: { r, c }, to: { r: probe.r, c: probe.c }, capture: cap, progress: progressHeuristic(me, { r, c }, { r: probe.r, c: probe.c }) });
        }
        return moves;
    }

    function getValidMovesFor(playerLabel, steps) {
        const out = [];
        for (let r = 0; r < GameState.rows; r++) {
            for (let c = 0; c < GameState.cols; c++) {
                const v = GameState.board[r][c];
                if (!v || v.owner !== meOwner(playerLabel)) continue;
                out.push(...enumerateMovesFrom(r, c, steps, playerLabel));
            }
        }
        return out;
    }

    // Nível Fácil: evita capturar
    // Nível Médio: aleatório
    // Nível Difícil: captura primeiro, senão escolhe a jogada com maior progresso 
    function aiPickMove(moves, difficulty) {
        if (!moves.length) return null;

        if (difficulty === "Fácil") {
            const naoCapturas = moves.filter(m => !m.capture);
            const pool = naoCapturas.length ? naoCapturas : moves;
            return pool[Math.floor(Math.random() * pool.length)];
        }

        if (difficulty === "Médio") {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        const caps = moves.filter(m => m.capture);
        if (caps.length) {
            caps.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
            return caps[0];
        }
        const sorted = [...moves].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
        return sorted[0];
    }

    function isAITurnNow() {
        return GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel && GameState.mode !== "finished";
    }

    function isHumanTurnNow() {
        return GameState.inGame &&
            (!GameState.vsAI || GameState.currentPlayer !== GameState.aiColorLabel);
    }

    // Executa ação da IA 
    function aiMaybeAct() {
        if (!isAITurnNow()) return;

        if (GameState.isRolling) {
            scheduleAI(300);
            return;
        }

        if (GameState.mode === "awaitRoll") {
            if (GameState.mustPass) {
                const btn = document.getElementById("baralharDados");
                if (btn && !btn.disabled) btn.click();
                return;
            }
            const btn = document.getElementById("baralharDados");
            if (btn && !btn.disabled) {
                btn.click();
            } else {
                scheduleAI(300);
            }
            return;
        }

        if (GameState.mode === "awaitPiece") {
            const d = GameState.dice.value;
            const moves = getValidMovesFor(GameState.currentPlayer, d);
            if (!moves.length) {
                const v = d;
                if (GameState.dice.canRepeat) {
                    setMsg(
                        `Saiu ${v}.\n` +
                        `Não é uma jogada válida.\n` +
                        `Como saiu ${v}, a IA lança de novo o dado.`
                    );
                    GameState.mode = "awaitRoll";
                    GameState.mustPass = true;
                    GameState.nextPlayer = GameState.currentPlayer;
                    GameState.dice = { sum: null, value: null, canRepeat: false };
                    clearHighlights();
                    renderBoard();
                    updateRollUI();
                    scheduleAI(AI_DELAY.ROLL);
                } else {
                    setMsg(
                        `Saiu ${v}.\n` +
                        `Não é uma jogada válida.\n` +
                        `A IA passa a vez.`
                    );
                    GameState.mode = "awaitRoll";
                    GameState.mustPass = true;
                    GameState.nextPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
                    GameState.dice = { sum: null, value: null, canRepeat: false };
                    clearHighlights();
                    renderBoard();
                    updateRollUI();
                    scheduleAI(AI_DELAY.CHAIN);
                }
                return;
            }

            const move = aiPickMove(moves, GameState.aiDifficulty);
            applyMove(move.from, move.to);
            if (checkWin()) return;
            GameState.selected = null;
            endTurnOrRepeat();
            return;
        }
    }

    // Movimento das peças
    function walkStepsOwner(ownerChar, startR, startC, rem) {
        let curR = startR, curC = startC, steps = rem;
        while (steps > 0) {
            const d = dirForRow(curR);
            const canRight = (d === +1 && curC < GameState.cols - 1);
            const canLeft = (d === -1 && curC > 0);

            if ((d === +1 && canRight) || (d === -1 && canLeft)) {
                curC += d; steps--; continue;
            }

            curR = (ownerChar === "A")
                ? (curR === 3 ? 2 : curR === 2 ? 1 : curR === 1 ? 0 : 1)
                : (curR === 0 ? 1 : curR === 1 ? 2 : curR === 2 ? 3 : 2);
            steps--;
        }
        return { r: curR, c: curC };
    }

    // Clicks no tabuleiro
    // controla a seleção da peça pelo utilizador; escolhe a bifurcação e o destino final 
    async function onCellClick(e) {
        const vr = parseInt(e.currentTarget.dataset.vr, 10);
        const vc = parseInt(e.currentTarget.dataset.vc, 10);
        const persp = getPerspectivePlayer();
        const { r, c } = fromView(vr, vc, persp);

        const cellIndex = rcToCellIndex(r, c);

        if (isAITurnNow()) return;
        if (GameState.mode === "finished") return;

        // [script.js] Dentro de onCellClick / Bloco MODO ONLINE

        // =====================================================
        //                  MODO ONLINE
        // =====================================================
        // [script.js] Dentro de onCellClick / Bloco MODO ONLINE

        if (OnlineState && OnlineState.game) {

            // 1) Validações básicas
            if (!GameState.isMyTurn) {
                setMsg("É a vez do adversário.");
                return;
            }
            if (GameState.mustPass) {
                setMsg("Não tens jogadas válidas. Usa o botão 'Passar a vez'.");
                return;
            }

            const step = GameState.onlineStep || "from";
            const isMine = isOwnPiece(r, c, cellIndex);
            
            // 2) Validação do Passo
            if (step === "from") {
                if (!isMine) {
                    setMsg("Escolhe uma das tuas peças.");
                    return;
                }
            } 
            else if (step === "take") {
                if (isMine) {
                    setMsg("Tens de escolher a peça do adversário para capturar.");
                    return;
                }
                if (GameState.serverSelected && !GameState.serverSelected.includes(cellIndex)) {
                     setMsg("Clica numa das peças destacadas para capturar.");
                     return;
                }
            }
            else if (step === "to") {
                 const isValidDest = GameState.serverSelected && GameState.serverSelected.includes(cellIndex);
                 if (!isValidDest) {
                     // Se não é destino, só deixamos passar se for para cancelar (clique na própria peça)
                     if (!isMine) {
                         setMsg("Clica numa das casas destacadas para mover.");
                         return;
                     }
                 }
            }

            // 🟢 3) LIMPAR HIGHLIGHTS IMEDIATAMENTE (A tua sugestão)
            // Isto remove a confusão visual enquanto esperamos pelo servidor.
            clearHighlights();

            // 4) Enviar a jogada
            const canRepeatMove = GameState.dice && GameState.dice.canRepeat;

            try {
                await notifyMove(cellIndex);

                if (canRepeatMove) {
                    GameState.dice = { sum: null, value: null, canRepeat: false };
                    GameState.mode = "awaitRoll";
                    updateRollUI();
                }

            } catch (err) {
                if (err.message && err.message.includes("Wait for dice roll")) {
                     setMsg("Erro: O servidor aguarda lançamento de dados.");
                     GameState.mode = "awaitRoll";
                     updateRollUI();
                } else {
                     setMsg(err.message || "Erro ao notificar jogada.");
                }
            }
            return; 
        }

        // =========================
        //      MODO LOCAL
        // =========================

        function fixBranchOptionsForOwner(ownerChar, options) {
            if (ownerChar === "A") return options;
            return options.map(o => {
                if (o.r === 0) return { r: 3, c: o.c };
                if (o.r === 2) return { r: 1, c: o.c };
                return o;
            });
        }

        if (GameState.mode === "awaitPiece") {
            if (!isOwnPiece(r, c)) { setMsg("Escolhe uma peça tua."); return; }
            const piece = GameState.board[r][c];

            if (onFourthRow(r, piece.owner) && hasOwnInInitialRow(piece.owner)) {
                setMsg("Na 4.ª linha só mexe se a 1.ª da tua cor estiver vazia.");
                return;
            }

            if (piece.stage === STAGE.NOT_MOVED && !isFrontOfStartRow(r, c)) {
                setMsg("Na fila inicial só podes mexer a peça da frente (à direita).");
                return;
            }
            if (piece.stage === STAGE.NOT_MOVED && GameState.dice.value !== 1) {
                setMsg("O 1.º movimento tem de ser com 1 (Tâb).");
                return;
            }

            const dest = possibleAdvanceFrom(r, c, GameState.dice.value);

            if (dest.needsChoice) {
                GameState.mode = "awaitDestination";

                const fixedOpts = fixBranchOptionsForOwner(piece.owner, dest.options);
                GameState.selected = { r, c, remaining: dest.remaining, options: fixedOpts };

                const endsResolved = fixedOpts
                    .map(o => ({ end: walkStepsOwner(piece.owner, o.r, o.c, dest.remaining) }))
                    .filter(p => canLand(p.end.r, p.end.c));

                if (endsResolved.length === 0) {
                    setMsg("Jogada inválida.");
                    GameState.mode = "awaitPiece";
                    clearHighlights();
                    highlightMoveablePieces();
                    return;
                }

                const endsView = endsResolved.map(p => toView(p.end.r, p.end.c, persp));
                clearHighlights();
                endsView.forEach(({ vr, vc }) => {
                    const el = cellElView(vr, vc);
                    if (el) el.classList.add("hl");
                });

                setMsg("Estás na 3.ª linha: escolhe o destino (4.ª ou 2.ª).");
                return;
            }

            if (dest.r == null || !canLand(dest.r, dest.c)) {
                setMsg("Jogada inválida.");
                return;
            }
            applyMove({ r, c }, { r: dest.r, c: dest.c });
            if (checkWin()) return;
            GameState.selected = null;
            endTurnOrRepeat();
            return;
        }

        if (GameState.mode === "awaitDestination") {
            const from = GameState.selected;
            if (!from) { GameState.mode = "awaitPiece"; return; }

            if (r === from.r && c === from.c) {
                GameState.selected = null;
                GameState.mode = "awaitPiece";
                clearHighlights();
                highlightMoveablePieces();
                setMsg("Seleção cancelada. Escolhe uma peça.");
                return;
            }

            const piece = GameState.board[from.r][from.c];
            const ownerChar = piece?.owner || "A";
            const options = Array.isArray(from.options) ? from.options : [];

            const clickedModel = fromView(vr, vc, persp);

            const resolved = options.map(o => ({
                entry: o,
                end: walkStepsOwner(ownerChar, o.r, o.c, from.remaining)
            }));

            const picked = resolved.find(p => p.end.r === clickedModel.r && p.end.c === clickedModel.c);

            if (!picked) {
                setMsg("Clica numa das casas destacadas ou clica na peça para cancelar.");
                const endsView = resolved.map(p => toView(p.end.r, p.end.c, persp));
                clearHighlights();
                endsView.forEach(({ vr, vc }) => cellElView(vr, vc)?.classList.add("hl"));
                return;
            }

            const end = picked.end;
            if (!canLand(end.r, end.c)) {
                setMsg("Destino inválido. Clica na peça para cancelar.");
                const endsView = resolved.map(p => toView(p.end.r, p.end.c, persp));
                clearHighlights();
                endsView.forEach(({ vr, vc }) => cellElView(vr, vc)?.classList.add("hl"));
                return;
            }

            applyMove({ r: from.r, c: from.c }, { r: end.r, c: end.c });
            if (checkWin()) return;
            GameState.selected = null;
            GameState.mode = "awaitPiece";
            endTurnOrRepeat();
            return;
        }
    }


    function handleServerUpdate(state) {
        if (!state || state.error) {
            return;
        }

        // 🟢 1. DETETAR SE HOUVE MOVIMENTO REAL (BOARD CHANGED)
        // Criamos uma "assinatura" do tabuleiro baseada APENAS na cor das peças.
        // Ignoramos 'selected', 'inMotion', etc. Se a assinatura mudar, é porque uma peça mexeu.
        let boardChanged = false;
        
        if (Array.isArray(state.pieces)) {
            const getBoardSig = (pieces) => {
                return JSON.stringify(pieces.map(p => {
                    if (!p) return 0; // Casa vazia
                    // Se for objeto {color: "Red", ...} devolve "Red". Se for numero 1, devolve 1.
                    return (typeof p === "object") ? p.color : p; 
                }));
            };

            const currentSig = getBoardSig(state.pieces);
            
            // Se já tinhamos um estado anterior e é diferente do atual -> MOVIMENTO
            if (GameState.lastBoardSig && GameState.lastBoardSig !== currentSig) {
                boardChanged = true;
            }
            GameState.lastBoardSig = currentSig;
        }

        // 2. DETETAR MUDANÇA DE TURNO
        const serverTurn = state.turn || (state.dice && state.dice.turn);
        let turnChanged = false;
        if (GameState.lastTurnNick && serverTurn && GameState.lastTurnNick !== serverTurn) {
            turnChanged = true;
        }
        if (serverTurn) GameState.lastTurnNick = serverTurn;

        // Atualizar isMyTurn
        if (serverTurn && OnlineState.nick) {
            GameState.isMyTurn = (serverTurn.trim().toLowerCase() === OnlineState.nick.trim().toLowerCase());
        }

        // 🟢 3. LIMPEZA DE DADO (A CORREÇÃO ESTÁ AQUI)
        // Se o turno mudou OU se as peças mudaram de sítio (jogada feita), 
        // o dado antigo já não serve. APAGAR IMEDIATAMENTE.
        if (turnChanged || boardChanged) {
            GameState.dice = { sum: null, value: null, canRepeat: false };
            clearHighlights();
        }

        // 4. Info Jogadores e Cores
        if (OnlineState.game && state.players) {
            GameState.onlinePlayers = state.players;
            const previousColor = GameState.myColor;
            
            applyOnlineTurnInfoFromState(state);
            
            // Fallback de segurança para isMyTurn baseado nas cores
            if (!GameState.isMyTurn && GameState.myColor && GameState.currentPlayer === GameState.myColor) {
                GameState.isMyTurn = true;
            }

            if (GameState.myColor && !previousColor) {
                renderBoard();
            }
        }

        // 5. Atualizar Peças (Visual)
        if (Array.isArray(state.pieces)) {
            GameState.serverPieces = state.pieces.slice();
            const rows = GameState.rows;
            const cols = GameState.cols;
            const newBoard = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

            state.pieces.forEach((p, idx) => {
                if (!p) return; 
                let color = null;
                if (typeof p === "number") {
                    if (p === 1) color = "Blue"; else if (p === 2) color = "Red";
                } else if (typeof p === "object") { color = p.color; }
                if (!color) return;
                const ownerChar = (color === "Blue") ? "A" : "V";
                const { r, c } = cellIndexToRC(idx);
                const inMotion = (typeof p === "object") ? !!p.inMotion : false;
                const stage = inMotion ? STAGE.HAS_BEEN_LAST : STAGE.NOT_MOVED;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    newBoard[r][c] = { owner: ownerChar, stage };
                }
            });
            GameState.board = newBoard;
            renderBoard(); 
        }

        // 6. Passo e Seleção
        GameState.onlineStep = (typeof state.step === "string") ? state.step : null;
        GameState.serverSelected = Array.isArray(state.selected) ? state.selected.slice() : null;

        // 7. LÓGICA DO DADO (RECEBER NOVO OU MANTER)
        if (state.dice) {
            // === SERVIDOR ENVIOU DADOS NOVOS ===
            const diceState = state.dice;
            if (diceState.stickValues) setDiceVisualFromStickValues(diceState.stickValues);

            const d = { sum: null, value: diceState.value, canRepeat: !!diceState.keepPlaying };
            GameState.dice = d;
            GameState.isRolling = false;

            const myNick = OnlineState.nick;
            const rawMustPass = state.mustPass;
            const iMustPass = typeof rawMustPass === "string" && typeof myNick === "string" &&
                rawMustPass.trim().toLowerCase() === myNick.trim().toLowerCase();

            if (!GameState.isMyTurn) {
                GameState.mustPass = false;
                GameState.mode = "awaitRoll";
                setMsg(`Saiu ${d.value}.`);
            } else if (iMustPass) {
                GameState.mustPass = true;
                GameState.mode = "awaitRoll";
                const txt = d.canRepeat ? "Lança de novo." : "Usa o botão 'Passar a vez'.";
                setMsg(`Saiu ${d.value}.\nNão tens jogadas válidas.\n${txt}`);
            } else {
                GameState.mustPass = false;
                applyRollResult(d); 
            }
            updateRollUI();
        } 
        else {
            // === UPDATE SEM DADOS ===
            
            // Se "turnChanged" ou "boardChanged" já limparam o dado lá em cima, perfeito.
            // Se nada mudou (apenas seleção/reversão), mantemos o dado.
            
            if (GameState.onlineStep) {
                GameState.mode = "awaitPiece";
            } else {
                GameState.mode = "awaitRoll";
                // Limpeza de segurança extra
                if (!GameState.dice?.value) { 
                    GameState.dice = { sum: null, value: null, canRepeat: false };
                }
            }
            updateRollUI();
        }

        // 8. Vencedor
        if ("winner" in state) {
            const winnerNick = state.winner;
            let msgText = "O jogo online foi cancelado.";
            if (winnerNick !== null) {
                 msgText = `Fim do jogo online!\n${winnerNick} ganhou!`;
                 const players = state.players || GameState.onlinePlayers;
                 if (players && players[winnerNick]) {
                     const c = mapServerColor(players[winnerNick]);
                     if (c) msgText = `Fim do jogo online!\n${winnerLabelForDisplay(c)} ganhou!`;
                 }
            }
            setMsg(msgText);
            stopUpdateListener();
            OnlineState.game = null;
            GameState.inGame = false;
            GameState.mode = "finished";
            clearHighlights();
            updateRollUI();
            
            setTimeout(() => {
                restartToModeSelection(); 
                closeAllMenus();          
                toggleMsgPanel(false);    
            }, 4000);
            return;
        }

        // 9. HIGHLIGHTS (FINAL)
        if (OnlineState.game && !state.winner && GameState.isMyTurn) {
            const step = GameState.onlineStep;

            if (step === "to" || step === "take") {
                applyServerDestinationHighlights();
            } 
            else if (step === "from") {
                // Reversão/Seleção:
                // Graças ao boardChanged, se acabámos de mover a peça, o dado foi apagado e isto não corre.
                // Se só clicámos para cancelar, o boardChanged é false, o dado existe, e isto corre!
                if (GameState.dice && GameState.dice.value) {
                    highlightMoveablePieces();
                } else {
                    clearHighlights();
                }
            }
        }
    }

    window.handleServerUpdate = handleServerUpdate;

    function applyServerDestinationHighlights() {
        const sel = GameState.serverSelected;

        // Se não há seleção ou se estamos na fase inicial ("from"), sai.
        if (!Array.isArray(sel) || sel.length === 0) return;
        if (GameState.onlineStep === "from") return;

        // Limpa destaques locais
        clearHighlights();
        
        const persp = getPerspectivePlayer();

        sel.forEach(cellIdx => {
            const { r, c } = cellIndexToRC(cellIdx);

            // 🟢 Agora que isOwnPiece está corrigido, isto vai FILTRAR a origem (14)
            // e deixar passar os destinos (16, etc.)
            if (isOwnPiece(r, c, cellIdx)) return; 

            const { vr, vc } = toView(r, c, persp);
            const el = cellElView(vr, vc);
            if (el) el.classList.add("hl");
        });
    }
});
