// ═══════════════════════════════════════════════════════════════════
//  SADRAZAM — game.js
// ═══════════════════════════════════════════════════════════════════

const CARDS_PER_YEAR = 10;
const PASSIVE_HAZINE_DRAIN = 5;

const DEATH_TABLE = {
  saray:      { 0: "Sultan sana idam fermanı gönderdi. Başın gövdenden ayrıldı.", 100: "Sultan gücünden korktu. Kafanı daha önce davranarak aldı." },
  "yeniçeri": { 0: "Ordun dağıldı. Düşman ordusu İstanbul surlarına dayandı.", 100: "Yeniçeriler saraya yürüdü. Tahtı devirdi. Seni de." },
  ulema:      { 0: "Şeyhülislam dinsizlikle itham etti. Halk seni linç etti.", 100: "Ulema artık senden değil, Şeyhülislam'dan emir alıyor." },
  hazine:     { 0: "Devlet iflas etti. Asker maaşını alamadı. Herkes kaçtı.", 100: "Hazinede bu kadar altın tehlikeli. Sultan seni zimmetçilikle suçladı." },
};

// ── Sultan tanımları ──────────────────────────────────────────────
const SULTANS = [
  {
    id: "kanuni",
    name: "Kanuni Sultan Süleyman",
    desc: "Dengeli başlangıç",
    stats: { saray: 55, "yeniçeri": 50, ulema: 55, hazine: 50 },
    sultanSabir: 50
  },
  {
    id: "yavuz",
    name: "Yavuz Sultan Selim",
    desc: "Güçlü ama sabırsız. Hazine düşük.",
    stats: { saray: 65, "yeniçeri": 65, ulema: 60, hazine: 35 },
    sultanSabir: 35
  },
  {
    id: "murad3",
    name: "III. Murad",
    desc: "Zengin hazine, zayıf otorite.",
    stats: { saray: 40, "yeniçeri": 40, ulema: 45, hazine: 65 },
    sultanSabir: 60
  }
];

// ── Danışman tanımları ────────────────────────────────────────────
const ADVISORS = [
  {
    id: "sokollu",
    name: "Sokollu Mehmed Paşa",
    icon: "⚖️",
    title: "Deneyimli Vezir",
    desc: "Tüm stat değişimleri %15 azalır",
    effect: "reduce_all_15"
  },
  {
    id: "piri_reis",
    name: "Piri Reis",
    icon: "⚓",
    title: "Kaptan-ı Derya",
    desc: "Her yıl Hazine +6",
    effect: "hazine_per_year_6"
  },
  {
    id: "sinan",
    name: "Mimar Sinan",
    icon: "🏛️",
    title: "Baş Mimar",
    desc: "Saray ve Ulema etkileri %20 güçlenir",
    effect: "saray_ulema_boost_20"
  },
  {
    id: "semsi",
    name: "Şemsi Paşa",
    icon: "📜",
    title: "Saray Kâtibi",
    desc: "Sultan sabrı azalması %50 yavaşlar",
    effect: "sultan_sabir_slow_50"
  },
  {
    id: "hurrem",
    name: "Hürrem Haseki Sultan",
    icon: "💎",
    title: "Has Kadın",
    desc: "Yeniçeri negatif etkileri %25 azalır",
    effect: "yeniceri_neg_reduce_25"
  }
];

// ── Arc tanımları ─────────────────────────────────────────────────
const ARCS = {
  venedik: ["venedik_1", "venedik_2", "venedik_3"],
  dogu_seferi: ["dogu_1", "dogu_2", "dogu_3"]
};

// ── State ─────────────────────────────────────────────────────────
let allCards = [];
let stats = { saray: 50, "yeniçeri": 50, ulema: 50, hazine: 50 };
let year = 1;
let cardsPlayed = 0;
let activeFlags = {};
let isGameOver = false;
let playCounts = {};
let forcedQueue = [];
let scheduledCards = [];  // [{cardId, afterCardsPlayed}]
let characterMemory = {}; // { "char_key": {left:0, right:0, last:null} }
let activeArcs = {};      // { arcId: nextIndex }
let triggeredArcs = {};   // { arcId: true }
let sultanSabir = 50;
let selectedSultan = null;
let selectedAdvisors = [];
let isPasaMode = false;
let pasaPromoted = false;
let currentTitle = "SADRAZAM";

// ── DOM ───────────────────────────────────────────────────────────
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
const titleLabel     = document.getElementById("title-label");

