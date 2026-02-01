// ======================================================
// ELEMENTS
// ======================================================
const catcher = document.getElementById("PlayerCatcher");
const nicknameInput = document.getElementById("inptusername");
const MainContainer = document.getElementById("MainContainer");
const playerNameDiv = document.getElementById("PlayerName");
const playerNameText = playerNameDiv ? playerNameDiv.querySelector('.nickname') : null;

// Update player name when input changes
nicknameInput.addEventListener('input', function() {
    const name = this.value.trim() || "Nickname";
    const nicknames = document.querySelectorAll('.nickname');
    nicknames.forEach(nickname => {
        nickname.textContent = name;
    });
});

const container1 = document.getElementById("MainMenuContainer1");
const container2 = document.getElementById("MainMenuContainer2");

const PlayButton = document.getElementById("PlayButton");
const GameOverDiv = document.getElementById("GameOverDiv");
const PlayAgainButton = document.getElementById("PlayAgainButton");

const HeartText = document.getElementById("HeartText");
const ScoreText = document.getElementById("ScoreText");
const leaderboardLists = document.querySelectorAll(".leaderboardlist");
const damageOverlay = document.getElementById("damageOverlay");

// Audio for collecting foils
const collectFoilAudio = new Audio("Audios/CollectFoilAudio.mp3");

// ======================================================
// VARIABLES
// ======================================================
let gameStarted = false;
let fallInterval;
let score = 0;
let hearts = 3;
let currentSlot = 1;
// Timing
let startTimestamp = null;
let timerIntervalId = null;

// Spawning control (dynamic spawn rate)
let spawnTimeoutId = null;
let accelerationIntervalId = null;
let spawnRate = 1800; // initial ms between spawns
const initialSpawnRate = 3000;
const minSpawnRate = 400; // fastest spawn interval
const spawnAcceleration = 19; // ms to reduce every acceleration tick
const spawnAccelerationInterval = 10000; // how often to accelerate (ms)

// Fall speed and dynamic difficulty tuning
const baseFallSpeed = 3; // base pixels per frame
const fallSpeedIncreasePerSecond = 0.1; // extra px/frame per second of play
const spawnRateDecreasePerSecond = 20; // ms decrease per second of play (spawn interval)

const avatars = [
"AvatarPng/AvatarLaserBlue.png",
"AvatarPng/AvatarBucketBlue.png",
"AvatarPng/AvatarCubeBlue.png",
"AvatarPng/AvatarHouseBlue.png",
"AvatarPng/AvatarPantsBlue.png",
"AvatarPng/AvatarShirtBlue.png",
"AvatarPng/AvatarHelicopterBlue.png",

"AvatarPng/AvatarLaserRed.png",
"AvatarPng/AvatarBucketRed.png",
"AvatarPng/AvatarCubeRed.png",
"AvatarPng/AvatarHouseRed.png",
"AvatarPng/AvatarPantsRed.png",
"AvatarPng/AvatarShirtRed.png",
"AvatarPng/AvatarHelicopterRed.png",

"AvatarPng/AvatarLaserYellow.png",
"AvatarPng/AvatarBucketYellow.png",
"AvatarPng/AvatarCubeYellow.png",
"AvatarPng/AvatarHouseYellow.png",
"AvatarPng/AvatarPantsYellow.png",
"AvatarPng/AvatarShirtYellow.png",
"AvatarPng/AvatarHelicopterYellow.png",

"AvatarPng/AvatarLaserGreen.png",
"AvatarPng/AvatarBucketGreen.png",
"AvatarPng/AvatarCubeGreen.png",
"AvatarPng/AvatarHouseGreen.png",
"AvatarPng/AvatarPantsGreen.png",
"AvatarPng/AvatarShirtGreen.png",
"AvatarPng/AvatarHelicopterGreen.png"
];
let currentAvatarIndex = 0;

// ======================================================
// INIT
// ======================================================
GameOverDiv.style.display = "none";
GameOverDiv.classList.add("hidden");
catcher.style.display = "none";

