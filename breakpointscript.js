//A game made by Erdem Hanay
//Gonna Write comments later
const canvas = document.getElementById("g-canvas");
const rootStyle = getComputedStyle(document.documentElement);
const playerColor = rootStyle.getPropertyValue("--c-purple");
const codeColor = rootStyle.getPropertyValue("--c-yellow");
const trailColor = rootStyle.getPropertyValue("--trail-color");
const enemyColor = rootStyle.getPropertyValue("--c-red");
const pointColor = rootStyle.getPropertyValue("--c-green");
const playerSpeed = remTopx(0.2);
const keys = {};
let lastSpokenTime = 0;
const speakCooldown = 1000;
let isDashing = false;
let dashEndTime = 0;
let dashTextShown = false;
const trail = [];
const dashMultiplier = 10;
const dashDuration = 200;
const ogMaxspeed = remTopx(0.08);
let score = 0;
let gameStarted = false;
let loadingDone = false;
let transitionStarted = false;
let transitionFinished = false;
let lives = 20;
let gameOver = false;
let shakeDuration = 0;
let shakeMagnitude = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;

function logger(message, duration = 1000) {
  const logDiv = document.getElementById("logC");
  logDiv.textContent = message;

  setTimeout(() => {
    logDiv.textContent = "";
  }, duration);
}

function runStartupTransition(callback) {
  logger("runStartupTransition(callback);", 6500);
  const lines = [
    "// ====== InItIalIzing... ======",
    "/*wasd - movement*/",
    "/*spacebar - dashing*/",
    "/*collect 0*/",
    "/*run from 1*/",
    "function gameLoop() {",
    "  if (!gameStarted) {",
    "    drawStartScreen();",
    "    requestAnimationFrame(gameLoop);",
    "    return;",
    "  }",
    "  ctx.clearRect(0, 0, canvas.width, canvas.height);",
    "  movePlayer();",
    "  checkCollision();",
    "  checkEntityCollisions();",
    "  drawTrail();",
    "  drawEnemies();",
    "  drawPoints();",
    "  drawPlayer();",
    "  requestAnimationFrame(gameLoop);",
    "}",
    "gameLoop();",
  ];

  let typedLines = [];
  let currentLine = 0;
  let charIndex = 0;
  let fadeAlpha = 1;
  let phase = "typing";

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = codeColor;
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.globalAlpha = fadeAlpha;

    for (let i = 0; i < typedLines.length; i++) {
      ctx.fillText(typedLines[i], 20, 20 + i * 20);
    }

    if (phase === "typing" && currentLine < lines.length) {
      ctx.fillText(
        lines[currentLine].slice(0, charIndex),
        20,
        20 + typedLines.length * 20
      );
    }

    ctx.globalAlpha = 1;
  }

  function loop() {
    draw();

    if (phase === "fade") {
      fadeAlpha -= 0.02;
      if (fadeAlpha <= 0) {
        callback();
        return;
      }
    }

    requestAnimationFrame(loop);
  }

  function typeNextChar() {
    if (charIndex < lines[currentLine].length) {
      charIndex++;
      playKeySound();
      setTimeout(typeNextChar, 10);
    } else {
      typedLines.push(lines[currentLine]);
      currentLine++;
      charIndex = 0;
      playLineSound();

      if (currentLine < lines.length) {
        setTimeout(typeNextChar, 50);
      } else {
        phase = "pause";
        setTimeout(() => {
          phase = "fade";
        }, 500);
      }
    }
  }

  typeNextChar();
  requestAnimationFrame(loop);
}