// Ekran referansları
const introScreen      = document.getElementById("intro-screen");
const howtoScreen      = document.getElementById("howto-screen");
const gameScreen       = document.getElementById("game");
const sultanScreen     = document.getElementById("sultan-screen");
const advisorScreen    = document.getElementById("advisor-screen");
const negotiationPanel = document.getElementById("negotiation-panel");
const cardChoices      = document.getElementById("card-choices");

// ── Ekran Geçişleri ───────────────────────────────────────────────
document.getElementById("btn-start").addEventListener("click", () => {
  isPasaMode = false;
  introScreen.style.display = "none";
  showSultanScreen();
});

document.getElementById("btn-pasa-mode").addEventListener("click", () => {
  isPasaMode = true;
  introScreen.style.display = "none";
  showSultanScreen();
});

document.getElementById("btn-howto").addEventListener("click", () => {
  introScreen.style.display = "none";
  howtoScreen.classList.add("visible");
});

document.getElementById("btn-play-now").addEventListener("click", () => {
  howtoScreen.classList.remove("visible");
  showSultanScreen();
});

document.getElementById("restart-btn").addEventListener("click", restartGame);

// ── Sultan Seçim Ekranı ───────────────────────────────────────────
function showSultanScreen() {
  sultanScreen.classList.remove("hidden");
  const grid = document.getElementById("sultan-grid");
  grid.innerHTML = "";
  SULTANS.forEach(s => {
    const btn = document.createElement("div");
    btn.className = "sultan-card";
    btn.innerHTML = `
      <div class="sc-name">${s.name}</div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-stats">
        <span>👑 ${s.stats.saray}</span>
        <span>⚔️ ${s.stats["yeniçeri"]}</span>
        <span>🕌 ${s.stats.ulema}</span>
        <span>💰 ${s.stats.hazine}</span>
      </div>
    `;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sultan-card").forEach(el => el.classList.remove("selected"));
      btn.classList.add("selected");
      selectedSultan = s;
    });
    grid.appendChild(btn);
  });

  document.getElementById("btn-sultan-confirm").addEventListener("click", () => {
    if (!selectedSultan) {
      alert("Lütfen bir sultan seçin.");
      return;
    }
    sultanScreen.classList.add("hidden");
    showAdvisorScreen();
  }, { once: true });
}

// ── Danışman Seçim Ekranı ─────────────────────────────────────────
function showAdvisorScreen() {
  selectedAdvisors = [];
  advisorScreen.classList.remove("hidden");
  const grid = document.getElementById("advisor-grid");
  grid.innerHTML = "";
  ADVISORS.forEach(a => {
    const btn = document.createElement("div");
    btn.className = "advisor-card";
    btn.innerHTML = `
      <div class="ac-icon">${a.icon}</div>
      <div class="ac-name">${a.name}</div>
      <div class="ac-title">${a.title}</div>
      <div class="ac-desc">${a.desc}</div>
    `;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("selected")) {
        btn.classList.remove("selected");
        selectedAdvisors = selectedAdvisors.filter(x => x.id !== a.id);
      } else {
        if (selectedAdvisors.length >= 2) {
          alert("En fazla 2 danışman seçebilirsiniz.");
          return;
        }
        btn.classList.add("selected");
        selectedAdvisors.push(a);
      }
      document.getElementById("advisor-count").textContent = selectedAdvisors.length + "/2 seçildi";
    });
    grid.appendChild(btn);
  });

  document.getElementById("btn-advisor-confirm").addEventListener("click", () => {
    if (selectedAdvisors.length !== 2) {
      alert("Lütfen tam olarak 2 danışman seçin.");
      return;
    }
    advisorScreen.classList.add("hidden");
    startGame();
  }, { once: true });
}

// ── Oyunu Başlat ──────────────────────────────────────────────────
function startGame() {
  // Sultan statlarını uygula
  stats = { ...selectedSultan.stats };
  sultanSabir = selectedSultan.sultanSabir;

  // Paşa modu override
  if (isPasaMode) {
    stats = { saray: 35, "yeniçeri": 35, ulema: 35, hazine: 40 };
    currentTitle = "PAŞA";
    pasaPromoted = false;
  } else {
    currentTitle = "SADRAZAM";
    pasaPromoted = true; // normal modda zaten sadrazam
  }

  year = 1;
  cardsPlayed = 0;
  activeFlags = {};
  isGameOver = false;
  playCounts = {};
  forcedQueue = [];
  scheduledCards = [];
  characterMemory = {};
  activeArcs = {};
  triggeredArcs = {};

  if (titleLabel) titleLabel.textContent = currentTitle;
  yearLabel.textContent = "1. YIL";
  updateStatUI();

  gameScreen.classList.remove("hidden");
  dealNext();
}