// Ensure damage overlay starts hidden (opacity 0) so it only appears when we trigger it
if (damageOverlay) damageOverlay.style.opacity = 0;

renderLeaderboard();

// ======================================================
// AVATAR SELECTION
// ======================================================
function changeAvatar() {
  currentAvatarIndex = (currentAvatarIndex + 1) % avatars.length;
  document.getElementById("avatar").src = avatars[currentAvatarIndex];
  if (gameStarted) catcher.src = avatars[currentAvatarIndex];
}

// ======================================================
// PLAYER MOVEMENT
// ======================================================
function updateCatcherPosition() {
  const gameArea = document.getElementById("GameContainer");
  if (!gameArea || !catcher || !playerNameDiv) return;

  const slotWidth = gameArea.clientWidth / 3;
  const newLeft = slotWidth * currentSlot + slotWidth / 2;
  
  // Update container position
  playerNameDiv.style.left = newLeft + "px";
  playerNameDiv.style.position = "absolute";
  
  // Ensure catcher is visible and positioned within its container
  catcher.style.position = "relative";
  catcher.style.left = "0";
  catcher.style.display = "block";
}

document.addEventListener("keydown", (e) => {
  if (!gameStarted) return;
  if (["a","ArrowLeft"].includes(e.key) && currentSlot > 0) currentSlot--;
  if (["d","ArrowRight"].includes(e.key) && currentSlot < 2) currentSlot++;
  updateCatcherPosition();
});

// ======================================================
// TOUCH / SWIPE CONTROLS (mobile)
// - touchmove: drag the catcher following the finger
// - touchend: if a quick swipe occurred, move one slot left/right
// ======================================================
{
  let touchStartX = 0;
  let touchCurrentX = 0;
  let touchActive = false;
  const swipeThreshold = 30; // px required to count as a swipe

  const gameArea = document.getElementById("GameContainer");

  function moveToTouch(clientX) {
    if (!gameArea) return;
    const rect = gameArea.getBoundingClientRect();
    const x = clientX - rect.left; // x within game area
    const slotWidth = rect.width / 3;
    let slot = Math.floor(x / slotWidth);
    if (isNaN(slot)) return;
    slot = Math.max(0, Math.min(2, slot));
    if (slot !== currentSlot) {
      currentSlot = slot;
      updateCatcherPosition();
    }
  }

  if (gameArea) {
    // Need passive: false so we can call preventDefault() during touchmove
    gameArea.addEventListener('touchstart', (e) => {
      if (!gameStarted) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchCurrentX = touchStartX;
      touchActive = true;
      // Immediately move catcher to touched region for intuitive control
      moveToTouch(touchStartX);
    }, { passive: true });

    gameArea.addEventListener('touchmove', (e) => {
      if (!gameStarted || !touchActive) return;
      // prevent scrolling while dragging on the game area
      e.preventDefault();
      const t = e.touches[0];
      touchCurrentX = t.clientX;
      // Follow the finger while dragging
      moveToTouch(touchCurrentX);
    }, { passive: false });

    gameArea.addEventListener('touchend', (e) => {
      if (!gameStarted || !touchActive) return;
      touchActive = false;
      const delta = touchCurrentX - touchStartX;
      if (Math.abs(delta) > swipeThreshold) {
        // treat as swipe: move one slot in direction
        if (delta > 0 && currentSlot < 2) currentSlot++;
        if (delta < 0 && currentSlot > 0) currentSlot--;
        updateCatcherPosition();
      } else {
        // small movement: snap to nearest slot (already handled in moveToTouch)
        updateCatcherPosition();
      }
    }, { passive: true });
  }
}

// ======================================================
// DAMAGE FLASH
// ======================================================
function flashDamage() {
  damageOverlay.style.opacity = "1";
  setTimeout(() => { damageOverlay.style.opacity = "0"; }, 300);
}

// ======================================================
// CATCH ANIMATION
// ======================================================
function playCatchAnimation() {
  if (!catcher) return;
  // Remove the class if it exists to reset the animation
  catcher.classList.remove("catch-animation");
  // Trigger reflow to restart animation
  void catcher.offsetWidth;
  // Add the animation class
  catcher.classList.add("catch-animation");
}

