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

    const settingsIcon = settingsButton.querySelector("img");
    const loginIcon = userButton.querySelector("img");
    const regrasIcon = regrasButton.querySelector("img");
    const classIcon = classButton.querySelector("img");

    closedBox.addEventListener("click", () => {
        closedBox.classList.add("hidden");
        openWrap.classList.remove("hidden");
        logo.classList.remove("hidden");
    });

    const closeAllMenus = () => {
        [loginMenu, settingsMenu, regrasMenu, classMenu].forEach(menu => menu.classList.add("hidden"));
        loginIcon.src = "img/user_logo.png";
        settingsIcon.src = "img/settings_logo.png";
        regrasIcon.src = "img/regras_logo.png";
        classIcon.src = "img/classificacoes_logo.png";
    };

    userButton.addEventListener("click", () => {
        if (loginMenu.classList.contains("hidden")) {
            closeAllMenus();
            loginMenu.classList.remove("hidden");
            loginIcon.src = "img/user_logo_2.png";
        } else {
            loginMenu.classList.add("hidden");
            loginIcon.src = "img/user_logo.png";
        }
    });

    settingsButton.addEventListener("click", () => {
        if (settingsMenu.classList.contains("hidden")) {
            closeAllMenus();
            settingsMenu.classList.remove("hidden");
            settingsIcon.src = "img/settings_logo_2.png";
        } else {
            settingsMenu.classList.add("hidden");
            settingsIcon.src = "img/settings_logo.png";
        }
    });

    if (voltarButton) {
        voltarButton.addEventListener("click", () => {
            restartToModeSelection();
        });
    }

    if (desistirButton) {
        desistirButton.addEventListener("click", () => {
            if (!GameState.inGame) return;
            if (!isHumanTurnNow()) return;

            const winnerColor = GameState.vsAI
            ? GameState.aiColorLabel
            : (GameState.currentPlayer === "Azul" ? "Vermelho" : "Azul");
            const winnerDisplay = winnerLabelForDisplay(winnerColor);

            // guarda classificação já
            try {
            const nivel = GameState.vsAI ? (GameState.aiDifficulty || "Fácil") : "PvP";
            saveClassification(nivel, winnerDisplay);
            if (!classMenu.classList.contains("hidden")) renderClassifications();
            } catch (_) {}

            // mostra aviso curto e reinicia bem rápido
            const DESISTIR_DELAY = 1200; // ms
            setMsgTemp(`Jogador desistiu do jogo.\n${winnerDisplay} ganhou.`, DESISTIR_DELAY);

            setTimeout(() => {
            restartToModeSelection();
            desistirButton.classList.add("hidden");
            updateDesistirUI();
            }, DESISTIR_DELAY);
        });
    }





    regrasButton.addEventListener("click", () => {
        if (regrasMenu.classList.contains("hidden")) {
            closeAllMenus();
            regrasMenu.classList.remove("hidden");
            regrasIcon.src = "img/regras_logo_2.png";
        } else {
            regrasMenu.classList.add("hidden");
            regrasIcon.src = "img/regras_logo.png";
        }
    });

    classButton.addEventListener("click", () => {
        if (classMenu.classList.contains("hidden")) {
            closeAllMenus();
            renderClassifications();
            classMenu.classList.remove("hidden");
            classIcon.src = "img/classificacoes_logo_2.png";
        } else {
            classMenu.classList.add("hidden");
            classIcon.src = "img/classificacoes_logo.png";
        }
    });

    

    jogador.addEventListener("click", () => {
        jogador.classList.add("hidden");
        ia.classList.add("hidden");
        jogadorText.classList.remove("hidden");
        dadosWrap.classList.remove("hidden");
        if (desistirButton) desistirButton.classList.remove("hidden");

        GameState.inGame = true;
        GameState.stats.startTime = Date.now();
        GameState.stats.moves = 0;
        GameState.vsAI = false;                // <-- definir antes da mensagem
        toggleMsgPanel(true);                  // <-- garantir que o painel aparece

        announceAwaitRoll(GameState.currentPlayer);
        renderBoard();
        updateRollUI();
        updateDesistirUI();

    });


    ia.addEventListener("click", () => {
        jogador.classList.add("hidden");
        ia.classList.add("hidden");
        iaText.classList.remove("hidden");
        dadosWrap.classList.remove("hidden");
        desistirButton.classList.remove("hidden");

        // 1) Estado primeiro
        GameState.inGame = true;
        GameState.stats.startTime = Date.now();
        GameState.stats.moves = 0;
        GameState.vsAI = true;                 // IA ligada
        GameState.aiColorLabel = "Vermelho";   // IA é sempre Vermelho
        GameState.currentPlayer = getFirstPlayer(); // <-- corrigido!

        // 2) Mostrar painel de mensagens
        toggleMsgPanel(true);

        // 3) Desenhar UI
        renderBoard();
        updateRollUI();
        updateDesistirUI();


        // 4) Mensagem de arranque correta
        if (GameState.currentPlayer === GameState.aiColorLabel) {
            setMsg("A IA vai lançar os dados...");
            defer(aiMaybeAct, AI_DELAY.ROLL);
        } else {
            setMsg('Carregue em "Lançar Dados".');
        }
    });


    function baralharDados() {
        document.querySelectorAll(".dado").forEach(dado => {
            const cima = Math.random() < 0.5;
            dado.classList.toggle("up", cima);
            dado.classList.toggle("down", !cima);
        });
    }

    function resetDiceVisual() {
        document.querySelectorAll(".dado").forEach(d => {
            d.classList.remove("up");
            d.classList.add("down");
        });
    }

    const clearBtn = document.getElementById("clearButton");
        if (clearBtn) {
        clearBtn.addEventListener("click", () => {

            localStorage.removeItem("classificacoes");
            renderClassifications(); // atualiza a tabela e desativa o botão
        });
    }



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

    // --- Painel de mensagens (canto inferior esquerdo) ---
    let statusEl = document.getElementById("statusMsg");
    if (!statusEl) {
        // cria (ou reutiliza) o painel
        let panel = document.getElementById("msgPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "msgPanel";
            document.body.appendChild(panel);
        }

        statusEl = document.createElement("div");
        statusEl.id = "statusMsg";
        panel.appendChild(statusEl);
        toggleMsgPanel(false);

    }

    // mantém a tua função como está, só sem estilos inline
    function setMsg(t, { force = false } = {}) {
        const msgEl = document.getElementById("statusMsg");
        if (!msgEl) return;

        // Sem jogo a decorrer → silêncio
        if (!GameState.inGame && !force) {
            msgEl.textContent = "";
            return;
        }

        // Nunca mostrar só o cabeçalho
        if (!t) return;

        const isAIturn = GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel;
        const header = isAIturn ? "É a vez da IA jogar." : "É a sua vez de jogar.";
        msgEl.textContent = `${header}\n${t}`;
    }

    function setMsgTemp(texto, ms = 2000, { force = true } = {}) {
        // garante que o painel está visível
        toggleMsgPanel(true);

        setMsg(texto, { force });

        clearTimeout(setMsgTemp._timer);
        setMsgTemp._timer = setTimeout(() => {
            // limpa a mensagem e volta a esconder o painel
            setMsg("", { force: true });
            toggleMsgPanel(false);
        }, ms);
    }


    function toggleMsgPanel(show) {
        document.getElementById("msgPanel")?.classList.toggle("hidden", !show);
    }


    // Quem joga agora?
    function isAITurnNow() {
        return GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel;
    }

        // Texto genérico "é a sua vez / é a vez da IA"
    function turnHeaderFor(playerLabel = GameState.currentPlayer) {
        const isAI = GameState.vsAI && playerLabel === GameState.aiColorLabel;
        return isAI ? "É a vez da IA jogar.\n" : "É a sua vez de jogar.\n";
    }

        // Mensagem quando estamos à espera do lançamento
    function announceAwaitRoll(playerLabel = GameState.currentPlayer) {
        const isAI = GameState.vsAI && playerLabel === GameState.aiColorLabel;
        const body = isAI ? "A IA vai lançar os dados..." : "Carregue em \"Lançar Dados\".";
        setMsg(body);
    }


    function buildRollMsg(value, isAI, canRepeat) {
        const header = `Saiu ${value}\n`;
        if (isAI) {
            return `${header}\n- A IA lançou os dados.\n- A IA vai escolher uma peça e uma casa...`;
        }
        const repeatNote = canRepeat
            ? `\n- Como tirou 1, 4 ou 6, pode voltar a lançar no fim da sua jogada.`
            : "";
        return `${header}\n- Escolha uma peça para jogar.${repeatNote}`;
    }



    const style = document.createElement("style");
    style.textContent = `.tabuleiro div.hl{outline:3px solid #e6b97e;box-shadow:0 0 0 2px #2a1b10 inset;cursor:pointer;}`;
    document.head.appendChild(style);

    function clearHighlights() {
        document.querySelectorAll(".tabuleiro div.hl").forEach(el => el.classList.remove("hl"));
    }

    // state 0|1|2 = (0: nunca moveu) (1: moveu e nunca esteve na 4.ª) (2: já esteve na 4.ª)
    const STAGE = { NOT_MOVED: 0, MOVED_NOT_LAST: 1, HAS_BEEN_LAST: 2 };

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
        mustPass: false,     // ← novo: estamos num turno sem jogadas possíveis
        nextPlayer: null, 
        inGame: false,
        aiTimer: null,
        isRolling: false,
        stats: { startTime: null, moves: 0 }  
    };

    function winnerLabelForDisplay(winnerColor) {
        // Em PvP mantemos as cores; em vsIA mapeamos para "Jogador"/"IA"
        if (!GameState.vsAI) return winnerColor;
        return (winnerColor === GameState.aiColorLabel) ? "IA" : "Jogador";
    }


    // helper (mete isto perto do defer)
    function scheduleAI(ms) {
        if (!GameState.vsAI) return;
        if (GameState.aiTimer) clearTimeout(GameState.aiTimer);
        GameState.aiTimer = setTimeout(() => {
            GameState.aiTimer = null;
            aiMaybeAct();
        }, ms);
    }

    // ---- Classificações (persistência + UI) ----
    function saveClassification(nivelAI, vencedorColor) {
        // Converte sempre a cor para Jogador / IA (quando aplicável)
        const vencedor = winnerLabelForDisplay(vencedorColor);

        const classificacoes = JSON.parse(localStorage.getItem("classificacoes")) || [];

        // Gera data sem vírgula
        const data = new Date()
            .toLocaleString("pt-PT", { hour12: false })
            .replace(",", "");

        // Guarda o registo formatado
        classificacoes.push({ data, nivelAI, vencedor });

        // Só mantém as últimas 10 jogadas
        const limit = 10;
        const classificacoesLimitadas = classificacoes.slice(-limit);

        localStorage.setItem("classificacoes", JSON.stringify(classificacoesLimitadas));

        renderClassifications();
    }



    function renderClassifications() {
        const tbody = document.getElementById("classTbody");
        const clearBtn = document.getElementById("clearButton");
        if (!tbody) return;

        const list = JSON.parse(localStorage.getItem("classificacoes")) || [];

        // último → primeiro (mais recentes em cima)
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

        // botão ativo só quando há dados
        if (clearBtn) clearBtn.disabled = list.length === 0;
    }



    //volta ao ecrã de seleção de modo e reinicia o tabuleiro
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


        resetDiceVisual();
        initBoardState(GameState.cols);
        renderBoard();
        clearHighlights();
        updateRollUI();
    }

    const nivelAISelect = document.querySelector(".nivelAI");
    if (nivelAISelect) {
        GameState.aiDifficulty = nivelAISelect.value || "Fácil";
        nivelAISelect.addEventListener("change", () => {
            GameState.aiDifficulty = nivelAISelect.value || "Fácil";
            setMsg(`Nível da IA: ${GameState.aiDifficulty}`);
        });
    }

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
                defer(aiMaybeAct, AI_DELAY.ROLL);
            }
        }
    });

    const AI_DELAY = { ROLL: 1800, PICK: 3500, BRANCH: 2200, CHAIN: 1800 };
    function defer(fn, ms) { setTimeout(fn, ms); }

    function toView(r, c, player) {
        if (player === "Azul") return { vr: r, vc: c };
        return { vr: GameState.rows - 1 - r, vc: GameState.cols - 1 - c };
    }

    // Em vs IA a perspetiva é SEMPRE Azul (humano). PvP mantém a rotação por jogador.
    function getPerspectivePlayer() {
        return "Azul";
    }

    function fromView(vr, vc, player) {
        if (player === "Azul") return { r: vr, c: vc };
        return { r: GameState.rows - 1 - vr, c: GameState.cols - 1 - vc };
    }

    function updateRollUI() {
        const btn = document.getElementById("baralharDados");

        // 👉 garantir que o botão Desistir é sempre atualizado,
        // mesmo que a função faça return mais abaixo
        updateDesistirUI();

        if (!btn) return;

        // 1) Fim do jogo → mostra sempre "Jogar de novo"
        if (GameState.mode === "finished") {
            btn.style.display = "";
            btn.disabled = false;
            btn.textContent = "Jogar de novo";
            return;
        }

        // 2) Se for a vez da IA, esconde e sai já (evita flicker)
        const aiTurn = GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel;
        if (aiTurn) {
            btn.style.display = "none";
            return;
        }

        // 3) Caso "Passar a vez" OU "Relançar"
        if (GameState.mustPass) {
            btn.style.display = "";
            btn.disabled = false;
            btn.textContent = (GameState.nextPlayer === GameState.currentPlayer)
            ? "Lançar Dados"
            : "Passar a vez";
            return;
        }

        // 4) Jogador humano e à espera de lançamento
        if (GameState.mode === "awaitRoll") {
            btn.style.display = "";
            btn.disabled = false;
            btn.textContent = "Lançar Dados";
            return;
        }

        // 5) Outros modos → esconder
        btn.style.display = "none";
    }


    function updateDesistirUI() {
        if (!desistirButton) return;

        const hide = !GameState.inGame || GameState.mode === "finished" || !isHumanTurnNow();
        desistirButton.classList.toggle("hidden", hide);
        desistirButton.disabled = hide; // belt & suspenders
    }



    function dirForRow(r) { return (r === 3 || r === 1) ? +1 : -1; }
    function initialRow(owner) { return owner === "A" ? 3 : 0; }

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
                defer(aiMaybeAct, AI_DELAY.ROLL);
            }
            } else {
            setMsg(""); // ainda não escolheste modo
        }

        resetDiceVisual();
        clearHighlights();
        updateRollUI();
    }

    const sizeSelect = document.getElementById("sizeSelect");
    if (sizeSelect && boardEl) {
        resetAndRender(parseInt(sizeSelect.value, 10));
        sizeSelect.addEventListener("change", e => {
            resetAndRender(parseInt(e.target.value, 10));
        });
    }

    function lerLancamentoPaus() {
        const claros = Array.from(document.querySelectorAll(".dado"))
            .reduce((acc, d) => acc + (d.classList.contains("up") ? 1 : 0), 0);
        const value = claros === 0 ? 6 : claros;
        const canRepeat = (value === 1 || value === 4 || value === 6);
        return { sum: claros, value, canRepeat };
    }

    const btnDados = document.getElementById("baralharDados");
    if (btnDados) {
        btnDados.addEventListener("click", () => {
            if (GameState.mode === "finished") {
            restartToModeSelection();
            return;
            }
            if (GameState.isRolling) return;

            // Passar/Relançar sem lançar
            if (GameState.mode === "awaitRoll" && GameState.mustPass) {
            GameState.mustPass = false;
            GameState.currentPlayer = GameState.nextPlayer || GameState.currentPlayer;
            GameState.nextPlayer = null;
            announceAwaitRoll(GameState.currentPlayer);
            updateRollUI();
            scheduleAI(AI_DELAY.CHAIN);
            return;
            }

            // --- Lançamento real (animação + leitura) ---
            GameState.isRolling = true;

            // animação curtinha (um único sítio a baralhar)
            const SPINS = 8;      // nº de “baralhadas” visuais
            const STEP  = 60;     // ms entre baralhadas
            for (let i = 0; i < SPINS; i++) {
            setTimeout(baralharDados, i * STEP);
            }

            // lê o resultado uma única vez, no fim da animação
            setTimeout(() => {
            const d = lerLancamentoPaus();
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
            // 👉 só destacamos peças quando for a vez do humano
            if (!isAITurnNow()) {
                highlightMoveablePieces();
            }

            GameState.isRolling = false;        // <- só aqui voltamos a permitir novo lance
            scheduleAI(AI_DELAY.PICK);          // se for IA, segue para escolher peça
            }, SPINS * STEP + 10);
        });
    }


    function meOwner(label) { return label === "Azul" ? "A" : "V"; }
    function onFourthRow(r, owner) { return (owner === "A" && r === 0) || (owner === "V" && r === 3); }
    function hasOwnInInitialRow(owner) {
        const row = initialRow(owner);
        return GameState.board[row].some(cell => cell && cell.owner === owner);
    }

    function isOwnPiece(r, c) {
        const me = meOwner(GameState.currentPlayer);
        const v = GameState.board[r][c];
        return v && v.owner === me;
    }

    function canLand(r, c) {
        const me = meOwner(GameState.currentPlayer);
        const v = GameState.board[r][c];
        return !v || v.owner !== me;
    }

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
                        const up   = (piece.stage === STAGE.HAS_BEEN_LAST) ? null : { r: 0, c: curC };
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
                } else { // owner === "V"
                    if (curR === 1) { curR = 2; rem--; continue; }
                    if (curR === 2) {
                        const up   = (piece.stage === STAGE.HAS_BEEN_LAST) ? null : { r: 3, c: curC };
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

    function walkSteps(r, c, rem) {
        let curR = r, curC = c, steps = rem;
        while (steps > 0) {
            const d = dirForRow(curR);
            if (d === +1 && curC < GameState.cols - 1) { curC++; steps--; continue; }
            if (d === -1 && curC > 0) { curC--; steps--; continue; }
            if (steps > 0) {
                if (curR === 3) { curR = 2; steps--; }
                else if (curR === 2) { curR = 1; steps--; }
                else if (curR === 1) { curR = 0; steps--; }
                else if (curR === 0) { curR = 1; steps--; }
            }
        }
        return { r: curR, c: curC };
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

    function checkWin() {
        const a = countPieces("A");
        const v = countPieces("V");

        if (a === 0 || v === 0) {
            // Determina cor vencedora
            const winnerColor = a > 0 ? "Azul" : "Vermelho";

            // Usa a função que já converte para "Jogador"/"IA" no modo vs AI
            const winnerDisplay = winnerLabelForDisplay(winnerColor);

            // Mostra mensagem final
            setMsg(`Fim do jogo!\n${winnerDisplay} ganhou!`);

            GameState.mode = "finished";
            clearHighlights();
            GameState.dice = { sum: null, value: null, canRepeat: false };

            updateRollUI();
            updateDesistirUI();

            // Guarda nas classificações
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
            clearHighlights();
            renderBoard();
        } else {
            GameState.currentPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
            GameState.mode = "awaitRoll";
            announceAwaitRoll(GameState.currentPlayer);
            clearHighlights();
            renderBoard();
        }
       

        updateRollUI();
        scheduleAI(AI_DELAY.CHAIN);

    }

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

        if (cells.length === 0) {
            GameState.mustPass = true;

            const isAI = GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel;
            const v = GameState.dice.value;

            if (GameState.dice.canRepeat) {
                // Mantém o mesmo jogador para relançar
                GameState.nextPlayer = GameState.currentPlayer;
                setMsg(
                `Saiu ${v}.\n` +
                `Não é uma jogada válida.\n` +
                `Como saiu ${v}, ${isAI ? "a IA" : "lanca"} de novo o dado.`
                );
            } else {
                // Passa a vez para o outro
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

            // 🔧 Agenda imediatamente o próximo passo da IA
            if (isAI) {
                if (GameState.nextPlayer === GameState.currentPlayer) {
                // IA vai relançar
                scheduleAI(AI_DELAY.ROLL);
                } else {
                // IA passa a vez e o humano entra
                scheduleAI(AI_DELAY.CHAIN);
                }
            }
            return;
        }
    }



    function progressHeuristic(ownerChar, from, to) {
        const rowScore = ownerChar === "A" ? (3 - to.r) : (to.r - 0);
        const d = dirForRow(from.r);
        const horizGain = (to.r === from.r) ? ((to.c - from.c) * d) : 0;
        const branchBonus = (from.r === 1 && to.r !== from.r) ? 0.5 : 0;
        return rowScore * 100 + horizGain * 5 + branchBonus;
    }

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
                const end = walkStepsOwner(me, opt.r, opt.c, probe.remaining); // "me" é "A" ou "V"
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

    // Fácil: evita capturar; Médio: aleatório; Difícil: captura primeiro, senão maior progresso
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

    function isAITurn() {
        return GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel && GameState.mode !== "finished";
    }

    function isHumanTurnNow() {
        return GameState.inGame &&
                (!GameState.vsAI || GameState.currentPlayer !== GameState.aiColorLabel);
    }


    function aiMaybeAct() {
        if (!isAITurn()) return;

        // Se ainda estiver a "rolar", aguarda um pouco
        if (GameState.isRolling) {
            scheduleAI(300);
            return;
        }

        if (GameState.mode === "awaitRoll") {
            if (GameState.mustPass) {
            // "Passar" ou "Relançar" é tratado via botão → simula o clique
            const btn = document.getElementById("baralharDados");
            if (btn && !btn.disabled) btn.click();
            // o handler do botão já agenda o próximo passo
            return;
            }
            // Lançar dados (simula clique no botão)
            const btn = document.getElementById("baralharDados");
            if (btn && !btn.disabled) {
            btn.click(); // o handler agenda o PICK
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
                `Como saiu ${v}, a IA lanca de novo o dado.`
                );
                // mantém o mesmo jogador para relançar
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

    function walkStepsOwner(ownerChar, startR, startC, rem) {
        let curR = startR, curC = startC, steps = rem;
        while (steps > 0) {
            const d = dirForRow(curR);
            const canRight = (d === +1 && curC < GameState.cols - 1);
            const canLeft  = (d === -1 && curC > 0);

            if ((d === +1 && canRight) || (d === -1 && canLeft)) {
            curC += d; steps--; continue;
            }

            // transição vertical depende do lado do dono
            curR = (ownerChar === "A")
            ? (curR === 3 ? 2 : curR === 2 ? 1 : curR === 1 ? 0 : 1)
            : (curR === 0 ? 1 : curR === 1 ? 2 : curR === 2 ? 3 : 2);
            steps--;
        }
        return { r: curR, c: curC };
    }


    function onCellClick(e) {
        const vr = parseInt(e.currentTarget.dataset.vr, 10);
        const vc = parseInt(e.currentTarget.dataset.vc, 10);
        const persp = getPerspectivePlayer();
        const { r, c } = fromView(vr, vc, persp);

        // se for a vez da IA, ignorar input do utilizador
        if (isAITurnNow()) return;


        if (GameState.mode === "finished") return;

        if (GameState.mode === "awaitRoll") {
            setMsg("Primeiro lança os dados.");
            return;
        }

        function nextRowForOwner(ownerChar, curR) {
            if (ownerChar === "A") {
                if (curR === 3) return 2;
                if (curR === 2) return 1;
                if (curR === 1) return 0;
                if (curR === 0) return 1;
            } else {
                if (curR === 0) return 1;
                if (curR === 1) return 2;
                if (curR === 2) return 3;
                if (curR === 3) return 2;
            }
            return curR;
        }


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

                // 👉 calcular o DESTINO FINAL de cada ramificação (depois de gastar 'remaining')
                const endsResolved = fixedOpts
                    .map(o => ({ end: walkStepsOwner(piece.owner, o.r, o.c, dest.remaining) }))
                    .filter(p => canLand(p.end.r, p.end.c)); // só destinos pousáveis

                // se por acaso nenhuma ramificação tiver destino válido, aborta
                if (endsResolved.length === 0) {
                    setMsg("Jogada inválida.");
                    GameState.mode = "awaitPiece";
                    clearHighlights();
                    highlightMoveablePieces();
                    return;
                }

                // 👉 destacar as casas de DESTINO FINAL (não as de entrada)
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

        // Escolha após bifurcação (sair da 3.ª linha)
        if (GameState.mode === "awaitDestination") {
            const from = GameState.selected;
            if (!from) { GameState.mode = "awaitPiece"; return; }

            // cancelar a seleção clicando na própria peça
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

            // 👉 resolver os DESTINOS FINAIS de cada opção com o remaining guardado
            const resolved = options.map(o => ({
                entry: o,
                end: walkStepsOwner(ownerChar, o.r, o.c, from.remaining)
            }));

            // 👉 agora escolhemos pela casa de DESTINO FINAL
            const picked = resolved.find(p => p.end.r === clickedModel.r && p.end.c === clickedModel.c);

            if (!picked) {
                setMsg("Clica numa das casas destacadas ou clica na peça para cancelar.");
                const endsView = resolved.map(p => toView(p.end.r, p.end.c, persp));
                clearHighlights();
                endsView.forEach(({ vr, vc }) => cellElView(vr, vc)?.classList.add("hl"));
                return;
            }

            // destino já calculado
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
});