// ── Boot ──────────────────────────────────────────────────────────
fetch("data/cards.json")
  .then(r => r.json())
  .then(data => { allCards = data.cards; });

// ── Deck ──────────────────────────────────────────────────────────
function getEventCards() {
  return allCards.filter(c => c.is_event);
}

function getNextCard() {
  // Scheduled cards kontrolü
  checkScheduledCards();

  if (forcedQueue.length) return forcedQueue.shift();

  // Arc kontrolü
  for (const [arcId, idx] of Object.entries(activeArcs)) {
    const arcCards = ARCS[arcId];
    if (arcCards && idx < arcCards.length) {
      const cardId = arcCards[idx];
      activeArcs[arcId]++;
      const arcCard = allCards.find(c => c.id === cardId);
      if (arcCard) return arcCard;
    } else {
      delete activeArcs[arcId];
    }
  }

  let eligible = getEligible();
  if (!eligible.length) { playCounts = {}; eligible = getEligible(); }
  if (!eligible.length) return null;
  return weightedPick(eligible);
}

function checkScheduledCards() {
  const due = scheduledCards.filter(sc => cardsPlayed >= sc.afterCardsPlayed);
  scheduledCards = scheduledCards.filter(sc => cardsPlayed < sc.afterCardsPlayed);
  due.forEach(sc => {
    const c = allCards.find(x => x.id === sc.cardId);
    if (c) forcedQueue.unshift(c);
  });
}

function getEligible() {
  return allCards.filter(c => {
    // Paşa terfi kartı sadece paşa modunda
    if (c.is_pasa_terfi && (!isPasaMode || pasaPromoted)) return false;
    // Event kartları normale karışmasın
    if (c.is_event) return false;
    // Arc kartları sadece arc aktifken
    if (c.arc_id) return false;
    // weight:1 olan özel kartlar (zincirleme, arc vs) normalde çıkmasın
    if (c.weight === 1 && !c.arc_id) return false;
    return passesFilters(c);
  }).map(c => {
    const times = playCounts[c.id] || 0;
    if (times > 0) {
      return { ...c, weight: Math.max(1, Math.floor((c.weight || 10) / (times * 2))) };
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
  // Karakter hafızası filtresi
  if (c.requires_memory) {
    const mem = characterMemory[c.requires_memory.character];
    if (!mem) return false;
    if (mem.last !== c.requires_memory.decision) return false;
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

// ── Card Display ──────────────────────────────────────────────────
let currentCard = null;

function dealNext() {
  if (isGameOver) return;
  const c = getNextCard();
  if (!c) return;
  currentCard = c;

  // Müzakere kartı mı?
  if (c.type === "negotiation") {
    showNegotiationCard(c);
    return;
  }

  hideNegotiationPanel();

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
  card.style.pointerEvents = "auto";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transform = "translateY(0) rotate(0deg)";
    card.style.opacity = "1";
  }));
}

// ── Müzakere ─────────────────────────────────────────────────────
function showNegotiationCard(c) {
  const key = c.character || "";
  cardImage.src = "assets/characters/" + encodeURIComponent(key + ".jpg");
  cardImage.onerror = () => { cardImage.src = ""; };
  charName.textContent = c.character_name || "";
  cardText.textContent = c.text || "";
  choiceLeft.style.opacity  = "0";
  choiceRight.style.opacity = "0";
  overlayL.style.opacity = "0";
  overlayR.style.opacity = "0";

  card.style.transform = "translateY(40px)";
  card.style.opacity = "0";
  card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
  card.style.pointerEvents = "none"; // sürükleme engel

  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transform = "translateY(0) rotate(0deg)";
    card.style.opacity = "1";
  }));

  const panel = document.getElementById("negotiation-panel");
  const optList = document.getElementById("negotiation-options");
  optList.innerHTML = "";
  c.negotiation_options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "negot-btn";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      for (const f of (opt.flags_set || [])) activeFlags[f] = true;
      applyEffects(opt.effects || {});
      hideNegotiationPanel();
      if (!isGameOver) {
        cardsPlayed++;
        if (cardsPlayed % CARDS_PER_YEAR === 0) advanceYear();
        if (!isGameOver) setTimeout(dealNext, 150);
      }
    });
    optList.appendChild(btn);
  });
  panel.classList.remove("hidden");
  cardChoices.style.display = "none";
}

function hideNegotiationPanel() {
  if (negotiationPanel) negotiationPanel.classList.add("hidden");
  if (cardChoices) cardChoices.style.display = "";
}