// ======================================================
// FALLING OBJECTS
// ======================================================
function spawnFallingObject() {
  if (!gameStarted) return;

  const foil = document.createElement("img");
  foil.classList.add("fallingDiv");

  const foilImages = [
    "ImageFolder/FoilsImages/BlueFoil.png",
    "ImageFolder/FoilsImages/YellowFoil.png",
    "ImageFolder/FoilsImages/RedFoil.png",
    "ImageFolder/FoilsImages/GreenFoil.png"
  ];
  const bombImage = "ImageFolder/FoilsImages/Bomb.png";
  const heartImage = "ImageFolder/HeartIcon.png";

  // -----------------------------
  // Weighted selection (ONE roll)
  // -----------------------------
  const roll = Math.random();
  let foilType;

  if (roll < 0.05) {
    foil.src = heartImage;
    foilType = "heart";
  } else if (roll < 0.20) { // 0.05 → 0.20 = 15%
    foil.src = bombImage;
    foilType = "bomb";
  } else {
    foil.src = foilImages[Math.floor(Math.random() * foilImages.length)];
    foilType = "regular";
  }

  foil.dataset.type = foilType;

  const gameArea = document.getElementById("GameContainer");
  const slotWidth = gameArea.clientWidth / 3;
  const slot = Math.floor(Math.random() * 3);

  foil.style.position = "absolute";
  foil.style.top = "-150px";
  gameArea.appendChild(foil);

  requestAnimationFrame(() => {
    foil.style.left = slot * slotWidth + slotWidth / 2 - foil.clientWidth / 2 + "px";
  });

  // -----------------------------
  // Falling logic
  // -----------------------------
  let posY = -150;

  function fall() {
    let currentFallSpeed = baseFallSpeed;

    if (startTimestamp) {
      const elapsed = (Date.now() - startTimestamp) / 1000;
      currentFallSpeed += elapsed * fallSpeedIncreasePerSecond;
    }

    posY += currentFallSpeed;
    foil.style.top = posY + "px";

    const cRect = catcher.getBoundingClientRect();
    const fRect = foil.getBoundingClientRect();

    // collision logic
    const foilCenterX = (fRect.left + fRect.right) / 2;
    const catcherCenterX = (cRect.left + cRect.right) / 2;

    const allowedHalf = cRect.width * 0.25;
    const horizontal = Math.abs(foilCenterX - catcherCenterX) <= allowedHalf;

    const vertical = fRect.bottom >= (cRect.top + cRect.height * 0.25);

    const caught = horizontal && vertical;

    // -----------------------------
    // Landing OR falling off screen
    // -----------------------------
    if (posY > gameArea.clientHeight || caught) {
      foil.remove();

      const prevHearts = hearts;

      if (caught) {
        playCatchAnimation();

        if (foilType === "bomb") {
          hearts--;
        } else if (foilType === "heart") {
          if (hearts < 3) hearts++;
        } else {
          score++;
          // Play collect sound on regular foil catch
          collectFoilAudio.currentTime = 0;
          collectFoilAudio.play().catch(err => console.log("Audio play error:", err));

          // avatar color swap based on foil color
          try {
            const src = foil.src;
            const colorMatch = src.match(/Blue|Red|Yellow|Green/i);

            if (colorMatch) {
              const foilColor = colorMatch[0];

              const avatarEl = document.getElementById('avatar');
              const currentSrc = avatarEl ? avatarEl.src : avatars[currentAvatarIndex];

              const newSrc = currentSrc.replace(/Blue|Red|Yellow|Green/i, foilColor);
              if (newSrc !== currentSrc) {
                if (avatarEl) avatarEl.src = newSrc;
                if (gameStarted && catcher) catcher.src = newSrc;

                const baseName = newSrc.split('/').pop();
                const index = avatars.findIndex(a => a.split('/').pop() === baseName);
                if (index !== -1) currentAvatarIndex = index;

                if (window && typeof window.currentAvatar !== "undefined") {
                  window.currentAvatar = currentAvatarIndex;
                }
              }
            }
          } catch (err) {
            console.error(err);
          }
        }

      } else {
        // missed item logic
        if (foilType === "regular") hearts--;
        // missing heart/bomb = no penalty
      }

      if (hearts < prevHearts) flashDamage();
      updateHUD();
      return;
    }

    requestAnimationFrame(fall);
  }

  requestAnimationFrame(fall);
}

