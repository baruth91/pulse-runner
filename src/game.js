import {
  createState,
  createLevel,
  update,
  requestJump,
  LEVELS,
  getLevel,
  checkpointDistances,
  restartState,
  SIZE,
} from "./engine.js";
import { readRecords, recordAttempt, recordKey } from "./records.js";
import { SKINS, getSkin, drawSkin, createFragments } from "./cosmetics.js";
import { GameAudio } from "./audio.js";
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const play = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const help = document.getElementById("help-dialog");
const status = document.getElementById("status");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const audio = new GameAudio();
const soundButton = document.getElementById("sound-toggle");
const soundStatus = document.getElementById("sound-status");
const audioPrefs = storedRecords("pulse-runner-audio-v1");
if (audioPrefs && typeof audioPrefs === "object") {
  audio.music = audioPrefs.music !== false;
  audio.effects = audioPrefs.effects !== false;
  if (
    typeof audioPrefs.volume === "number" &&
    Number.isFinite(audioPrefs.volume)
  )
    audio.setVolume(audioPrefs.volume);
}
document.getElementById("music-toggle").checked = audio.music;
document.getElementById("effects-toggle").checked = audio.effects;
document.getElementById("sound-volume").value = Math.round(audio.volume * 100);
document.getElementById("volume-value").textContent =
  `${Math.round(audio.volume * 100)}%`;
function saveAudioPrefs() {
  try {
    localStorage.setItem(
      "pulse-runner-audio-v1",
      JSON.stringify({
        music: audio.music,
        effects: audio.effects,
        volume: audio.volume,
      }),
    );
  } catch {
    /* Optional storage. */
  }
}
function syncAudio() {
  audio.running = state.status === "running" && !document.hidden;
  audio.sync();
}
soundButton.addEventListener("click", async () => {
  audio.enabled = !audio.enabled;
  const enabled = audio.enabled;
  soundButton.setAttribute("aria-pressed", String(enabled));
  soundButton.textContent = enabled ? "Desligar som" : "Ativar som";
  if (!enabled) {
    audio.silence();
    soundStatus.textContent = "Som desligado";
    return;
  }
  try {
    await audio.activate();
    syncAudio();
    if (audio.enabled)
      soundStatus.textContent = "Som ativado · a trilha toca durante a partida";
  } catch {
    audio.enabled = false;
    audio.silence();
    soundButton.setAttribute("aria-pressed", "false");
    soundButton.textContent = "Ativar som";
    soundStatus.textContent =
      "Áudio indisponível. Você pode continuar jogando sem som.";
  }
});
for (const [id, property] of [
  ["music-toggle", "music"],
  ["effects-toggle", "effects"],
])
  document.getElementById(id).addEventListener("change", (event) => {
    audio[property] = event.target.checked;
    syncAudio();
    saveAudioPrefs();
  });
document.getElementById("sound-volume").addEventListener("input", (event) => {
  audio.setVolume(Number(event.target.value) / 100);
  document.getElementById("volume-value").textContent =
    `${event.target.value}%`;
  saveAudioPrefs();
});
let skin = getSkin(storedRecords("pulse-runner-skin-v1"));
let impact = null;
function selectSkin(id, announce = true) {
  skin = getSkin(id);
  let saved = true;
  try {
    localStorage.setItem("pulse-runner-skin-v1", JSON.stringify(skin.id));
  } catch {
    saved = false;
  }
  document
    .querySelectorAll("[data-skin]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.skin === skin.id),
      ),
    );
  document.getElementById("skin-status").textContent = announce
    ? `${skin.name} selecionada · ${saved ? "salva neste navegador" : "válida nesta sessão"}`
    : "";
}
for (const option of SKINS) {
  const button = document.createElement("button");
  button.dataset.skin = option.id;
  const preview = document.createElement("canvas");
  preview.width = 40;
  preview.height = 40;
  preview.setAttribute("aria-hidden", "true");
  const context = preview.getContext("2d");
  context.translate(20, 20);
  drawSkin(context, option);
  button.append(preview, document.createTextNode(option.name));
  button.addEventListener("click", () => {
    pause();
    selectSkin(option.id);
  });
  document.getElementById("skin-buttons").append(button);
}
selectSkin(skin.id, false);
let mode = "pulse",
  levelId = "circuit",
  practice = false;
let obstacles = createLevel(levelId),
  state = createState(mode, levelId, practice);
let attempts = 0,
  lastTime = 0,
  width = 1100,
  height = 360;