// ── Stats ─────────────────────────────────────────────────────────
function updateStatUI() {
  const map = { saray: "saray", "yeniçeri": "yeniceri", ulema: "ulema", hazine: "hazine" };
  for (const [key, id] of Object.entries(map)) {
    const val = stats[key];
    const fill = document.getElementById("fill-" + id);
    if (!fill) continue;
    fill.style.width = val + "%";
    fill.className = "stat-fill" + (val <= 20 || val >= 80 ? " danger" : val <= 35 || val >= 65 ? " warn" : "");
  }
}

function hasAdvisor(id) {
  return selectedAdvisors.some(a => a.id === id);
}

function amplify(stat, delta) {
  const val = stats[stat] ?? 50;
  const dist = Math.abs(val - 50);
  const mult = 1.0 + dist / 100;
  return Math.round(delta * mult);
}

function applyEffects(effects) {
  for (let [stat, raw] of Object.entries(effects || {})) {
    // Danışman: Sokollu — tüm değişimler %15 azalır
    if (hasAdvisor("sokollu")) {
      raw = Math.round(raw * 0.85);
    }
    // Danışman: Mimar Sinan — saray ve ulema %20 güçlenir
    if (hasAdvisor("sinan") && (stat === "saray" || stat === "ulema")) {
      raw = Math.round(raw * 1.2);
    }
    // Danışman: Hürrem — yeniçeri negatif %25 azalır
    if (hasAdvisor("hurrem") && stat === "yeniçeri" && raw < 0) {
      raw = Math.round(raw * 0.75);
    }

    const amp = amplify(stat, raw);
    stats[stat] = Math.min(100, Math.max(0, (stats[stat] ?? 50) + amp));

    // Sultan sabrı: saray değişiminden etkilenir
    if (stat === "saray") {
      let sabirChange = raw < 0 ? -3 : 2;
      // Danışman: Şemsi Paşa — sultan sabrı %50 yavaşlar
      if (hasAdvisor("semsi")) sabirChange = Math.round(sabirChange * 0.5);
      sultanSabir = Math.min(100, Math.max(0, sultanSabir + sabirChange));
    }
  }
  updateStatUI();

  // Sultan sabrı kontrolü
  checkSultanSabir();
  checkGameOver();
}

function checkSultanSabir() {
  if (isGameOver) return;
  if (sultanSabir <= 0) {
    triggerGameOver("Sultan seni azletti. Hac yolculuğuna — sürgün olarak — gönderildin.");
  } else if (sultanSabir >= 100) {
    triggerGameOver("Sultan'ın gözünde fazla güçlendin. Gece yarısı cellat geldi.");
  }
}

function checkGameOver() {
  if (isGameOver) return false;
  for (const stat of Object.keys(stats)) {
    if (stats[stat] <= 0)   { triggerGameOver(DEATH_TABLE[stat]?.[0]   || "Oyun bitti."); return true; }
    if (stats[stat] >= 100) { triggerGameOver(DEATH_TABLE[stat]?.[100] || "Oyun bitti."); return true; }
  }
  return false;
}

function triggerGameOver(reason) {
  if (isGameOver) return;
  isGameOver = true;
  saveHighScore();
  setTimeout(() => {
    gameoverReason.textContent = reason;

    const best = parseInt(localStorage.getItem("sadrazam_best_year") || "0");
    let yearText = year + " yıl ayakta kaldın.";
    if (year >= best) {
      yearText += " 🏆 YENİ REKOR!";
    } else {
      yearText += " (Rekor: " + best + " yıl)";
    }
    gameoverYear.textContent = yearText;

    gameoverScreen.classList.add("visible");
  }, 600);
}

function saveHighScore() {
  const best = parseInt(localStorage.getItem("sadrazam_best_year") || "0");
  if (year > best) {
    localStorage.setItem("sadrazam_best_year", String(year));
  }
}

function advanceYear() {
  year++;
  yearLabel.textContent = year + ". YIL";

  // Danışman: Piri Reis — her yıl hazine +6
  if (hasAdvisor("piri_reis")) {
    stats.hazine = Math.min(100, stats.hazine + 6);
  }

  // Pasif hazine azalması
  stats.hazine = Math.max(0, stats.hazine - PASSIVE_HAZINE_DRAIN);
  updateStatUI();
  if (checkGameOver()) return;

  // Paşa terfi kartı (yıl 3'te)
  if (isPasaMode && !pasaPromoted && year === 3) {
    const terfiCard = allCards.find(c => c.is_pasa_terfi);
    if (terfiCard) {
      forcedQueue.unshift(terfiCard);
    }
  }

  // Yıllık event kartı
  const eventCards = getEventCards();
  if (eventCards.length > 0) {
    const ev = eventCards[Math.floor(Math.random() * eventCards.length)];
    forcedQueue.push(ev);
  }
}

