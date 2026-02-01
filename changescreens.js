// ======================================================
// NAVBAR MENU SWITCHING
// ======================================================

// Get navbar buttons
const PlayNav = document.querySelector(".navbarbutton1");
const RankingNav = document.querySelector(".navbarbutton2");

// Get menu containers (use different names to avoid conflicting declarations
// with other scripts that may also reference the same ids)
const menu1 = document.getElementById("MainMenuContainer1");
const menu2 = document.getElementById("MainMenuContainer2");

// If elements are present, set initial visibility
if (menu1) menu1.style.opacity = 1;
if (menu2) {
    menu2.style.opacity = 0;
    menu2.style.display = "none";
}

// Fade switch function
function switchContainers(show, hide) {
    if (!show || !hide) return;

    hide.style.opacity = 0;

    setTimeout(() => {
        hide.style.display = "none";

        show.style.display = "flex";
        setTimeout(() => {
            show.style.opacity = 1;
        }, 10);
    }, 400); // This must match CSS transition time
}

function setActiveNav(activeNav) {
    if (!PlayNav || !RankingNav) return;
    PlayNav.classList.remove('active');
    RankingNav.classList.remove('active');
    if (activeNav) activeNav.classList.add('active');
}

// Navbar click listeners
if (PlayNav) PlayNav.addEventListener("click", () => { switchContainers(menu1, menu2); setActiveNav(PlayNav); });
if (RankingNav) RankingNav.addEventListener("click", () => { 
    switchContainers(menu2, menu1); 
    setActiveNav(RankingNav);
    // Refresh leaderboard contents when opening the ranking view
    if (typeof renderLeaderboard === 'function') renderLeaderboard();
});
 
// Reset leaderboard button (some pages may include the button)
const resetBtn = document.getElementById('ResetLeaderboardButton');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('leaderboard');
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
    });
}

// Input change text

    const input = document.getElementById("inptusername");

    // When the input is focused (clicked)
    input.addEventListener("focus", function() {
        input.placeholder = ""; // remove placeholder
    });

    // Optional: restore placeholder when input loses focus and is empty
    input.addEventListener("blur", function() {
        if (input.value === "") {
            input.placeholder = "Nickname";
        }
    });
