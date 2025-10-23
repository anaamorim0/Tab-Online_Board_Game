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

    const settingsIcon = settingsButton.querySelector("img");
    const loginIcon = userButton.querySelector("img");

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

        
});