let best = readRecords(null);
let lastCheckpoint = 0;
document.getElementById("practice").checked = false;
function storedRecords(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null; // One corrupt version must not discard another valid version.
  }
}
best = readRecords(
  storedRecords("pulse-runner-best-v2"),
  storedRecords("pulse-runner-best-v1"),
);
function progress() {
  return Math.min(
    100,
    Math.floor((state.distance / getLevel(levelId).finish) * 100),
  );
}
function updateRecords() {
  document.getElementById("best-label").textContent = practice
    ? "CHECKPOINT"
    : "MELHOR";
  document.getElementById("best").textContent = practice
    ? `${Math.floor((state.checkpoint / getLevel(levelId).finish) * 100)}%`
    : `${best[recordKey(levelId, mode)]}%`;
  for (const level of LEVELS)
    document.getElementById(`best-${level.id}`).textContent =
      `Sem treino: ${best[recordKey(level.id, mode)]}%`;
}
function saveBest() {
  best = recordAttempt(best, state);
  if (!state.practice)
    try {
      localStorage.setItem("pulse-runner-best-v2", JSON.stringify(best));
    } catch {
      /* No storage is required to play. */
    }
  updateRecords();
}
function overlayText(kicker, title, description, button) {
  document.getElementById("overlay-kicker").textContent = kicker;
  document.getElementById("overlay-title").textContent = title;
  document.getElementById("overlay-copy").textContent = description;
  document.getElementById("result-summary").hidden = true;
  document.getElementById("next-level").hidden = true;
  play.textContent = button;
  overlay.hidden = false;
}
function start() {
  impact = null;
  if (state.status === "paused") state.status = "running";
  else {
    if (state.status !== "ready") state = restartState(state);
    state.status = "running";
    attempts++;
    document.getElementById("attempts").textContent = String(attempts).padStart(
      2,
      "0",
    );
  }
  lastCheckpoint = state.checkpoint;
  overlay.hidden = true;
  pauseButton.disabled = false;
  pauseButton.textContent = "Ⅱ";
  pauseButton.setAttribute("aria-label", "Pausar jogo");
  status.textContent = practice
    ? "Treino ativo · checkpoints não contam para recordes"
    : "No circuito · espaço / clique / toque para saltar";
  updateRecords();
  lastTime = performance.now();
  canvas.focus({ preventScroll: true });
  if (audio.enabled)
    void audio
      .activate()
      .then(syncAudio)
      .catch(() => {
        soundStatus.textContent =
          "Não foi possível retomar o áudio. Desligue e ative o som novamente.";
      });
  syncAudio();
}
function pause() {
  if (state.status !== "running") return;
  state.status = "paused";
  audio.silence();
  pauseButton.textContent = "▶";
  pauseButton.setAttribute("aria-label", "Continuar jogo");
  status.textContent = "Partida pausada";
  overlayText(
    "RESPIRE UM POUCO",
    "No seu tempo.",
    "Seu progresso está aqui. Continue quando quiser.",
    "Continuar →",
  );
}
function reset(fromBeginning = false) {
  saveBest();
  state = restartState(state, fromBeginning);
  start();
}
function jump() {
  if (help.open) return;
  if (state.status === "running") requestJump(state);
  else start();
}
function selectRun() {
  audio.silence();
  impact = null;
  state = createState(mode, levelId, practice);
  obstacles = createLevel(levelId);
  attempts = 0;
  lastCheckpoint = 0;
  document.getElementById("attempts").textContent = "00";
  const level = getLevel(levelId);
  document.getElementById("level-number").textContent =
    `FASE ${level.number}${practice ? " · TREINO" : ""}`;
  document.getElementById("level-name").textContent = level.name;
  document
    .querySelectorAll("[data-level]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.level === levelId),
      ),
    );
  document
    .querySelectorAll("[data-mode]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)),
    );
  document.getElementById("from-start").hidden = true;
  pauseButton.disabled = true;
  status.textContent = practice
    ? "Treino selecionado · sem alterar recordes"
    : "Circuito escolhido · pronto para começar";
  overlayText(
    practice ? "APRENDA UM TRECHO DE CADA VEZ" : `CIRCUITO ${level.number}`,
    level.name,
    practice
      ? "Checkpoints guardam seu avanço nesta sessão. Após errar, continue do último trecho salvo."
      : level.description,
    "Começar a jogar →",
  );
  updateRecords();
}
play.addEventListener("click", start);
document.getElementById("restart").addEventListener("click", () => reset());
document
  .getElementById("from-start")
  .addEventListener("click", () => reset(true));
