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

    const settingsIcon = settingsButton.querySelector("img");
    const loginIcon = userButton.querySelector("img");
    const regrasIcon = regrasButton.querySelector("img");
    const classIcon = classButton.querySelector("img");

    closedBox.addEventListener("click", () => {
        closedBox.classList.add("hidden");
        openWrap.classList.remove("hidden");
        logo.classList.remove("hidden");
    });

    userButton.addEventListener("click", () => {
        loginMenu.classList.toggle("hidden");
        loginIcon.src = loginMenu.classList.contains("hidden") ? "img/user_logo.png" : "img/user_logo_2.png";
    });

    settingsButton.addEventListener("click", () => {
        settingsMenu.classList.toggle("hidden");
        settingsIcon.src = settingsMenu.classList.contains("hidden") ? "img/settings_logo.png" : "img/settings_logo_2.png";
    });

    regrasButton.addEventListener("click", () => {
        regrasMenu.classList.toggle("hidden");
        regrasIcon.src = regrasMenu.classList.contains("hidden") ? "img/regras_logo.png" : "img/regras_logo_2.png";
    });

    classButton.addEventListener("click", () => {
        classMenu.classList.toggle("hidden");
        classIcon.src = classMenu.classList.contains("hidden") ? "img/classificacoes_logo.png" : "img/classificacoes_logo_2.png";
    });

    jogador.addEventListener("click", () => {
        jogador.classList.add("hidden");
        ia.classList.add("hidden");
        jogadorText.classList.remove("hidden");
        dadosWrap.classList.remove("hidden");
    });

    ia.addEventListener("click", () => {
        jogador.classList.add("hidden");
        ia.classList.add("hidden");
        iaText.classList.remove("hidden");
        dadosWrap.classList.remove("hidden");
    });

    function baralharDados() {
        document.querySelectorAll(".dado").forEach(dado => {
            const cima = Math.random() < 0.5;
            dado.classList.toggle("up", cima);
            dado.classList.toggle("down", !cima);
        });
    }

    function initDados() {
        baralharDados();
        const botao = document.getElementById("baralharDados");
        if (botao) botao.addEventListener("click", baralharDados);
    }

    window.addEventListener("DOMContentLoaded", initDados);

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

    let statusEl = document.getElementById("statusMsg");
    if (!statusEl) {
        statusEl = document.createElement("div");
        statusEl.id = "statusMsg";
        statusEl.style.marginTop = "8px";
        statusEl.style.color = "#f2e7c8";
        statusEl.style.fontWeight = "bold";
        const wrap = document.getElementById("dadosWrap");
        if (wrap) wrap.appendChild(statusEl);
    }
    function setMsg(t) { statusEl.textContent = t; }

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
        board: []
    };

    //volta ao ecrã de seleção de modo e reinicia o tabuleiro
    function restartToModeSelection() {
        jogador.classList.remove("hidden");
        ia.classList.remove("hidden");
        jogadorText.classList.add("hidden");
        iaText.classList.add("hidden");
        if (dadosWrap) dadosWrap.classList.add("hidden");

        GameState.mode = "awaitRoll";
        GameState.currentPlayer = "Azul";
        GameState.selected = null;
        GameState.dice = { sum: null, value: null, canRepeat: false };

        initBoardState(GameState.cols);
        renderBoard();
        clearHighlights();

        setMsg("Escolhe o modo de jogo (Jogador vs Jogador / IA).");
        updateRollUI(); 
    }

    GameState.vsAI = false;
    GameState.aiColorLabel = "Vermelho";
    GameState.aiDifficulty = "Fácil";  // nível IA; default = Fácil

    const nivelAISelect = document.querySelector(".nivelAI"); 
    if (nivelAISelect) {
        GameState.aiDifficulty = nivelAISelect.value || "Fácil";
        nivelAISelect.addEventListener("change", () => {
            GameState.aiDifficulty = nivelAISelect.value || "Fácil";
            setMsg(`Nível da IA: ${GameState.aiDifficulty}`);
        });
    }

    document.getElementById("jogador")?.addEventListener("click", () => {
        GameState.vsAI = false;
        GameState.aiColorLabel = "Vermelho";
    });

    document.getElementById("ia")?.addEventListener("click", () => {
        GameState.vsAI = true;
        GameState.aiColorLabel = "Vermelho";
    });

    const AI_DELAY = { ROLL: 1200, PICK: 1500, BRANCH: 1500, CHAIN: 1000 };
    
    function defer(fn, ms) { setTimeout(fn, ms); }

    function toView(r, c, player) {
        if (player === "Azul") return { vr: r, vc: c };
        return { vr: GameState.rows - 1 - r, vc: GameState.cols - 1 - c };
    }

    function fromView(vr, vc, player) {
        if (player === "Azul") return { r: vr, c: vc };
        return { r: GameState.rows - 1 - vr, c: GameState.cols - 1 - vc };
    }

    function getPerspectivePlayer() {
        if (GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel) {
            return (GameState.aiColorLabel === "Azul") ? "Vermelho" : "Azul";
        }
        return GameState.currentPlayer;
    }

    function updateRollUI() {
        const btn = document.getElementById("baralharDados");
        if (!btn) return;
        if (GameState.mode === "finished") {
            btn.disabled = false;
            btn.textContent = "Jogar de novo";
            return;
        }
        if (GameState.mode === "awaitRoll") {
            btn.disabled = false;
            btn.textContent = `Lançar Dados — ${GameState.currentPlayer}`;
        } else {
            btn.disabled = true;
            btn.textContent = `Lançar Dados`;
        }
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
        GameState.mode = "awaitRoll";
        GameState.selected = null;
        GameState.dice = { sum: null, value: null, canRepeat: false };
        setMsg("Carrega em Lançar Dados para começar.");
        clearHighlights();
        updateRollUI();
        defer(aiMaybeAct, AI_DELAY.ROLL);
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
            if (GameState.mode !== "awaitRoll") return;
            setTimeout(() => {
                const d = lerLancamentoPaus();
                GameState.dice = d;
                GameState.mode = "awaitPiece";
                GameState.selected = null;
                setMsg(`Valor: ${d.value} — escolhe uma peça ${GameState.currentPlayer}.`);
                clearHighlights();
                updateRollUI();
                highlightMoveablePieces();
                defer(aiMaybeAct, AI_DELAY.PICK);
            }, 0);
        });
    }

    function meOwner(label) { return label === "Azul" ? "A" : "V"; }

    // “4.ª linha só mexe se a 1.ª da mesma cor estiver vazia”
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
            if (d === -1 && curC > 0)               { curC--; rem--; continue; }

            if (rem > 0) {
                if (curR === 3) { curR = 2; rem--; continue; }
                if (curR === 0) { curR = 1; rem--; continue; }

                if (piece.owner === "A") {
                    if (curR === 2) { curR = 1; rem--; continue; }
                    if (curR === 1) {
                        const up   = (piece.stage === STAGE.HAS_BEEN_LAST) ? null : { r: 0, c: curC };
                        const down = { r: 2, c: curC };
                        const options = [];
                        if (up) options.push(up);
                        options.push(down);
                        return { needsChoice: options.length > 1, options, remaining: rem - 1 };
                    }
                } else {
                    if (curR === 1) { curR = 2; rem--; continue; }
                    if (curR === 2) {
                        const up   = (piece.stage === STAGE.HAS_BEEN_LAST) ? null : { r: 3, c: curC };
                        const down = { r: 1, c: curC };
                        const options = [];
                        if (up) options.push(up);
                        options.push(down);
                        return { needsChoice: options.length > 1, options, remaining: rem - 1 };
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
            const winner = a > 0 ? "Azul" : "Vermelho";
            setMsg(`Fim do jogo! Ganha ${winner}.`);
            GameState.mode = "finished";
            clearHighlights();
            GameState.dice = { sum: null, value: null, canRepeat: false };
            updateRollUI();
            return true;
        }
        return false;
    }

    function endTurnOrRepeat() {
        const repeated = GameState.dice.canRepeat;
        GameState.dice = { sum: null, value: null, canRepeat: false };
        if (repeated) {
            GameState.mode = "awaitRoll";
            setMsg(`Tiraste 1, 4 ou 6. Lança novamente (${GameState.currentPlayer}).`);
            clearHighlights();
            renderBoard();
        } else {
            GameState.currentPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
            GameState.mode = "awaitRoll";
            setMsg(`Vez de ${GameState.currentPlayer}. Carrega em Lançar Dados.`);
            clearHighlights();
            renderBoard();
        }
        updateRollUI();
        defer(aiMaybeAct, AI_DELAY.CHAIN);
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
            if (GameState.dice.canRepeat) {
                setMsg(`Sem jogada válida com ${GameState.dice.value}. Lança novamente.`);
                GameState.mode = "awaitRoll";
            } else {
                setMsg("Sem jogada válida. Passa a vez.");
                GameState.currentPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
                GameState.mode = "awaitRoll";
            }
            GameState.dice = { sum: null, value: null, canRepeat: false };
            clearHighlights();
            renderBoard();
            updateRollUI();
        }
    }


    // IA
    function progressHeuristic(ownerChar, from, to) {
        const rowScore = ownerChar === "A" ? (3 - to.r) : (to.r - 0); // [0..3]
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
                moves.push({ from: { r, c }, to: { r, c: nc }, capture: cap });
                return moves;
            }
            const nr = (piece.owner === "A") ? r - 1 : r + 1;
            if (nr >= 0 && nr < GameState.rows && canLand(nr, c)) {
                const cap = !!(GameState.board[nr][c] && GameState.board[nr][c].owner !== me);
                moves.push({ from: { r, c }, to: { r: nr, c }, capture: cap });
            }
            return moves;
        }

        const probe = possibleAdvanceFrom(r, c, steps);
        if (probe.needsChoice) {
            for (const opt of probe.options) {
                const end = walkSteps(opt.r, opt.c, probe.remaining);
                if (end.r == null) continue;
                if (!canLand(end.r, end.c)) continue;
                const cap = !!(GameState.board[end.r][end.c] && GameState.board[end.r][end.c].owner !== me);
                moves.push({ from: { r, c }, to: { r: end.r, c: end.c }, capture: cap });
            }
            return moves;
        }

        if (probe.r != null && canLand(probe.r, probe.c)) {
            const cap = !!(GameState.board[probe.r][probe.c] && GameState.board[probe.r][probe.c].owner !== me);
            moves.push({ from: { r, c }, to: { r: probe.r, c: probe.c }, capture: cap });
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

    // seleção de jogada consoante a dificuldade
    // Fácil: NÃO capturar (evita capturas; só captura se não houver outra jogada)
    // Médio: jogada aleatória válida
    // Difícil: prioriza SEMPRE capturas; se não houver, escolhe a de maior progresso
    function aiPickMove(moves, difficulty) {
        if (!moves.length) return null;

        if (difficulty === "Fácil") {
            const naoCapturas = moves.filter(m => !m.capture);
            const pool = naoCapturas.length ? naoCapturas : moves; // se não houver alternativa, aceita capturar
            return pool[Math.floor(Math.random() * pool.length)];
        }

        if (difficulty === "Médio") {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        // Difícil
        const caps = moves.filter(m => m.capture);
        if (caps.length) {
            // desempata por melhor progresso
            caps.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
            return caps[0];
        }
        // sem capturas: escolhe a jogada de maior progresso
        const sorted = [...moves].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
        return sorted[0];
    }

    function isAITurn() {
        return GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel && GameState.mode !== "finished";
    }

    function aiMaybeAct() {
        if (!isAITurn()) return;

        if (GameState.mode === "awaitRoll") {
            const btn = document.getElementById("baralharDados");
            if (btn && !btn.disabled) {
                btn.click();
                defer(aiMaybeAct, AI_DELAY.PICK);
            }
            return;
        }

        if (GameState.mode === "awaitPiece") {
            const d = GameState.dice.value;
            const moves = getValidMovesFor(GameState.currentPlayer, d);
            if (!moves.length) {
                if (GameState.dice.canRepeat) {
                    setMsg(`Sem jogada válida com ${d}. Lança novamente.`);
                    GameState.mode = "awaitRoll";
                } else {
                    setMsg("Sem jogada válida. Passa a vez.");
                    GameState.currentPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
                    GameState.mode = "awaitRoll";
                }
                GameState.dice = { sum: null, value: null, canRepeat: false };
                clearHighlights();
                renderBoard();
                updateRollUI();
                defer(aiMaybeAct, AI_DELAY.BRANCH);
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

    function onCellClick(e) {
        const vr = parseInt(e.currentTarget.dataset.vr, 10);
        const vc = parseInt(e.currentTarget.dataset.vc, 10);
        const persp = getPerspectivePlayer();
        const { r, c } = fromView(vr, vc, persp);

        if (GameState.mode === "finished") return;

        if (GameState.mode === "awaitRoll") {
            setMsg("Primeiro lança os dados.");
            return;
        }

        function nextRowForOwner(ownerChar, curR) {
            if (ownerChar === "A") {
                // Azul: 3 -> 2 -> 1 -> 0 -> 1 -> 2 -> 3 ...
                if (curR === 3) return 2;
                if (curR === 2) return 1;
                if (curR === 1) return 0;
                if (curR === 0) return 1;
            } else {
                // Vermelho: 0 -> 1 -> 2 -> 3 -> 2 -> 1 -> 0 ...
                if (curR === 0) return 1;
                if (curR === 1) return 2;
                if (curR === 2) return 3;
                if (curR === 3) return 2;
            }
            return curR;
        }
        function walkStepsOwner(ownerChar, startR, startC, rem) {
            let curR = startR, curC = startC, steps = rem;
            while (steps > 0) {
                const d = dirForRow(curR);
                const canRight = (d === +1 && curC < GameState.cols - 1);
                const canLeft  = (d === -1 && curC > 0);

                if ((d === +1 && canRight) || (d === -1 && canLeft)) {
                    curC += d;
                    continue;
                }
                if (steps > 0) {
                    const nr = nextRowForOwner(ownerChar, curR);
                    curR = nr;
                    steps--;
                }
            }
            return { r: curR, c: curC };
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

                const optsView = fixedOpts.map(o => toView(o.r, o.c, persp));
                clearHighlights();
                optsView.forEach(({ vr, vc }) => {
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

        // --- Escolha após bifurcação (sair da 3.ª linha) ---
        if (GameState.mode === "awaitDestination") {
            const from = GameState.selected;
            if (!from) { GameState.mode = "awaitPiece"; return; }

            const piece = GameState.board[from.r][from.c];
            const ownerChar = piece?.owner || "A";

            const options = Array.isArray(from.options) ? from.options : [];

            const clickedModel = fromView(vr, vc, persp);
            const picked = options.find(o => o.r === clickedModel.r && o.c === clickedModel.c);

            if (!picked) {
                setMsg("Clica numa das casas destacadas.");
                const optsView = options.map(o => toView(o.r, o.c, persp));
                clearHighlights();
                optsView.forEach(({ vr, vc }) => cellElView(vr, vc)?.classList.add("hl"));
                return;
            }

            const end = walkStepsOwner(ownerChar, picked.r, picked.c, from.remaining);
            if (!canLand(end.r, end.c)) {
                setMsg("Destino inválido.");
                const optsView = options.map(o => toView(o.r, o.c, persp));
                clearHighlights();
                optsView.forEach(({ vr, vc }) => cellElView(vr, vc)?.classList.add("hl"));
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
