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

        if (loginMenu.classList.contains("hidden")) {
            loginIcon.src = "user_logo.png";
        } else {
            loginIcon.src = "user_logo_2.png";
        }
    });

    settingsButton.addEventListener("click", () => {
        settingsMenu.classList.toggle("hidden");
        if (settingsMenu.classList.contains("hidden")) {
            settingsIcon.src = "settings_logo.png";
        } else {
            settingsIcon.src = "settings_logo_2.png";
        }
    });

    
    regrasButton.addEventListener("click", () => {
        regrasMenu.classList.toggle("hidden");
        if (regrasMenu.classList.contains("hidden")) {
            regrasIcon.src = "regras_logo.png";
        } else {
            regrasIcon.src = "regras_logo_2.png";
        }
    });

    classButton.addEventListener("click", () => {
        classMenu.classList.toggle("hidden");
        if (classMenu.classList.contains("hidden")) {
            classIcon.src = "classificacoes_logo.png";
        } else {
            classIcon.src = "classificacoes_logo_2.png";
        }
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
        document.querySelectorAll('.dado').forEach(dado => {
            const cima = Math.random() < 0.5;
            dado.classList.toggle('up', cima);
            dado.classList.toggle('down', !cima);
        });
    }

    function initDados() {
        baralharDados();
        const botao = document.getElementById('baralharDados');
        if (botao) botao.addEventListener('click', baralharDados);
    }

    window.addEventListener('DOMContentLoaded', initDados);

    (function () {
        const container = document.getElementById('regrasContent');
        if (!container) return;

        function toggle(head) {
            const body = document.getElementById(head.getAttribute('aria-controls'));
            if (!body) return;

            const wasOpen = head.getAttribute('aria-expanded') === 'true';

            container.querySelectorAll('.regras-head[aria-expanded="true"]').forEach(h => {
            h.setAttribute('aria-expanded', 'false');
            const b = document.getElementById(h.getAttribute('aria-controls'));
            if (b) b.hidden = true;
            });

            if (!wasOpen) {
            head.setAttribute('aria-expanded', 'true');
            body.hidden = false;
            }
        }

        container.addEventListener('click', e => {
            const head = e.target.closest('.regras-head');
            if (head) toggle(head);
        });
        container.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
            const head = e.target.closest('.regras-head');
            if (head) { e.preventDefault(); toggle(head); }
            }
        });
    })();


});