pauseButton.addEventListener("click", () =>
  state.status === "paused" ? start() : pause(),
);
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  jump();
});
document.addEventListener("keydown", (event) => {
  if (
    help.open ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target.closest?.("input,select,textarea,[contenteditable]")
  )
    return;
  if (["Space", "ArrowUp"].includes(event.code)) {
    if (event.target.closest?.("button,a")) return;
    event.preventDefault();
    jump();
  } else if (event.code === "KeyP") {
    event.preventDefault();
    state.status === "paused" ? start() : pause();
  } else if (event.code === "KeyR") {
    event.preventDefault();
    reset();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause();
    audio.silence();
  }
});
window.addEventListener("pagehide", () => audio.silence());
document.getElementById("help").addEventListener("click", () => {
  pause();
  help.showModal();
});
document
  .getElementById("close-help")
  .addEventListener("click", () => help.close());
document.querySelectorAll("[data-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    saveBest();
    mode = button.dataset.mode;
    selectRun();
  }),
);
document.querySelectorAll("[data-level]").forEach((button) =>
  button.addEventListener("click", () => {
    saveBest();
    levelId = button.dataset.level;
    selectRun();
  }),
);
document.getElementById("practice").addEventListener("change", (event) => {
  saveBest();
  practice = event.target.checked;
  selectRun();
});
document.getElementById("next-level").addEventListener("click", () => {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  levelId = LEVELS[(index + 1) % LEVELS.length].id;
  selectRun();
});
updateRecords();

