const CARDS_PER_YEAR = 10;
const PASSIVE_HAZINE_DRAIN = 5;

const DEATH_TABLE = {
  saray:    { 0: "Sultan sana idam fermanı gönderdi. Başın gövdenden ayrıldı.", 100: "Sultan gücünden korktu. Kafanı daha önce davranarak aldı." },
  "yeniçeri": { 0: "Ordun dağıldı. Düşman ordusu İstanbul surlarına dayandı.", 100: "Yeniçeriler saraya yürüdü. Tahtı devirdi. Seni de." },
  ulema:    { 0: "Şeyhülislam dinsizlikle itham etti. Halk seni linç etti.", 100: "Ulema artık senden değil, Şeyhülislam'dan emir alıyor." },
  hazine:   { 0: "Devlet iflas etti. Asker maaşını alamadı. Herkes kaçtı.", 100: "Hazinede bu kadar altın tehlikeli. Sultan seni zimmetçilikle suçladı." },
};

const CHAR_IMAGE_MAP = {
  "4. Defterdar":    "4. Defterdar",
  "5. Valide Sultan":"5. Valide Sultan",
  "6. Kaptan-ı Derya":"6. Kaptan-ı Derya",
  "7. Yabancı Elçi": "7. Yabancı Elçi",
  "8. Rakip Vezir":  "8. Rakip Vezir",
  "3-Seyhulislam":   "3-Seyhulislam",
};

// ── State ─────────────────────────────────────────────────────────────────────
let allCards = [];
let stats = { saray: 50, "yeniçeri": 50, ulema: 50, hazine: 50 };
let year = 1;
let cardsPlayed = 0;
let activeFlags = {};
let isGameOver = false;
let playCounts = {};
let forcedQueue = [];

// ── DOM ───────────────────────────────────────────────────────────────────────
const card        = document.getElementById("card");
const cardImage   = document.getElementById("card-image");
const charName    = document.getElementById("card-char-name");
const cardText    = document.getElementById("card-text");
const choiceLeft  = document.getElementById("choice-left");
const choiceRight = document.getElementById("choice-right");
const yearLabel   = document.getElementById("year-label");
const overlayL    = document.getElementById("card-overlay-left");
const overlayR    = document.getElementById("card-overlay-right");
const gameoverScreen = document.getElementById("gameover-screen");
const gameoverReason = document.getElementById("gameover-reason");
const gameoverYear   = document.getElementById("gameover-year");
document.getElementById("restart-btn").addEventListener("click", restartGame);

// ── Boot ──────────────────────────────────────────────────────────────────────
fetch("data/cards.json")
  .then(r => r.json())
  .then(data => { allCards = data.cards; dealNext(); });

// ── Deck ──────────────────────────────────────────────────────────────────────
function getNextCard() {
  if (forcedQueue.length) return forcedQueue.shift();
  let eligible = getEligible();
  if (!eligible.length) { playCounts = {}; eligible = getEligible(); }
  if (!eligible.length) return null;
  return weightedPick(eligible);
}

function getEligible() {
  return allCards.filter(c => passesFilters(c)).map(c => {
    const times = playCounts[c.id] || 0;
    if (times > 0) {
      const copy = { ...c, weight: Math.max(1, Math.floor((c.weight || 10) / (times * 2))) };
      return copy;
    }
    return c;
  });
}

function passesFilters(c) {
  if ((c.min_year || 1) > year) return false;
  if ((c.max_year || 9999) < year) return false;
  for (const f of (c.required_flags || [])) if (!activeFlags[f]) return false;
  for (const f of (c.excluded_flags || [])) if (activeFlags[f]) return false;
  for (const [stat, cond] of Object.entries(c.stat_conditions || {})) {
    const val = stats[stat] ?? 50;
    if (cond.min !== undefined && val < cond.min) return false;
    if (cond.max !== undefined && val > cond.max) return false;
  }
  return true;
}

function weightedPick(cards) {
  const total = cards.reduce((s, c) => s + (c.weight || 10), 0);
  let roll = Math.random() * total;
  for (const c of cards) {
    roll -= (c.weight || 10);
    if (roll <= 0) { playCounts[c.id] = (playCounts[c.id] || 0) + 1; return c; }
  }
  const last = cards[cards.length - 1];
  playCounts[last.id] = (playCounts[last.id] || 0) + 1;
  return last;
}

// ── Card display ──────────────────────────────────────────────────────────────
let currentCard = null;

function dealNext() {
  const c = getNextCard();
  if (!c) return;
  currentCard = c;

  const key = c.character || "";
  const imgName = key + ".jpg";
  cardImage.src = "assets/characters/" + encodeURIComponent(imgName);
  cardImage.onerror = () => { cardImage.src = ""; };

  charName.textContent = c.character_name || "";
  cardText.textContent = c.text || "";
  choiceLeft.textContent  = c.left_text  || "Hayır";
  choiceRight.textContent = c.right_text || "Evet";

  choiceLeft.style.opacity  = "0";
  choiceRight.style.opacity = "0";
  overlayL.style.opacity = "0";
  overlayR.style.opacity = "0";

  card.style.transform = "translateY(40px)";
  card.style.opacity = "0";
  card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transform = "translateY(0) rotate(0deg)";
    card.style.opacity = "1";
  }));
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStatUI() {
  const map = { saray: "saray", "yeniçeri": "yeniceri", ulema: "ulema", hazine: "hazine" };
  for (const [key, id] of Object.entries(map)) {
    const val = stats[key];
    const fill = document.getElementById("fill-" + id);
    fill.style.width = val + "%";
    fill.className = "stat-fill" + (val <= 20 || val >= 80 ? " danger" : val <= 35 || val >= 65 ? " warn" : "");
  }
}