function remTopx(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function syncGame() {
  logger("syncGame();");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
syncGame();
window.addEventListener("resize", syncGame);
const ctx = canvas.getContext("2d");

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: remTopx(0.8),
  height: remTopx(0.8),
  speed: playerSpeed,
  color: playerColor,
  friction: 0.9,
  maxSpeed: ogMaxspeed,
  vx: 0,
  vy: 0,
};

function drawPlayer() {
  ctx.fillStyle = playerColor;
  ctx.font = "bold 1rem monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("#", player.x + player.width / 2, player.y + player.height / 2);
}

function movePlayer() {
  const currentSpeed = isDashing ? player.speed * dashMultiplier : player.speed;
  if (keys["w"] || keys["ArrowUp"]) player.vy -= currentSpeed;
  if (keys["s"] || keys["ArrowDown"]) player.vy += currentSpeed;
  if (keys["a"] || keys["ArrowLeft"]) player.vx -= currentSpeed;
  if (keys["d"] || keys["ArrowRight"]) player.vx += currentSpeed;

  player.vx *= player.friction;
  player.vy *= player.friction;

  player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));
  player.vy = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vy));

  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height)
    player.y = canvas.height - player.height;

  if (isDashing) {
    trail.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      radius: remTopx(0.5),
      alpha: 1,
    });
  }
}

function drawTrail() {
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];

    ctx.fillStyle = `rgba(128, 0, 128, ${t.alpha})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fill();

    t.radius *= 0.95;
    t.alpha -= 0.02;
  }

  while (trail.length && trail[0].alpha <= 0) trail.shift();
}

const enemies = [
  { x: 100, y: 100, size: remTopx(0.8) },
  { x: 400, y: 200, size: remTopx(0.8) },
];

const points = [
  { x: 200, y: 150, size: remTopx(0.8) },
  { x: 300, y: 300, size: remTopx(0.8) },
];

function drawEnemies() {
  ctx.fillStyle = enemyColor;
  ctx.font = "bold 1rem monospace";
  enemies.forEach((e) => ctx.fillText("1", e.x, e.y + e.size));
}

function drawPoints() {
  ctx.fillStyle = pointColor;
  ctx.font = "bold 1rem monospace";
  points.forEach((p) => ctx.fillText("0", p.x, p.y + p.size));
}

function triggerShake(duration = 300, magnitude = 5) {
  shakeDuration = duration;
  shakeMagnitude = magnitude;
}

function checkEntityCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (
      player.x < e.x + e.size &&
      player.x + player.width > e.x &&
      player.y < e.y + e.size &&
      player.y + player.height > e.y
    ) {
      lives--;
      logger("checkEntityCollision(e);");
      triggerShake(500, 10);
      DSound();
      enemies.splice(i, 1);
      if (lives <= 0) {
        gameOver = true;
      }
      break;
    }
  }

  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    if (
      player.x < p.x + p.size &&
      player.x + player.width > p.x &&
      player.y < p.y + p.size &&
      player.y + player.height > p.y
    ) {
      logger("checkEntityCollision(p);");
      triggerShake(200, 4);
      ASound();
      points.splice(i, 1);
      score++;
      console.log("Score: " + score);
    }
  }
}
function isPositionFree(x, y, size) {
  if (
    x < player.x + player.width &&
    x + size > player.x &&
    y < player.y + player.height &&
    y + size > player.y
  ) {
    return false;
  }

  for (const e of enemies) {
    if (
      x < e.x + e.size &&
      x + size > e.x &&
      y < e.y + e.size &&
      y + size > e.y
    ) {
      return false;
    }
  }

  for (const p of points) {
    if (
      x < p.x + p.size &&
      x + size > p.x &&
      y < p.y + p.size &&
      y + size > p.y
    ) {
      return false;
    }
  }

  return true;
}

function spawnEnemyAndPoint() {
  const enemySize = remTopx(1.5);
  const pointSize = remTopx(1.5);

  let enemyX, enemyY;
  let attempts = 0;
  do {
    enemyX = Math.random() * (canvas.width - enemySize);
    enemyY = Math.random() * (canvas.height - enemySize);
    attempts++;
    if (attempts > 100) break;
  } while (!isPositionFree(enemyX, enemyY, enemySize));

  enemies.push({ x: enemyX, y: enemyY, size: enemySize });

  let pointX, pointY;
  attempts = 0;
  do {
    pointX = Math.random() * (canvas.width - pointSize);
    pointY = Math.random() * (canvas.height - pointSize);
    attempts++;
    if (attempts > 100) break;
  } while (!isPositionFree(pointX, pointY, pointSize));

  points.push({ x: pointX, y: pointY, size: pointSize });
}

setInterval(() => {
  if (gameStarted && !gameOver && transitionFinished) {
    spawnEnemyAndPoint();
  }
}, 1000);

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " " && !isDashing) Dash();
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

let collided = false;
function checkCollision() {
  const touchL = player.x <= 0;
  const touchR = player.x + player.width >= canvas.width;
  const touchU = player.y <= 0;
  const touchD = player.y + player.height >= canvas.height;
  const isTouching = touchL || touchR || touchU || touchD;

  if (isTouching && !collided) {
    collided = true;
    logger("checkCollision();");
    triggerShake(200, 4);
    BSound();
  } else if (!isTouching && collided) {
    collided = false;
  }
}

function Dash() {
  isDashing = true;
  dashEndTime = Date.now() + dashDuration;
  logger("Dash();");
  triggerShake(200, 4);
  CSound();
  player.maxSpeed = ogMaxspeed * dashMultiplier - player.maxSpeed;

  setTimeout(() => {
    isDashing = false;
    player.maxSpeed = ogMaxspeed;
  }, dashDuration);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.addEventListener(
  "click",
  () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
  },
  { once: true }
);

function DSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 80;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function BSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 101;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function ASound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 300;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function CSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 200;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function playKeySound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 200;
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

function playLineSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 200;
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playEnterSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 300;
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function drawScoreboard() {
  ctx.fillStyle = "white";
  ctx.font = "bold 1.2rem monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Score: ${score}`, 20, 20);
}