// ── Karar ─────────────────────────────────────────────────────────
function decide(dir) {
  if (!currentCard) return;

  // Paşa terfi kartı işlemi
  if (currentCard.is_pasa_terfi) {
    pasaPromoted = true;
    currentTitle = "SADRAZAM";
    if (titleLabel) titleLabel.textContent = currentTitle;
  }

  // Zincirleme kartlar
  const triggerKey = "triggers_on_" + dir;
  if (currentCard[triggerKey]) {
    const delay = currentCard.trigger_delay ?? 3;
    scheduledCards.push({
      cardId: currentCard[triggerKey],
      afterCardsPlayed: cardsPlayed + delay
    });
  }

  // Arc tetikleme
  const arcKey = "triggers_arc_on_" + dir;
  if (currentCard[arcKey]) {
    const arcId = currentCard[arcKey];
    if (!triggeredArcs[arcId] && ARCS[arcId]) {
      triggeredArcs[arcId] = true;
      activeArcs[arcId] = 0;
    }
  }

  // Flag'ler
  for (const f of (currentCard[dir + "_flags_set"] || [])) activeFlags[f] = true;

  // Karakter hafızası güncelle
  const charKey = currentCard.character || currentCard.character_name || "";
  if (charKey) {
    if (!characterMemory[charKey]) characterMemory[charKey] = { left: 0, right: 0, last: null };
    characterMemory[charKey][dir]++;
    characterMemory[charKey].last = dir;
    // character_name ile de kaydet
    const charNameKey = currentCard.character_name || "";
    if (charNameKey && charNameKey !== charKey) {
      if (!characterMemory[charNameKey]) characterMemory[charNameKey] = { left: 0, right: 0, last: null };
      characterMemory[charNameKey][dir]++;
      characterMemory[charNameKey].last = dir;
    }
  }

  applyEffects(currentCard[dir + "_effects"] || {});
  if (isGameOver) return;

  cardsPlayed++;
  if (cardsPlayed % CARDS_PER_YEAR === 0) advanceYear();
  if (!isGameOver) setTimeout(dealNext, 150);
}

// ── Swipe / Drag ──────────────────────────────────────────────────
const THRESHOLD = 100;
let startX = 0, startY = 0, curX = 0, isDragging = false, isAnimating = false;

function onStart(x, y) {
  if (isAnimating || isGameOver) return;
  if (currentCard && currentCard.type === "negotiation") return;
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

// Mouse
card.addEventListener("mousedown",  e => onStart(e.clientX, e.clientY));
window.addEventListener("mousemove", e => { if (isDragging) onMove(e.clientX); });
window.addEventListener("mouseup",   () => onEnd());

// Keyboard
window.addEventListener("keydown", e => {
  if (isAnimating || isGameOver || currentCard === null) return;
  if (currentCard && currentCard.type === "negotiation") return;
  if (e.key === "ArrowLeft")  flyOff("left");
  if (e.key === "ArrowRight") flyOff("right");
});

// Touch
card.addEventListener("touchstart", e => {
  const t = e.touches[0];
  onStart(t.clientX, t.clientY);
}, { passive: true });
window.addEventListener("touchmove", e => {
  if (isDragging) { e.preventDefault(); onMove(e.touches[0].clientX); }
}, { passive: false });
window.addEventListener("touchend",  () => onEnd());

// ── Paylaşım ─────────────────────────────────────────────────────
document.getElementById("share-btn").addEventListener("click", () => {
  const text = `Sadrazam oyununda ${year} yıl ayakta kalabildim! Sen kaç yıl dayanabilirsin? sadrazam-web.vercel.app`;
  if (navigator.share) {
    navigator.share({ title: "Sadrazam", text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("share-btn");
      const orig = btn.textContent;
      btn.textContent = "KOPYALANDI!";
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  }
});

// ── Restart ───────────────────────────────────────────────────────
function restartGame() {
  gameoverScreen.classList.remove("visible");
  gameScreen.classList.add("hidden");
  card.style.opacity = "0";
  currentCard = null;
  selectedSultan = null;
  selectedAdvisors = [];
  hideNegotiationPanel();

  // Intro'ya dön
  introScreen.style.display = "";
}

updateStatUI();