function resize() {
  const rect = canvas.getBoundingClientRect(),
    dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  width = Math.max(520, rect.width);
  height = rect.height;
}
new ResizeObserver(resize).observe(canvas);
function line(x1, y1, x2, y2, color, lineWidth = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function draw() {
  const scaleX = canvas.width / width,
    scaleY = canvas.height / height;
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const floor = height - 60,
    playerX = Math.min(110, width * 0.18),
    shift = state.distance;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#15221c");
  gradient.addColorStop(1, "#1b2b21");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const drift = reduced ? 0 : shift * 0.16;
  for (let x = -80 - (drift % 90); x < width; x += 90)
    line(x, 0, x, height, "#b9f27807");
  for (let y = 30; y < height; y += 60) line(0, y, width, y, "#b9f27806");
  // Original geometric scenery, drawn entirely in code.
  for (let index = 0; index < 7; index++) {
    const x = (index * 240 - drift * 0.6) % (width + 300);
    const y = 65 + (index % 3) * 31;
    ctx.strokeStyle = "#b9f2780d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 75, y + 120);
    ctx.lineTo(x - 75, y + 120);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = "#101b15";
  ctx.fillRect(0, floor, width, height - floor);
  line(0, floor, width, floor, "#b9f27888", 1);
  for (let x = -((shift * 0.6) % 40); x < width; x += 40)
    line(x, floor + 20, x + 12, floor + 20, "#66835630");
  for (const obstacle of obstacles) {
    const x = obstacle.x - shift + playerX;
    if (x < -100 || x > width + 100) continue;
    ctx.fillStyle = "#ff9b8026";
    ctx.strokeStyle = "#ff9b80";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (obstacle.type === "spike") {
      ctx.moveTo(x, floor);
      ctx.lineTo(x + obstacle.width / 2, floor - obstacle.height);
      ctx.lineTo(x + obstacle.width, floor);
      ctx.closePath();
    } else
      ctx.rect(x, floor - obstacle.height, obstacle.width, obstacle.height);
    ctx.fill();
    ctx.stroke();
    if (obstacle.type === "block")
      line(
        x + 7,
        floor - obstacle.height + 7,
        x + obstacle.width - 7,
        floor - 7,
        "#ff9b8055",
      );
  }
  if (practice)
    for (const point of checkpointDistances(levelId)) {
      const x = point - shift + playerX;
      if (x < -20 || x > width + 20) continue;
      line(
        x,
        floor - 65,
        x,
        floor,
        state.checkpoint >= point ? "#b9f278" : "#a1b7b080",
        1,
      );
      ctx.fillStyle = state.checkpoint >= point ? "#b9f278" : "#a1b7b080";
      ctx.beginPath();
      ctx.moveTo(x, floor - 65);
      ctx.lineTo(x + 14, floor - 58);
      ctx.lineTo(x, floor - 51);
      ctx.fill();
    }
  const finishX = getLevel(levelId).finish - shift + playerX;
  if (finishX < width + 30) {
    line(finishX, 30, finishX, floor, "#b9f278", 2);
    ctx.fillStyle = "#b9f278";
    ctx.font = "10px system-ui";
    ctx.fillText("CHEGADA", finishX + 8, 48);
  }
  ctx.fillStyle = "#b9f2780d";
  ctx.beginPath();
  ctx.ellipse(
    playerX + SIZE / 2,
    floor + 5,
    23 - state.y * 0.035,
    4,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (state.status !== "dead" || reduced) {
    ctx.save();
    ctx.translate(playerX + SIZE / 2, floor - state.y - SIZE / 2);
    ctx.rotate(reduced ? 0 : state.rotation);
    ctx.shadowColor = skin.color;
    ctx.shadowBlur = reduced ? 0 : 18;
    drawSkin(ctx, skin, SIZE);
    ctx.restore();
  } else if (impact) {
    const t = impact.age;
    for (const fragment of impact.fragments) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 0.85);
      ctx.translate(
        playerX + SIZE / 2 + fragment.x + fragment.vx * t,
        floor -
          impact.y -
          SIZE / 2 +
          fragment.y +
          fragment.vy * t +
          260 * t * t,
      );
      ctx.rotate(fragment.spin * t);
      ctx.fillStyle = impact.color;
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.restore();
    }
  }
  if (state.status === "ready") {
    ctx.fillStyle = "#a8bd9c";
    ctx.font = "9px system-ui";
    ctx.fillText("VOCÊ", playerX + 4, floor - 48);
  }
}
function frame(timestamp) {
  const elapsed = lastTime ? (timestamp - lastTime) / 1000 : 0;
  lastTime = timestamp;
  const previous = state.status;
  update(state, elapsed, obstacles);
  if (impact) {
    impact.age += Math.min(Math.max(elapsed, 0), 0.1);
    if (state.status === "dead" && overlay.hidden && impact.age >= 0.65) {
      overlay.hidden = false;
      if (document.activeElement === canvas)
        play.focus({ preventScroll: true });
    }
  }
  if (state.checkpoint > lastCheckpoint) {
    lastCheckpoint = state.checkpoint;
    updateRecords();
    status.textContent = `Checkpoint salvo · ${Math.floor((state.checkpoint / getLevel(levelId).finish) * 100)}% · treino`;
  }
  document.getElementById("from-start").hidden =
    !practice || state.checkpoint === 0;
  if (previous === "running" && ["dead", "won"].includes(state.status)) {
    audio.silence();
    if (state.status === "dead") audio.crash();
    saveBest();
    pauseButton.disabled = true;
    if (state.status === "dead") {
      impact = {
        age: 0,
        y: state.y,
        color: skin.color,
        fragments: createFragments(),
      };
      status.textContent = `Tentativa encerrada · ${progress()}%${practice ? " · treino" : ""}`;
      overlayText(
        practice ? "UM TRECHO DE CADA VEZ" : "O PRÓXIMO SALTO VEM AÍ",
        "Mais uma tentativa?",
        practice && state.checkpoint > 0
          ? `Seu checkpoint está em ${Math.floor((state.checkpoint / getLevel(levelId).finish) * 100)}%. Retome o trecho ou escolha Do início.`
          : `Você chegou a ${progress()}%. Cada tentativa ensina um pouco mais.`,
        practice && state.checkpoint > 0
          ? "Retomar checkpoint →"
          : "Tentar de novo →",
      );
    } else {
      status.textContent = practice
        ? "Circuito concluído em treino · sem recorde"
        : "Circuito completo!";
      overlayText(
        practice ? "TREINO CONCLUÍDO" : "CIRCUITO COMPLETO",
        "Você encontrou o ritmo.",
        practice
          ? "Agora experimente completar este caminho sem checkpoints."
          : "Belo percurso. Experimente outro circuito ou outro ritmo.",
        "Jogar novamente →",
      );
      document.getElementById("next-level").hidden = false;
    }
    const summary = document.getElementById("result-summary");
    summary.textContent = `${progress()}% · ${state.jumps} saltos nesta tentativa · ${practice ? "treino" : "sem assistência"}`;
    summary.hidden = false;
    if (state.status === "dead" && !reduced) overlay.hidden = true;
    else if (document.activeElement === canvas)
      play.focus({ preventScroll: true });
  }
  const current = progress();
  document.getElementById("progress").style.width = `${current}%`;
  document
    .querySelector('[role="progressbar"]')
    .setAttribute("aria-valuenow", String(current));
  draw();
  requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