function amplify(stat, delta) {
  const val = stats[stat] ?? 50;
  const dist = Math.abs(val - 50);
  const mult = 1.0 + dist / 100;
  return Math.round(delta * mult);
}

function applyEffects(effects) {
  for (const [stat, raw] of Object.entries(effects || {})) {
    const amp = amplify(stat, raw);
    stats[stat] = Math.min(100, Math.max(0, (stats[stat] ?? 50) + amp));
  }
  updateStatUI();
  checkGameOver();
}

function checkGameOver() {
  for (const stat of Object.keys(stats)) {
    if (stats[stat] <= 0)   { triggerGameOver(DEATH_TABLE[stat]?.[0]   || "Oyun bitti."); return true; }
    if (stats[stat] >= 100) { triggerGameOver(DEATH_TABLE[stat]?.[100] || "Oyun bitti."); return true; }
  }
  return false;
}

function triggerGameOver(reason) {
  isGameOver = true;
  setTimeout(() => {
    gameoverReason.textContent = reason;
    gameoverYear.textContent = year + " yıl ayakta kaldın.";
    gameoverScreen.classList.add("visible");
  }, 600);
}

function advanceYear() {
  year++;
  yearLabel.textContent = year + ". YIL";
  const old = stats.hazine;
  stats.hazine = Math.max(0, stats.hazine - PASSIVE_HAZINE_DRAIN);
  updateStatUI();
  checkGameOver();
}

// ── Swipe / Drag ──────────────────────────────────────────────────────────────
const THRESHOLD = 100;
let startX = 0, startY = 0, curX = 0, isDragging = false, isAnimating = false;

function onStart(x, y) {
  if (isAnimating || isGameOver) return;
  startX = x; startY = y; curX = x; isDragging = true;
  card.classList.add("dragging");
  card.style.transition = "none";
}

function onMove(x) {
  if (!isDragging) return;
  curX = x;
  const dx = curX - startX;
  const rot = Math.max(-14, Math.min(14, dx * 14 / THRESHOLD));
  card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;

  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);
  if (dx < -15) {
    overlayL.style.opacity = String(progress * 0.6);
    overlayR.style.opacity = "0";
    choiceLeft.style.opacity  = String(progress);
    choiceRight.style.opacity = "0";
  } else if (dx > 15) {
    overlayR.style.opacity = String(progress * 0.6);
    overlayL.style.opacity = "0";
    choiceRight.style.opacity = String(progress);
    choiceLeft.style.opacity  = "0";
  } else {
    overlayL.style.opacity = overlayR.style.opacity = "0";
    choiceLeft.style.opacity = choiceRight.style.opacity = "0";
  }
}

function onEnd() {
  if (!isDragging) return;
  isDragging = false;
  card.classList.remove("dragging");
  const dx = curX - startX;
  if (dx < -THRESHOLD) flyOff("left");
  else if (dx > THRESHOLD) flyOff("right");
  else snapBack();
}

function flyOff(dir) {
  if (isAnimating) return;
  isAnimating = true;
  const tx = dir === "left" ? -600 : 600;
  card.style.transition = "transform 0.25s ease-in, opacity 0.2s ease-in";
  card.style.transform = `translateX(${tx}px) rotate(${dir === "left" ? -20 : 20}deg)`;
  card.style.opacity = "0";
  setTimeout(() => {
    isAnimating = false;
    decide(dir);
  }, 280);
}

function snapBack() {
  card.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s";
  card.style.transform = "translateX(0) rotate(0deg)";
  overlayL.style.opacity = overlayR.style.opacity = "0";
  choiceLeft.style.opacity = choiceRight.style.opacity = "0";
}

function decide(dir) {
  if (!currentCard) return;
  for (const f of (currentCard[(dir + "_flags_set")] || [])) activeFlags[f] = true;
  applyEffects(currentCard[dir + "_effects"] || {});
  if (isGameOver) return;
  cardsPlayed++;
  if (cardsPlayed % CARDS_PER_YEAR === 0) advanceYear();
  if (!isGameOver) setTimeout(dealNext, 150);
}

// Mouse
card.addEventListener("mousedown",  e => onStart(e.clientX, e.clientY));
window.addEventListener("mousemove", e => { if (isDragging) onMove(e.clientX); });
window.addEventListener("mouseup",   () => onEnd());

// Touch
card.addEventListener("touchstart", e => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
window.addEventListener("touchmove", e => { if (isDragging) { e.preventDefault(); onMove(e.touches[0].clientX); } }, { passive: false });
window.addEventListener("touchend",  () => onEnd());

// ── Restart ───────────────────────────────────────────────────────────────────
function restartGame() {
  stats = { saray: 50, "yeniçeri": 50, ulema: 50, hazine: 50 };
  year = 1; cardsPlayed = 0; activeFlags = {}; isGameOver = false;
  playCounts = {}; forcedQueue = [];
  yearLabel.textContent = "1. YIL";
  updateStatUI();
  gameoverScreen.classList.remove("visible");
  card.style.opacity = "0";
  setTimeout(dealNext, 100);
}

updateStatUI();