function drawLives() {
  ctx.fillStyle = "white";
  ctx.font = "bold 1.2rem monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Lives: ${lives}`, 20, 50);
}

function drawGameOver() {
  logger("drawGameOver();", 6500);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";
  ctx.font = "bold 3rem monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = "white";
  ctx.font = "bold 1.5rem monospace";
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 20
  );

  ctx.font = "1rem monospace";
  ctx.fillText(
    "Press Enter to Restart",
    canvas.width / 2,
    canvas.height / 2 + 60
  );
}

document.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "Enter") {
    lives = 20;
    score = 0;
    gameOver = false;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    points.splice(0, points.length);

    points.push({ x: 200, y: 150, size: remTopx(1.5) });
    points.push({ x: 300, y: 300, size: remTopx(1.5) });
    enemies.splice(0, enemies.length);
    enemies.push({ x: 100, y: 100, size: remTopx(1.5) });
    enemies.push({ x: 400, y: 200, size: remTopx(1.5) });
    gameStarted = true;
    transitionFinished = true;
    requestAnimationFrame(gameLoop);
  }
});

function drawStartScreen() {
  logger("drawStartScreen;", 6500);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 1.3rem monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Press ENTER to Start", canvas.width / 2, canvas.height / 2);
}
document.addEventListener("keydown", (e) => {
  if (e.code === "Enter" && !transitionStarted) {
    transitionStarted = true;
    playEnterSound();

    runStartupTransition(() => {
      transitionFinished = true;
      gameStarted = true;
      requestAnimationFrame(gameLoop);
    });
  }
});
function gameLoop() {
  if (!transitionStarted) {
    drawStartScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!transitionFinished) {
    return;
  }
  if (gameOver) {
    drawGameOver();
    return;
  }
  if (shakeDuration > 0) {
    const dx = (Math.random() * 2 - 1) * shakeMagnitude;
    const dy = (Math.random() * 2 - 1) * shakeMagnitude;
    shakeOffsetX = dx;
    shakeOffsetY = dy;
    shakeDuration -= 16;
  } else {
    shakeOffsetX = 0;
    shakeOffsetY = 0;
  }
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(shakeOffsetX, shakeOffsetY);
  movePlayer();
  checkCollision();
  checkEntityCollisions();
  drawTrail();
  drawEnemies();
  drawPoints();
  drawPlayer();
  drawLives();
  drawScoreboard();
  ctx.restore();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