// Start the spawn loop (uses setTimeout so we can vary spawnRate over time)
function startSpawning() {
  // clear any existing timers
  stopSpawning();

  // spawn loop: compute delay based on elapsed time each iteration
  function loop() {
    if (!gameStarted) return;
    // Spawn a falling object (this creates its own animation loop via rAF)
    spawnFallingObject();

    // compute dynamic delay based on elapsed time so spawn rate increases
    let delay = spawnRate;
    if (startTimestamp) {
      const elapsedSeconds = (Date.now() - startTimestamp) / 1000;
      delay = Math.max(minSpawnRate, Math.floor(initialSpawnRate - elapsedSeconds * spawnRateDecreasePerSecond));
    }

    // schedule the next spawn
    spawnTimeoutId = setTimeout(loop, delay);
  }

  // kick off immediately
  spawnTimeoutId = setTimeout(loop, 0);
}

function stopSpawning() {
  if (spawnTimeoutId) {
    clearTimeout(spawnTimeoutId);
    spawnTimeoutId = null;
  }
  if (accelerationIntervalId) {
    clearInterval(accelerationIntervalId);
    accelerationIntervalId = null;
  }
}

// ======================================================
// HUD UPDATE
// ======================================================
function updateHUD() {
  HeartText.textContent = "❤️".repeat(hearts);
  // Show score and live time while playing
  const timeStr = startTimestamp ? formatElapsedTime(Date.now() - startTimestamp):"0:00";
  ScoreText.textContent = `Score: ${score.toString().padStart(3, "0")} Time: ${timeStr} min`;
  if (hearts <= 0) gameOver();
}

