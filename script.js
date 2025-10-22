document.addEventListener("DOMContentLoaded", () => {
    const closedBox = document.getElementById("closedBox");
    const openWrap = document.getElementById("openWrap");
    const logo = document.getElementById("logo");
    const userButton = document.getElementById("userButton");
    const loginMenu = document.getElementById("loginMenu");
    const settingsButton = document.getElementById("settingsButton");
    const settingsMenu = document.getElementById("settingsMenu");

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
    
});