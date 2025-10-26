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

    /* ===== UI ===== */
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

    /* ===== Estado ===== */
    const GameState = {
        mode: "awaitRoll",
        currentPlayer: "Azul",
        dice: { sum: null, value: null, canRepeat: false },
        selected: null,
        rows: 4,
        cols: parseInt(document.getElementById("sizeSelect")?.value || "9", 10),
        board: []
    };    
    
    /* === MODO IA === */
    GameState.vsAI = false;              
    GameState.aiColorLabel = "Vermelho"; 

    document.getElementById("jogador")?.addEventListener("click", () => {
        GameState.vsAI = false;
        GameState.aiColorLabel = "Vermelho";
    });

    document.getElementById("ia")?.addEventListener("click", () => {
        GameState.vsAI = true;
        GameState.aiColorLabel = "Vermelho";
    });

    /* ==== IA: Delays ==== */
    const AI_DELAY = {
    ROLL:   1200, 
    PICK:   1500,
    BRANCH: 1500,
    CHAIN:  1000  
    };

    function defer(fn, ms){ setTimeout(fn, ms); }

    /* ===== Perspetiva (NOVO) ===== */
    function toView(r, c, player) {
        if (player === "Azul") return { vr: r, vc: c };
        return { vr: GameState.rows - 1 - r, vc: GameState.cols - 1 - c };
    }
    function fromView(vr, vc, player) {
        if (player === "Azul") return { r: vr, c: vc };
        return { r: GameState.rows - 1 - vr, c: GameState.cols - 1 - vc };
    }

    // não roda o tabuleiro quando é a vez do AI
    function getPerspectivePlayer(){
        if (GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel) {
            return (GameState.aiColorLabel === "Azul") ? "Vermelho" : "Azul";
        }
        return GameState.currentPlayer;
    } 

    function updateRollUI() {
        const btn = document.getElementById("baralharDados");
        if (!btn) return;
        if (GameState.mode === "awaitRoll") {
            btn.disabled = false;
            btn.textContent = `Lançar Dados — ${GameState.currentPlayer}`;
        } else {
            btn.disabled = true;
            btn.textContent = `Lançar Dados`;
        }
    }

    function dirForRow(r) { return (r === 0 || r === 2) ? -1 : +1; }
    function initialRow(owner) { return owner === "A" ? 3 : 0; }

    function isFrontOfStartRow(r, c) {
        const cell = GameState.board[r][c];
        if (!cell) return false;
        const owner = cell.owner;
        if (r !== initialRow(owner) || cell.moved) return true;
        const dir = dirForRow(r);
        if (dir === +1) {
            for (let cc = GameState.cols - 1; cc >= 0; cc--) {
                const v = GameState.board[r][cc];
                if (v && v.owner === owner && v.moved === false) return cc === c;
            }
        } else {
            for (let cc = 0; cc < GameState.cols; cc++) {
                const v = GameState.board[r][cc];
                if (v && v.owner === owner && v.moved === false) return cc === c;
            }
        }
        return false;
    }

    /* ===== Tabuleiro ===== */
    const boardEl = document.getElementById("tabuleiro");

    function cellElView(vr, vc) {
        return document.querySelector(`.tabuleiro div[data-vr="${vr}"][data-vc="${vc}"]`);
    }

    function initBoardState(cols) {
        GameState.cols = cols;
        GameState.board = Array.from({ length: GameState.rows }, (_, r) =>
            Array.from({ length: GameState.cols }, (_, c) => {
                if (r === 3) return { owner: "A", moved: false };
                if (r === 0) return { owner: "V", moved: false };
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

    /* ===== Dados ===== */
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
            if (GameState.mode !== "awaitRoll") return;
            setTimeout(() => {
                const d = lerLancamentoPaus();
                GameState.dice = d;
                GameState.mode = "awaitPiece";
                GameState.selected = null;
                setMsg(`Valor: ${d.value} ${d.canRepeat ? "(repete)" : ""} — escolhe uma peça ${GameState.currentPlayer}.`);
                clearHighlights();
                updateRollUI();
                highlightMoveablePieces();
                defer(aiMaybeAct, AI_DELAY.PICK);
            }, 0);
        });
    }

    /* ===== Movimento ===== */
    function isOwnPiece(r, c) {
        const me = GameState.currentPlayer === "Azul" ? "A" : "V";
        const v = GameState.board[r][c];
        return v && v.owner === me;
    }
    function canLand(r, c) {
        const me = GameState.currentPlayer === "Azul" ? "A" : "V";
        const v = GameState.board[r][c];
        return !v || v.owner !== me;
    }

    function possibleAdvanceFrom(r, c, steps) {
        let curR = r, curC = c, rem = steps;
        const piece = GameState.board[r][c];
        let d = dirForRow(curR);

        if (piece && piece.moved === false && GameState.dice.value === 1) {
            const startRow = initialRow(piece.owner);
            if (r === startRow) {
                const tryStep = c + dirForRow(r);
                if (tryStep >= 0 && tryStep <= GameState.cols - 1 && canLand(r, tryStep)) {
                    return { r, c: tryStep, needsChoice: false };
                }
                const enterR = (piece.owner === "A") ? 2 : 1;
                if (canLand(enterR, c)) {
                    return { r: enterR, c, needsChoice: false };
                }
                return { r: null, c: null, needsChoice: false };
            }
        }

        while (rem > 0) {
            if (d === +1 && curC < GameState.cols - 1) { curC++; rem--; }
            else if (d === -1 && curC > 0) { curC--; rem--; }
            else {
                if (curR === 2) {
                    if (rem > 0) {
                        const up = { r: 3, c: curC };
                        const down = { r: 1, c: curC };
                        return { needsChoice: true, options: [up, down], remaining: rem - 1 };
                    }
                    break;
                } else if (curR === 0) { curR = 1; d = dirForRow(curR); rem--; }
                else if (curR === 1) { curR = 2; d = dirForRow(curR); rem--; }
                else if (curR === 3) { curR = 2; d = dirForRow(curR); rem--; }
            }
        }
        return { r: curR, c: curC, needsChoice: false };
    }

    /* ===== Aplicar Jogada ===== */
    function applyMove(from, to) {
        const me = GameState.currentPlayer === "Azul" ? "A" : "V";
        GameState.board[to.r][to.c] = { owner: me, moved: true };
        GameState.board[from.r][from.c] = null;
        renderBoard();
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
            renderBoard(); // manter perspetiva do mesmo jogador
        } else {
            GameState.currentPlayer = (GameState.currentPlayer === "Azul") ? "Vermelho" : "Azul";
            GameState.mode = "awaitRoll";
            setMsg(`Vez de ${GameState.currentPlayer}. Carrega em Lançar Dados.`);
            clearHighlights();
            renderBoard(); // rodar perspetiva para o novo jogador
        }
        updateRollUI();
        defer(aiMaybeAct, AI_DELAY.CHAIN);
    }

    /* ===== Seleção ===== */
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
        const me = GameState.currentPlayer === "Azul" ? "A" : "V";
        const cells = [];
        for (let r = 0; r < GameState.rows; r++) {
            for (let c = 0; c < GameState.cols; c++) {
                const v = GameState.board[r][c];
                if (v && v.owner === me) {
                    if (v.moved === false && !isFrontOfStartRow(r, c)) continue;
                    if (v.moved === false && GameState.dice.value !== 1) continue;
                    const dest = possibleAdvanceFrom(r, c, GameState.dice.value);
                    if (dest.needsChoice || (dest.r != null && canLand(dest.r, dest.c))) {
                        cells.push({ r, c });
                    }
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

    /* ===== IA: utilitários ===== */
    function meOwner(label){ return label === "Azul" ? "A" : "V"; }
    function oppOwner(label){ return label === "Azul" ? "V" : "A"; }

    function walkSteps(r, c, rem) {
        let cur = { r, c };
        let d = dirForRow(cur.r);
        while (rem > 0) {
            if (d === +1 && cur.c < GameState.cols - 1) { cur.c++; rem--; }
            else if (d === -1 && cur.c > 0) { cur.c--; rem--; }
            else {
                if (cur.r === 0) { cur.r = 1; d = dirForRow(cur.r); rem--; }
                else if (cur.r === 1) { cur.r = 2; d = dirForRow(cur.r); rem--; }
                else if (cur.r === 3) { cur.r = 2; d = dirForRow(cur.r); rem--; }
                else if (cur.r === 2) { cur.r = 3; d = dirForRow(cur.r); rem--; }
            }
        }
        return cur;
    }

    function enumerateMovesFrom(r, c, steps, playerLabel) {
        const moves = [];
        const piece = GameState.board[r][c];
        if (!piece) return moves;
        const me = meOwner(playerLabel);
        if (piece.owner !== me) return moves;

        // Regra do 1º movimento
        if (piece.moved === false) {
            if (!isFrontOfStartRow(r, c)) return moves;
            if (steps !== 1) return moves;

            const tryStep = c + dirForRow(r);
            if (tryStep >= 0 && tryStep <= GameState.cols - 1 && canLand(r, tryStep)) {
                const cap = !!(GameState.board[r][tryStep] && GameState.board[r][tryStep].owner !== me);
                moves.push({ from:{r,c}, to:{r, c:tryStep}, capture:cap });
            }
            const enterR = (piece.owner === "A") ? 2 : 1;
            if (canLand(enterR, c)) {
                const cap = !!(GameState.board[enterR][c] && GameState.board[enterR][c].owner !== me);
                moves.push({ from:{r,c}, to:{r:enterR, c}, capture:cap });
            }
            return moves;
        }

        // ver se existe ramificação na 3ª linha
        const probe = possibleAdvanceFrom(r, c, steps);
        if (probe.needsChoice) {
            // Duas opções: subir para 4ª (r=3) ou descer para 2ª (r=1), depois andar remaining
            for (const opt of probe.options) {
                const end = walkSteps(opt.r, opt.c, probe.remaining);
                if (end.r == null) continue;
                if (!canLand(end.r, end.c)) continue;
                const cap = !!(GameState.board[end.r][end.c] && GameState.board[end.r][end.c].owner !== me);
                moves.push({ from:{r,c}, to:{r:end.r, c:end.c}, capture:cap });
            }
        } else {
            if (probe.r != null && canLand(probe.r, probe.c)) {
                const cap = !!(GameState.board[probe.r][probe.c] && GameState.board[probe.r][probe.c].owner !== me);
                moves.push({ from:{r,c}, to:{r:probe.r, c:probe.c}, capture:cap });
            }
        }
        return moves;
    }

    // Jogadas válidas para o jogador atual com dado "steps"
    function getValidMovesFor(playerLabel, steps) {
        const me = meOwner(playerLabel);
        const out = [];
        for (let r = 0; r < GameState.rows; r++) {
            for (let c = 0; c < GameState.cols; c++) {
                const v = GameState.board[r][c];
                if (!v || v.owner !== me) continue;
                out.push(...enumerateMovesFrom(r, c, steps, playerLabel));
            }
        }
        return out;
    }

    // AI prioriza capturas; se não houver, faz uma escolha aleatória
    function aiPickMove(moves) {
        if (!moves.length) return null;
        const caps = moves.filter(m => m.capture);
        if (caps.length) return caps[Math.floor(Math.random()*caps.length)];
        return moves[Math.floor(Math.random()*moves.length)];
    }

    function isAITurn() {
        return GameState.vsAI && GameState.currentPlayer === GameState.aiColorLabel && GameState.mode !== "finished";
    }

    function aiMaybeAct() {
        if (!isAITurn()) return;

        // 1) Precisa de lançar os dados?
        if (GameState.mode === "awaitRoll") {
            // Usa o teu botão para manter a UI e o som dos dados
            const btn = document.getElementById("baralharDados");
            if (btn && !btn.disabled) {
                btn.click();
                // dá tempo à UI para pintar realces
                defer(aiMaybeAct, AI_DELAY.PICK);
            }
            return;
        }

        // 2) Escolher uma jogada válida e aplicá-la
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

            const move = aiPickMove(moves);
            applyMove(move.from, move.to);
            if (checkWin()) return;
            GameState.selected = null;
            endTurnOrRepeat();
            return;
        }
    }


    /* ===== Cliques ===== */
    function onCellClick(e) {
        const vr = parseInt(e.currentTarget.dataset.vr, 10);
        const vc = parseInt(e.currentTarget.dataset.vc, 10);
        const persp = getPerspectivePlayer();
        const { r, c } = fromView(vr, vc, persp);

        if (GameState.mode === "finished") return;
        if (GameState.mode === "awaitRoll") { setMsg("Primeiro lança os dados."); return; }

        if (GameState.mode === "awaitPiece") {
            if (!isOwnPiece(r, c)) { setMsg("Escolhe uma peça tua."); return; }
            const piece = GameState.board[r][c];
            if (piece && piece.moved === false && !isFrontOfStartRow(r, c)) { setMsg("Na fila inicial só podes mexer a peça da frente."); return; }
            if (piece && piece.moved === false && GameState.dice.value !== 1) { setMsg("Essa peça ainda não se moveu. O 1º movimento tem de ser com 1 (Tâb)."); return; }
            const dest = possibleAdvanceFrom(r, c, GameState.dice.value);
            if (dest.needsChoice) {
                GameState.mode = "awaitDestination";
                GameState.selected = { r, c, remaining: dest.remaining };
                setMsg("Estás na 3ª linha: escolhe o destino (4ª ou 2ª).");
                const optsView = dest.options.map(o => toView(o.r, o.c, persp));
                clearHighlights();
                optsView.forEach(({ vr, vc }) => {
                    const el = cellElView(vr, vc);
                    if (el) el.classList.add("hl");
                });
                return;
            } else {
                if (dest.r == null || !canLand(dest.r, dest.c)) { setMsg("Jogada inválida para essa peça."); return; }
                applyMove({ r, c }, { r: dest.r, c: dest.c });
                if (checkWin()) return;
                GameState.selected = null;
                endTurnOrRepeat();
                return;
            }
        }

        if (GameState.mode === "awaitDestination") {
            const from = GameState.selected;
            if (!from) { GameState.mode = "awaitPiece"; return; }
            const options = [
                { r: 3, c: from.c },
                { r: 1, c: from.c }
            ];
            const clickedModel = fromView(vr, vc, perso);
            const clickedIsOption = options.find(o => o.r === clickedModel.r && o.c === clickedModel.c);
            if (!clickedIsOption) {
                setMsg("Clica numa das casas destacadas.");
                const optsView = options.map(o => toView(o.r, o.c, persp));
                clearHighlights();
                optsView.forEach(({ vr, vc }) => {
                    const el = cellElView(vr, vc);
                    if (el) el.classList.add("hl");
                });
                return;
            }
            let cur = { r: clickedModel.r, c: clickedModel.c };
            let rem = from.remaining;
            let d = dirForRow(cur.r);
            while (rem > 0) {
                if (d === +1 && cur.c < GameState.cols - 1) { cur.c++; rem--; }
                else if (d === -1 && cur.c > 0) { cur.c--; rem--; }
                else {
                    if (cur.r === 0) { cur.r = 1; d = dirForRow(cur.r); rem--; }
                    else if (cur.r === 1) { cur.r = 2; d = dirForRow(cur.r); rem--; }
                    else if (cur.r === 3) { cur.r = 2; d = dirForRow(cur.r); rem--; }
                    else if (cur.r === 2) { cur.r = 3; d = dirForRow(cur.r); rem--; }
                }
            }
            if (!canLand(cur.r, cur.c)) {
                setMsg("Destino inválido.");
                const optsView = options.map(o => toView(o.r, o.c, persp));
                clearHighlights();
                optsView.forEach(({ vr, vc }) => {
                    const el = cellElView(vr, vc);
                    if (el) el.classList.add("hl");
                });
                return;
            }
            applyMove({ r: from.r, c: from.c }, { r: cur.r, c: cur.c });
            if (checkWin()) return;
            GameState.selected = null;
            GameState.mode = "awaitPiece";
            endTurnOrRepeat();
        }
    }
});