function formatElapsedTime(ms) {
  const totalSeconds = Math.floor(ms/1000);
  const minutes = Math.floor(totalSeconds/60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2,'0')}`;
}

// ======================================================
// LEADERBOARD
// ======================================================
async function saveScoreToServer(username, score, avatar) {
  try {
    const response = await fetch("http://192.168.179.51:3000/save-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, score, avatar })
    });
    if (!response.ok) {
      console.error("Failed to save score");
    }
  } catch (err) {
    console.error("Error saving score:", err);
  }
}

async function renderLeaderboard() {
  let scores = [];

  try {
    const response = await fetch("http://192.168.179.51:3000/leaderboard");
    if (response.ok) {
      scores = await response.json();
    }
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
  }

  // Prepare html for the leaderboard (same for all leaderboard containers)
  let html = "";
  if (scores.length === 0) {
    html = `
      <div class="PlayerList1">
        <span>No scores yet - Play to set a record!</span>
        <span>---</span>
      </div>`;
  } else {
    scores.forEach((p, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      const avatarImg = p.avatar ? `<img class="leaderboard-avatar" src="${p.avatar}" alt="avatar">` : '';
      html += `
          <div class="PlayerList1">
            <span>${medal} ${i + 1}. ${avatarImg}<strong>${p.username}</strong></span>
            <span>Score: ${p.score.toString().padStart(3, '0')}</span>
          </div>`;
      });
  }

  // Populate every leaderboard list element on the page
  if (leaderboardLists && leaderboardLists.length) {
    leaderboardLists.forEach(listEl => listEl.innerHTML = html);
  }
}

// ======================================================
// GAME OVER
// ======================================================
async function gameOver() {
  gameStarted = false;
  stopSpawning();
  // stop timer
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  const avatarSrc = document.getElementById("avatar") ? document.getElementById("avatar").src : null;
  await saveScoreToServer(nicknameInput.value.trim() || "Player", score, avatarSrc);
  await renderLeaderboard();
  document.getElementById("GameContainer").style.display="none";
  // show final score in game over UI
  const finalScoreEl = document.getElementById('FinalScoreText');
  if (finalScoreEl) {
    const totalMs = startTimestamp ? (Date.now() - startTimestamp) : 0;
    finalScoreEl.textContent = `Your score: ${score} Time: ${formatElapsedTime(totalMs)} min`;
  }
  GameOverDiv.style.display="flex";
}

// ======================================================
// START GAME
// ======================================================
function startCountdown() {
  // Show GameStartDiv, hide MainContainer, prepare GameContainer (but don't start game yet)
  MainContainer.style.display = "none";
  document.getElementById("GameContainer").style.display = "flex";
  const gameStartDiv = document.getElementById("GameStartDiv");
  gameStartDiv.style.display = "flex";

  // Get lamp images and text elements
  const lamps = gameStartDiv.querySelectorAll("img");
  const redLamp = lamps[0];
  const yellowLamp = lamps[1];
  const greenLamp = lamps[2];
  const heading = gameStartDiv.querySelector("h1");
  const countdown = gameStartDiv.querySelector("p");

  // Initial state: "Ready?"
  heading.textContent = "Ready?";
  countdown.textContent = "3";

  // Hide all lamps initially
  redLamp.style.display = "none";
  yellowLamp.style.display = "none";
  greenLamp.style.display = "none";

  // Sequence: Red (Ready? 3) -> Yellow (Steady? 2) -> Green (Go! 1) -> Start game
  setTimeout(() => {
    // Show red lamp
    redLamp.style.display = "block";
    heading.textContent = "Ready?";
    countdown.textContent = "3";
  }, 0);

  setTimeout(() => {
    // Switch to yellow lamp
    redLamp.style.display = "none";
    yellowLamp.style.display = "block";
    heading.textContent = "Steady?";
    countdown.textContent = "2";
  }, 1000);

  setTimeout(() => {
    // Switch to green lamp
    yellowLamp.style.display = "none";
    greenLamp.style.display = "block";
    heading.textContent = "Go!";
    countdown.textContent = "1";
  }, 2000);

  setTimeout(() => {
    // Hide countdown screen and start the actual game
    gameStartDiv.style.display = "none";
    redLamp.style.display = "none";
    yellowLamp.style.display = "none";
    greenLamp.style.display = "none";
    
    // Now start the actual game
    startGame();
  }, 3000);
}

function startGame() {
  const playerName = nicknameInput.value.trim() || "Nickname";
  
  // Show and position the player name div
  if (playerNameDiv) {
    playerNameDiv.style.display = "block";
    playerNameDiv.style.position = "absolute";
    const nicknames = document.querySelectorAll('.nickname');
    nicknames.forEach(nickname => {
      nickname.textContent = playerName;
    });
  }
  
  // Show and update the catcher
  if (catcher) {
    catcher.style.display = "block";
    catcher.src = document.getElementById("avatar").src;
  }

  // Ensure catcher is positioned according to the current slot when the game starts
  updateCatcherPosition();

  score = 0;
  hearts = 3;
  currentSlot = 1;
  updateHUD();
  gameStarted = true;
  // reset spawn rate and start spawn loop
  spawnRate = initialSpawnRate;
  startSpawning();
  // start timer
  startTimestamp = Date.now();
  if (timerIntervalId) clearInterval(timerIntervalId);
  timerIntervalId = setInterval(() => updateHUD(), 500);
}

PlayButton.addEventListener("click", startCountdown);

// ======================================================
// PLAY AGAIN
// ======================================================
PlayAgainButton.addEventListener("click", () => {
  GameOverDiv.style.display = "none";
  document.getElementById("GameContainer").style.display = "none";
  catcher.style.display = "none";
  MainContainer.style.display = "flex";
  container1.style.display = "flex";
  container1.style.opacity = 1;
  // ensure spawning is stopped and reset
  stopSpawning();
  spawnRate = initialSpawnRate;
  // stop and reset timer
  if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
  startTimestamp = null;
  score = 0;
  hearts = 3;
  currentSlot = 1;
  updateHUD();
});

