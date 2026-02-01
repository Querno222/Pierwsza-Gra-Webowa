// Avatar system - make global for inline onclick
window.avatarList = [
  // Blue
  "AvatarPng/AvatarLaserBlue.png",
  "AvatarPng/AvatarBucketBlue.png",
  "AvatarPng/AvatarCubeBlue.png",
  "AvatarPng/AvatarHouseBlue.png",
  "AvatarPng/AvatarPantsBlue.png",
  "AvatarPng/AvatarShirtBlue.png",
  "AvatarPng/AvatarHelicopterBlue.png",
  // Red
  "AvatarPng/AvatarLaserRed.png",
  "AvatarPng/AvatarBucketRed.png",
  "AvatarPng/AvatarCubeRed.png",
  "AvatarPng/AvatarHouseRed.png",
  "AvatarPng/AvatarPantsRed.png",
  "AvatarPng/AvatarShirtRed.png",
  "AvatarPng/AvatarHelicopterRed.png",
  // Yellow
  "AvatarPng/AvatarLaserYellow.png",
  "AvatarPng/AvatarBucketYellow.png",
  "AvatarPng/AvatarCubeYellow.png",
  "AvatarPng/AvatarHouseYellow.png",
  "AvatarPng/AvatarPantsYellow.png",
  "AvatarPng/AvatarShirtYellow.png",
  "AvatarPng/AvatarHelicopterYellow.png",
  // Green
  "AvatarPng/AvatarLaserGreen.png",
  "AvatarPng/AvatarBucketGreen.png",
  "AvatarPng/AvatarCubeGreen.png",
  "AvatarPng/AvatarHouseGreen.png",
  "AvatarPng/AvatarPantsGreen.png",
  "AvatarPng/AvatarShirtGreen.png",
  "AvatarPng/AvatarHelicopterGreen.png"
];
window.currentAvatar = 0;

window.changeAvatar = function() {
  const avatar = document.getElementById("avatar");
  if (!avatar) return;
  avatar.style.opacity = 0;
  setTimeout(() => {
    const perColor = 7; // number of avatars per color group
    const total = window.avatarList.length;
    const mainContainer = document.getElementById('MainContainer');
    const inMainMenu = mainContainer && mainContainer.style.display !== 'none';

    if (inMainMenu) {
      // cycle only through the blue group (first 7 items)
      const blueStart = 0;
      const idxInGroup = (window.currentAvatar % perColor + 1) % perColor;
      window.currentAvatar = blueStart + idxInGroup;
    } else {
      // cycle through the full list in-game
      window.currentAvatar = (window.currentAvatar + 1) % total;
    }

    // Apply the avatar src
    avatar.src = window.avatarList[window.currentAvatar];
    avatar.style.opacity = 1;

    // keep mechanics.js index in sync if present
    if (typeof currentAvatarIndex !== 'undefined') {
      try { currentAvatarIndex = window.currentAvatar; } catch (e) { /* ignore */ }
    }
  }, 400);
}

const button = document.querySelector('.change-button');
let currentRotation = 0;
if (button) {
    button.addEventListener('click', () => {
        currentRotation += 180;
        button.style.transform = `rotate(${currentRotation}deg)`;
        window.changeAvatar();
    });
}
