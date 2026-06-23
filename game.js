// ═══════════════════════════════════════════════════════════════════
//  SADRAZAM — game.js  (v3.0)
// ═══════════════════════════════════════════════════════════════════

const CARDS_PER_YEAR = 10;
const PASSIVE_HAZINE_DRAIN = 5;

// ── Osmanlı Takvimi ───────────────────────────────────────────────
const HICRI_MONTHS = [
  "Muharrem","Safer","Rebiülevvel","Rebiülahir",
  "Cemaziyelevvel","Cemaziyelahir","Recep","Şaban",
  "Ramazan","Şevval","Zilkade","Zilhicce"
];
const SULTAN_HICRI_START = { kanuni: 927, yavuz: 918, murad3: 982 };

// ── Dinamik başlıklar ─────────────────────────────────────────────
const DYNAMIC_SUBTITLES = [
  "Boğaz'da Fırtınanın Başladığı Yıl",
  "Karanlık Koridorların Saltanatı",
  "Divan'ın Susmayı Seçtiği Günler",
  "Topkapı'da Gölgelerin Dansı",
  "Yıldızların Yanlış Hizalandığı Mevsim",
  "Rüzgarın Kıble'den Estiği Yıl",
  "Vezirler Arasındaki Sessiz Savaş",
  "Hazinenin Ağırlaştığı Günler",
  "Dua Ile Kılıcın Aynı Kefede Tutulduğu An",
  "Sarayın Duvarlarının Kulak Kesildiği Yıl",
  "Altın ve Kan Arasındaki Denge",
  "Hilal'in Eksildiği Geceler",
  "Beylerbeyi'nin Unvanının Tartıldığı Devir",
  "Halkın Susmayı Bıraktığı Sezon",
  "Celladın Gölgesinin Uzadığı Günler",
  "Mürekkep ve Kılıcın Yarıştığı Çağ",
  "Sultanın Gözlerinde Okunan Şüphe",
  "Kırmızı Tuğranın Titrediği Sabahlar",
  "Saray Bahçesinde Güller Değil Dikenler",
  "Osmanlı'nın Nefes Tuttuğu An"
];

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

// ── Başarımlar ────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "survivor_5",    label: "⚔️ Beş Yıl Ayakta",     check: (s) => s.year >= 5 },
  { id: "survivor_10",   label: "👑 On Yıl Sadrazam",     check: (s) => s.year >= 10 },
  { id: "survivor_20",   label: "🏛️ Efsane Sadrazam",    check: (s) => s.year >= 20 },
  { id: "balanced",      label: "⚖️ Denge Ustası",        check: (s) => Object.values(s.stats).every(v => v >= 40 && v <= 60) },
  { id: "traitor_found", label: "🕵️ Haini Buldun",       check: (s) => s.traitorInvestigated >= 2 },
  { id: "no_curse",      label: "🌙 Lanet Yok",           check: (s) => !s.cursedEver },
  { id: "pasa_mode",     label: "📜 Paşadan Sadrazama",   check: (s) => s.isPasaMode && s.pasaPromoted },
];

// ── State ─────────────────────────────────────────────────────────
let allCards = [];
let stats = { saray: 50, "yeniçeri": 50, ulema: 50, hazine: 50 };
let year = 1;
let cardsPlayed = 0;
let activeFlags = {};
let isGameOver = false;
let playCounts = {};
let forcedQueue = [];
let scheduledCards = [];
let characterMemory = {};
let activeArcs = {};
let triggeredArcs = {};
let sultanSabir = 50;
let selectedSultan = null;
let selectedAdvisors = [];
let isPasaMode = false;
let pasaPromoted = false;
let currentTitle = "SADRAZAM";

// Yeni özellik state'leri
let isNight = false;
let nightCardCount = 0;
let consecutiveSameDir = 0;
let lastDir = null;
let cursedEver = false;
let hiddenTraitor = null;
let traitorInvestigated = 0;
let traitorRevealed = false;
let factionFavors = { saray: 0, ordu: 0, din: 0, halk: 0 };
let factionPressureSent = { saray: false, ordu: false, din: false, halk: false };
let hicriYear = 927;
let hicriMonth = 0; // 0-11
let deathCharacterKey = null;
let isInvestigating = false;
let originalCardText = "";
let dangerPulseActive = false;
let letterCardsPending = [];
let currentDeathTitle = "SADRAZAMLIK SONA ERDİ";

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

  document.getElementById("btn-sultan-confirm").onclick = () => {
    if (!selectedSultan) { alert("Lütfen bir sultan seçin."); return; }
    sultanScreen.classList.add("hidden");
    showAdvisorScreen();
  };
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
      <div>
        <div class="ac-name">${a.name}</div>
        <div class="ac-title">${a.title}</div>
        <div class="ac-desc">${a.desc}</div>
      </div>
    `;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("selected")) {
        btn.classList.remove("selected");
        selectedAdvisors = selectedAdvisors.filter(x => x.id !== a.id);
      } else {
        if (selectedAdvisors.length >= 2) { alert("En fazla 2 danışman seçebilirsiniz."); return; }
        btn.classList.add("selected");
        selectedAdvisors.push(a);
      }
      document.getElementById("advisor-count").textContent = selectedAdvisors.length + "/2 seçildi";
    });
    grid.appendChild(btn);
  });

  document.getElementById("btn-advisor-confirm").onclick = () => {
    if (selectedAdvisors.length !== 2) { alert("Lütfen tam olarak 2 danışman seçin."); return; }
    advisorScreen.classList.add("hidden");
    startGame();
  };
}

// ── Oyunu Başlat ──────────────────────────────────────────────────
function startGame() {
  stats = { ...selectedSultan.stats };
  sultanSabir = selectedSultan.sultanSabir;

  if (isPasaMode) {
    stats = { saray: 35, "yeniçeri": 35, ulema: 35, hazine: 40 };
    currentTitle = "PAŞA";
    pasaPromoted = false;
  } else {
    currentTitle = "SADRAZAM";
    pasaPromoted = true;
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
  isNight = false;
  nightCardCount = 0;
  consecutiveSameDir = 0;
  lastDir = null;
  cursedEver = false;
  factionFavors = { saray: 0, ordu: 0, din: 0, halk: 0 };
  factionPressureSent = { saray: false, ordu: false, din: false, halk: false };
  traitorInvestigated = 0;
  traitorRevealed = false;
  deathCharacterKey = null;
  isInvestigating = false;
  letterCardsPending = [];
  dangerPulseActive = false;

  // Hicri takvim başlangıcı
  const sultanId = selectedSultan ? selectedSultan.id : "kanuni";
  hicriYear = SULTAN_HICRI_START[sultanId] || 927;
  hicriMonth = 0;

  // Gizli hain seç
  const characterKeys = ["2-yeniceri", "3-Seyhulislam", "4. Defterdar",
    "5. Valide Sultan", "6. Kaptan-ı Derya", "7. Yabancı Elçi",
    "8. Rakip Vezir", "10-hekimbasi", "11-sipahi_agasi",
    "12-saray_sairi", "13-buyuk_tuccar", "14-casuslar_basi",
    "15-halk_temsilcisi", "16-saray_agasi", "22-yahudi_bankaci",
    "24-korsanbasi", "25-deli_dervis", "26-genc_pasa"];
  hiddenTraitor = characterKeys[Math.floor(Math.random() * characterKeys.length)];

  if (titleLabel) titleLabel.textContent = currentTitle;

  // Remove night mode
  gameScreen.classList.remove("night-mode");

  updateYearLabel();
  updateStatUI();
  updateDynamicSubtitle();
  ensureFateBar();

  gameScreen.classList.remove("hidden");
  dealNext();
}

// ── Boot ──────────────────────────────────────────────────────────
fetch("data/cards.json")
  .then(r => r.json())
  .then(data => { allCards = data.cards; });

// ── Osmanlı Takvimi ───────────────────────────────────────────────
function updateYearLabel() {
  if (!yearLabel) return;
  const monthName = HICRI_MONTHS[hicriMonth % 12];
  yearLabel.textContent = `${monthName} ${hicriYear}`;
}

function advanceHicriMonth() {
  hicriMonth++;
  if (hicriMonth >= 12) {
    hicriMonth = 0;
    hicriYear++;
  }
  updateYearLabel();
}

// ── Dinamik Subtitle ──────────────────────────────────────────────
function updateDynamicSubtitle() {
  let subtitle = "";

  if (stats.hazine < 25)      subtitle = "Hazinenin Dibini Gördüğümüz Yıl";
  else if (stats["yeniçeri"] > 75) subtitle = "Orduların Gözde Sadrazamı";
  else if (stats.saray < 25)  subtitle = "Gözden Düştüğümüz Günler";
  else if (stats.ulema > 75)  subtitle = "Dinin Gölgesinde Saltanat";
  else if (stats.hazine > 75) subtitle = "Bereketin Yılı";
  else {
    const idx = (year + cardsPlayed) % DYNAMIC_SUBTITLES.length;
    subtitle = DYNAMIC_SUBTITLES[idx];
  }

  let el = document.getElementById("dynamic-subtitle");
  if (!el) {
    el = document.createElement("div");
    el.id = "dynamic-subtitle";
    const headerRow = document.getElementById("header-row");
    if (headerRow) headerRow.appendChild(el);
  }
  el.textContent = subtitle;
}

// ── Fate Bar (Kader İpleri) ───────────────────────────────────────
function ensureFateBar() {
  if (!document.getElementById("fate-bar")) {
    const fb = document.createElement("div");
    fb.id = "fate-bar";
    const statsBar = document.getElementById("stats-bar");
    if (statsBar && statsBar.parentNode) {
      statsBar.parentNode.insertBefore(fb, statsBar.nextSibling);
    }
  }
  updateFateBar();
}

function updateFateBar() {
  const fb = document.getElementById("fate-bar");
  if (!fb) return;
  fb.innerHTML = "";
  if (!scheduledCards.length) return;

  // Group by cardId
  const groups = {};
  scheduledCards.forEach(sc => {
    const c = allCards.find(x => x.id === sc.cardId);
    const label = c ? (c.character_name || sc.cardId) : sc.cardId;
    if (!groups[label]) groups[label] = 0;
    groups[label]++;
  });

  Object.entries(groups).forEach(([label, count]) => {
    const chip = document.createElement("div");
    chip.className = "fate-thread";
    chip.textContent = `⚔️ ${label.length > 12 ? label.slice(0,12)+'…' : label} (${count})`;
    chip.title = `${count} karta kalmış`;
    fb.appendChild(chip);
  });
}

// ── Deck ──────────────────────────────────────────────────────────
function getEventCards() {
  return allCards.filter(c => c.is_event);
}

function getNextCard() {
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
  updateFateBar();
}

function getEligible() {
  return allCards.filter(c => {
    if (c.is_pasa_terfi && (!isPasaMode || pasaPromoted)) return false;
    if (c.is_event) return false;
    if (c.arc_id) return false;
    if (c.is_traitor_reveal) return false;
    if (c.type === "letter") return false;
    // Faction baskı kartları sadece tetiklenince
    if (c.required_faction_pressure && !activeFlags["faction_pressure_" + c.required_faction_pressure]) return false;
    // weight:1 özel kartlar arc dışında çıkmasın
    if (c.weight === 1 && !c.arc_id) return false;
    // Gece kartları gece önceliği (ama hepsi karışabilir)
    if (c.time === "night" && !isNight) return false;
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

  // Gece modu toggle (her 3 kartta)
  nightCardCount++;
  if (nightCardCount % 3 === 0) {
    isNight = !isNight;
    if (isNight) {
      gameScreen.classList.add("night-mode");
    } else {
      gameScreen.classList.remove("night-mode");
    }
  }

  const c = getNextCard();
  if (!c) return;
  currentCard = c;
  isInvestigating = false;

  // Müzakere kartı
  if (c.type === "negotiation") {
    showNegotiationCard(c);
    return;
  }

  // Mektup kartı
  if (c.type === "letter") {
    showLetterCard(c);
    return;
  }

  hideNegotiationPanel();

  const key = c.character || "";
  deathCharacterKey = key;

  const imgName = key + ".jpg";
  cardImage.src = "assets/characters/" + encodeURIComponent(imgName);
  cardImage.onerror = () => { cardImage.src = ""; };

  // Gizli hain hint
  let displayText = c.text || "";
  if (key === hiddenTraitor && !traitorRevealed) {
    const mem = characterMemory[key] || {};
    const totalMem = (mem.left || 0) + (mem.right || 0);
    if (totalMem > 0 && totalMem % 7 === 0) {
      displayText += " — gözleri anlık bir şeye takıldı.";
    }
  }

  charName.textContent = c.character_name || "";
  cardText.textContent = displayText;
  choiceLeft.textContent  = c.left_text  || "Hayır";
  choiceRight.textContent = c.right_text || "Evet";

  choiceLeft.style.opacity  = "0";
  choiceRight.style.opacity = "0";
  overlayL.style.opacity = "0";
  overlayR.style.opacity = "0";

  // Mektup stili kaldır
  card.classList.remove("letter-card");

  // Soruşturma butonu
  setupInvestigateBtn(c, displayText);

  // Ses
  if (isNight || c.time === "night") {
    if (window.playNightCard) playNightCard();
  } else {
    if (window.playCardDraw) playCardDraw();
  }
  if (c.sound === "veba" && window.playEvent_veba) playEvent_veba();
  if (c.sound === "savas" && window.playEvent_savas) playEvent_savas();
  if (c.sound === "hasat" && window.playEvent_hasat) playEvent_hasat();
  if (c.character === "14-casuslar_basi" && c.text && c.text.includes("mektup") && window.playLetterArrival) playLetterArrival();

  animateCardIn();
  updateDynamicSubtitle();
}

function setupInvestigateBtn(c, displayText) {
  let btn = document.getElementById("investigate-btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "investigate-btn";
    btn.textContent = "🔍";
    btn.title = "Soruştur";
    card.appendChild(btn);
  }

  if (c.investigate_text) {
    btn.classList.remove("hidden");
    btn.onclick = () => {
      if (isInvestigating) {
        // Geri dön
        cardText.textContent = displayText;
        btn.textContent = "🔍";
        isInvestigating = false;
      } else {
        // Soruştur
        cardText.textContent = c.investigate_text;
        btn.textContent = "↩";
        isInvestigating = true;
        // Traitor sayacı
        if (c.character === hiddenTraitor || c.character_name === hiddenTraitor) {
          traitorInvestigated++;
        }
      }
    };
  } else {
    btn.classList.add("hidden");
  }
}

function animateCardIn() {
  card.style.transform = "translateY(40px)";
  card.style.opacity = "0";
  card.style.transition = "transform 0.4s ease, opacity 0.3s ease";
  card.style.pointerEvents = "auto";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transform = "translateY(0) rotate(0deg)";
    card.style.opacity = "1";
  }));
}

// ── Mektup Kartı ─────────────────────────────────────────────────
function showLetterCard(c) {
  hideNegotiationPanel();

  const key = c.character || "";
  cardImage.src = "assets/characters/" + encodeURIComponent(key + ".jpg");
  cardImage.onerror = () => { cardImage.src = ""; };

  charName.textContent = c.character_name || "Sultan";
  cardText.textContent = c.text || "";
  choiceLeft.textContent  = "";
  choiceRight.textContent = "Devam →";
  choiceLeft.style.opacity  = "0";
  choiceRight.style.opacity = "0.8";
  overlayL.style.opacity = "0";
  overlayR.style.opacity = "0";

  card.classList.add("letter-card");

  const btn = document.getElementById("investigate-btn");
  if (btn) btn.classList.add("hidden");

  if (window.playLetterArrival) playLetterArrival();

  animateCardIn();
  card.style.pointerEvents = "none";

  // Devam butonu
  let devamBtn = document.getElementById("letter-devam-btn");
  if (!devamBtn) {
    devamBtn = document.createElement("button");
    devamBtn.id = "letter-devam-btn";
    devamBtn.className = "intro-btn";
    devamBtn.style.cssText = "margin-top: 8px; font-size: 11px; padding: 10px 20px; max-width: 200px;";
    devamBtn.textContent = "DEVAM";
    const cardBottom = document.getElementById("card-bottom");
    if (cardBottom) cardBottom.appendChild(devamBtn);
  }
  devamBtn.style.display = "block";
  devamBtn.onclick = () => {
    devamBtn.style.display = "none";
    card.classList.remove("letter-card");
    card.style.pointerEvents = "auto";

    // Sultan sabir etkisi
    if (c.right_effects && c.right_effects.sultanSabir) {
      sultanSabir = Math.min(100, Math.max(0, sultanSabir + c.right_effects.sultanSabir));
    }
    for (const f of (c.right_flags_set || [])) activeFlags[f] = true;

    cardsPlayed++;
    if (cardsPlayed % CARDS_PER_YEAR === 0) advanceYear();
    if (!isGameOver) setTimeout(dealNext, 150);
  };
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

  card.classList.remove("letter-card");
  const btn = document.getElementById("investigate-btn");
  if (btn) btn.classList.add("hidden");

  animateCardIn();
  card.style.pointerEvents = "none";

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

  // Hide devam button if visible
  const devamBtn = document.getElementById("letter-devam-btn");
  if (devamBtn) devamBtn.style.display = "none";
}

function hideNegotiationPanel() {
  if (negotiationPanel) negotiationPanel.classList.add("hidden");
  if (cardChoices) cardChoices.style.display = "";
  const devamBtn = document.getElementById("letter-devam-btn");
  if (devamBtn) devamBtn.style.display = "none";
}

// ── Stats ─────────────────────────────────────────────────────────
function updateStatUI() {
  const map = { saray: "saray", "yeniçeri": "yeniceri", ulema: "ulema", hazine: "hazine" };
  let anyDanger = false;
  for (const [key, id] of Object.entries(map)) {
    const val = stats[key];
    const fill = document.getElementById("fill-" + id);
    if (!fill) continue;
    fill.style.width = val + "%";
    fill.className = "stat-fill" + (val <= 20 || val >= 80 ? " danger" : val <= 35 || val >= 65 ? " warn" : "");
    if (val <= 20 || val >= 80) anyDanger = true;
  }

  // Danger pulse
  if (anyDanger && !dangerPulseActive) {
    dangerPulseActive = true;
    if (window.startDangerPulse) startDangerPulse();
  } else if (!anyDanger && dangerPulseActive) {
    dangerPulseActive = false;
    if (window.stopDangerPulse) stopDangerPulse();
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
    // sultanSabir özel işlem
    if (stat === "sultanSabir") {
      let sc = raw;
      if (hasAdvisor("semsi")) sc = Math.round(sc * 0.5);
      sultanSabir = Math.min(100, Math.max(0, sultanSabir + sc));
      continue;
    }

    if (hasAdvisor("sokollu")) raw = Math.round(raw * 0.85);
    if (hasAdvisor("sinan") && (stat === "saray" || stat === "ulema")) raw = Math.round(raw * 1.2);
    if (hasAdvisor("hurrem") && stat === "yeniçeri" && raw < 0) raw = Math.round(raw * 0.75);

    const amp = amplify(stat, raw);
    stats[stat] = Math.min(100, Math.max(0, (stats[stat] ?? 50) + amp));

    if (stat === "saray") {
      let sabirChange = raw < 0 ? -3 : 2;
      if (hasAdvisor("semsi")) sabirChange = Math.round(sabirChange * 0.5);
      sultanSabir = Math.min(100, Math.max(0, sultanSabir + sabirChange));
    }
  }
  updateStatUI();
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

// ── Lanet Sistemi ─────────────────────────────────────────────────
function checkCurse(dir) {
  if (lastDir === dir) {
    consecutiveSameDir++;
    if (consecutiveSameDir >= 3) {
      consecutiveSameDir = 0;
      triggerCurse();
    }
  } else {
    consecutiveSameDir = 1;
  }
  lastDir = dir;
}

function triggerCurse() {
  cursedEver = true;
  // Lanet overlay
  let overlay = document.getElementById("curse-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "curse-overlay";
    const ct = document.createElement("div");
    ct.className = "curse-text";
    ct.textContent = "DENGE BOZULDU";
    overlay.appendChild(ct);
    document.body.appendChild(overlay);
  }
  overlay.classList.remove("hidden");
  // Tüm statlara -5
  Object.keys(stats).forEach(s => {
    stats[s] = Math.max(0, stats[s] - 5);
  });
  updateStatUI();
  setTimeout(() => overlay.classList.add("hidden"), 1500);
}

// ── Karar ─────────────────────────────────────────────────────────
function decide(dir) {
  if (!currentCard) return;

  // İnvestigating state temizle - sultanSabir cezası
  if (isInvestigating) {
    let sabirPenalty = -3;
    if (hasAdvisor("semsi")) sabirPenalty = Math.round(sabirPenalty * 0.5);
    sultanSabir = Math.min(100, Math.max(0, sultanSabir + sabirPenalty));
    isInvestigating = false;
  }

  // Paşa terfi
  if (currentCard.is_pasa_terfi) {
    pasaPromoted = true;
    currentTitle = "SADRAZAM";
    if (titleLabel) titleLabel.textContent = currentTitle;
  }

  // Lanet kontrolü
  checkCurse(dir);

  // Zincirleme kartlar
  const triggerKey = "triggers_on_" + dir;
  if (currentCard[triggerKey]) {
    const delay = currentCard.trigger_delay ?? 3;
    scheduledCards.push({
      cardId: currentCard[triggerKey],
      afterCardsPlayed: cardsPlayed + delay
    });
    updateFateBar();
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

  // Karakter hafızası
  const charKey = currentCard.character || "";
  const charNameKey = currentCard.character_name || "";
  [charKey, charNameKey].filter(Boolean).forEach(k => {
    if (!characterMemory[k]) characterMemory[k] = { left: 0, right: 0, last: null };
    characterMemory[k][dir]++;
    characterMemory[k].last = dir;
  });

  // Faction favor
  const faction = currentCard.faction;
  if (faction) {
    if (dir === "right") {
      factionFavors[faction] = (factionFavors[faction] || 0) + 1;
      checkFactionPressure(faction);
    }
  }

  applyEffects(currentCard[dir + "_effects"] || {});
  if (isGameOver) return;

  // Ses
  if (dir === "right" && window.playSwipeRight) playSwipeRight();
  if (dir === "left"  && window.playSwipeLeft)  playSwipeLeft();

  cardsPlayed++;
  advanceHicriMonth();

  if (cardsPlayed % CARDS_PER_YEAR === 0) advanceYear();
  if (!isGameOver) setTimeout(dealNext, 150);

  // Hain açıklama kontrolü (yıl 6 = 60 kart)
  if (cardsPlayed >= 60 && !traitorRevealed) {
    traitorRevealed = true;
    const revCard = allCards.find(c => c.is_traitor_reveal);
    if (revCard) {
      const enriched = { ...revCard };
      if (window.playTraitorReveal) playTraitorReveal();
      if (traitorInvestigated >= 2) {
        enriched.text = `Paşam, yıllardır aramızda bir hain vardı: ${getCharacterDisplayName(hiddenTraitor)}. Ama siz bunu zaten fark etmişsiniz! Sultan'a rapor hazırlandı. Sarayınız güçlendi.`;
        enriched.right_effects = { saray: 10 };
      } else {
        enriched.text = `Paşam, çok geç! ${getCharacterDisplayName(hiddenTraitor)} bu gece sizi Sultan'a şikâyet etti. Belgeler sahte ama Sultan inanıyor...`;
        enriched.right_effects = { saray: -15 };
      }
      forcedQueue.unshift(enriched);
    }
  }
}

function getCharacterDisplayName(key) {
  if (!key) return "Bilinmeyen";
  const c = allCards.find(x => x.character === key);
  return c ? (c.character_name || key) : key;
}

// ── Faction Pressure ──────────────────────────────────────────────
const FACTION_RIVALS = { saray: "halk", halk: "saray", ordu: "din", din: "ordu" };

function checkFactionPressure(faction) {
  const count = factionFavors[faction] || 0;
  if (count >= 5) {
    const rival = FACTION_RIVALS[faction];
    if (rival && !factionPressureSent[rival]) {
      factionPressureSent[rival] = true;
      activeFlags["faction_pressure_" + rival] = true;
      // Baskı kartını kuyruğa ekle
      const pressureCard = allCards.find(c => c.required_faction_pressure === rival);
      if (pressureCard) {
        scheduledCards.push({
          cardId: pressureCard.id,
          afterCardsPlayed: cardsPlayed + 2
        });
        updateFateBar();
      }
    }
  }
}

// ── Swipe / Drag ──────────────────────────────────────────────────
const THRESHOLD = 100;
let startX = 0, startY = 0, curX = 0, isDragging = false, isAnimating = false;

function onStart(x, y) {
  if (isAnimating || isGameOver) return;
  if (currentCard && (currentCard.type === "negotiation" || currentCard.type === "letter")) return;
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
  if (currentCard && (currentCard.type === "negotiation" || currentCard.type === "letter")) return;
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

// ── Yıl Geçişi ───────────────────────────────────────────────────
function advanceYear() {
  year++;

  if (window.playYearAdvance) playYearAdvance();

  if (hasAdvisor("piri_reis")) {
    stats.hazine = Math.min(100, stats.hazine + 6);
  }

  stats.hazine = Math.max(0, stats.hazine - PASSIVE_HAZINE_DRAIN);
  updateStatUI();
  if (checkGameOver()) return;

  // Paşa terfi (yıl 3)
  if (isPasaMode && !pasaPromoted && year === 3) {
    const terfiCard = allCards.find(c => c.is_pasa_terfi);
    if (terfiCard) forcedQueue.unshift(terfiCard);
  }

  // Sultan mektubu (%30 ihtimal)
  if (Math.random() < 0.30) {
    const letterCards = allCards.filter(c => c.type === "letter" && !activeFlags["sultan_mektup_" + c.id + "_okundu"]);
    if (letterCards.length > 0) {
      const lc = letterCards[Math.floor(Math.random() * letterCards.length)];
      forcedQueue.push(lc);
    }
  }

  // Yıllık event kartı
  const eventCards = getEventCards();
  if (eventCards.length > 0) {
    const ev = eventCards[Math.floor(Math.random() * eventCards.length)];
    forcedQueue.push(ev);
    // Event ses
    if (ev.sound === "veba" && window.playEvent_veba) playEvent_veba();
    if (ev.sound === "savas" && window.playEvent_savas) playEvent_savas();
    if (ev.sound === "hasat" && window.playEvent_hasat) playEvent_hasat();
  }

  updateDynamicSubtitle();
}

// ── Game Over ─────────────────────────────────────────────────────
function triggerGameOver(reason) {
  if (isGameOver) return;
  isGameOver = true;

  // Durdur
  if (window.stopDangerPulse) stopDangerPulse();

  // Sinematik ölüm
  if (window.playCinematicDeath) playCinematicDeath();

  const cinematicEl = document.getElementById("cinematic-death");
  const deathImg    = document.getElementById("death-char-img");

  if (cinematicEl && deathCharacterKey) {
    deathImg.src = "assets/characters/" + encodeURIComponent(deathCharacterKey + ".jpg");
    deathImg.onerror = () => { deathImg.src = ""; };
    cinematicEl.classList.remove("hidden");
    setTimeout(() => {
      deathImg.style.transition = "opacity 1.5s ease";
      deathImg.style.opacity = "0";
    }, 600);
    setTimeout(() => {
      cinematicEl.classList.add("hidden");
      deathImg.style.opacity = "";
      deathImg.style.transition = "";
      showGameOver(reason);
    }, 2200);
  } else {
    setTimeout(() => showGameOver(reason), 600);
  }
}

function showGameOver(reason) {
  if (window.playGameOver) playGameOver();

  saveHighScore();
  saveDeathArchive(reason);

  const newAchievements = checkAchievements();
  if (newAchievements.length > 0) {
    newAchievements.forEach((a, i) => {
      setTimeout(() => showAchievementToast(a), 500 + i * 3200);
    });
  }

  const best = parseInt(localStorage.getItem("sadrazam_best_year") || "0");
  const isNewRecord = year >= best;

  // Dinamik başlık
  currentDeathTitle = getDynamicDeathTitle(reason);
  document.getElementById("gameover-title").textContent = currentDeathTitle;

  gameoverReason.textContent = reason;

  let yearText = `${year} yıl, ${HICRI_MONTHS[hicriMonth % 12]} ${hicriYear}`;
  document.getElementById("gameover-year").textContent = yearText;

  // Yeni rekor banner
  let recBanner = document.getElementById("new-record-banner");
  if (!recBanner) {
    recBanner = document.createElement("div");
    recBanner.id = "new-record-banner";
    const divider = document.getElementById("gameover-divider");
    if (divider) divider.parentNode.insertBefore(recBanner, divider.nextSibling);
  }
  if (isNewRecord) {
    recBanner.textContent = "🏆 YENİ REKOR!";
    recBanner.style.display = "block";
  } else {
    recBanner.style.display = "none";
    const oldBest = document.getElementById("gameover-year");
    if (oldBest) oldBest.textContent += ` · Rekor: ${best} yıl`;
  }

  // Achievement badge'ler
  renderAchievementBadges();

  // Ölüm arşivi
  renderDeathArchive();

  gameoverScreen.classList.add("visible");
}

function getDynamicDeathTitle(reason) {
  if (reason.includes("idam")) return "İDAM FERMANI GELDİ";
  if (reason.includes("cellat")) return "GECE YARISI SONU";
  if (reason.includes("isyan") || reason.includes("Yeniçeri")) return "TAHT DEVRILDI";
  if (reason.includes("linç") || reason.includes("dinsizlik")) return "HALK AYAKTA";
  if (reason.includes("düşman") || reason.includes("surlarına")) return "İSTANBUL DÜŞTÜ";
  if (reason.includes("iflas")) return "HAZİNE BOŞALDI";
  if (reason.includes("zimmet")) return "SUÇLAMA GELDİ";
  if (reason.includes("ihanet") || reason.includes("şikâyet")) return "İHANET AÇIĞA ÇIKTI";
  if (reason.includes("sürgün") || reason.includes("azletti")) return "AZIL FERMANI";
  return "SADRAZAMLIK SONA ERDİ";
}

// ── Başarımlar ────────────────────────────────────────────────────
function checkAchievements() {
  const state = { year, stats, traitorInvestigated, cursedEver, isPasaMode, pasaPromoted };
  const saved = JSON.parse(localStorage.getItem("sadrazam_achievements") || "[]");
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(a => {
    if (!saved.includes(a.id) && a.check(state)) {
      saved.push(a.id);
      newlyUnlocked.push(a);
    }
  });

  localStorage.setItem("sadrazam_achievements", JSON.stringify(saved));
  return newlyUnlocked;
}

function showAchievementToast(achievement) {
  const toast = document.createElement("div");
  toast.className = "achievement-toast";
  toast.textContent = `${achievement.label} kazanıldı!`;
  document.body.appendChild(toast);
  if (window.playAchievement) playAchievement();
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function renderAchievementBadges() {
  const saved = JSON.parse(localStorage.getItem("sadrazam_achievements") || "[]");
  if (!saved.length) return;

  let section = document.getElementById("achievements-section");
  if (!section) {
    section = document.createElement("div");
    section.id = "achievements-section";
    const panel = document.getElementById("gameover-panel");
    if (panel) {
      const restartBtn = document.getElementById("restart-btn");
      panel.insertBefore(section, restartBtn);
    }
  }
  section.innerHTML = "";

  const title = document.createElement("div");
  title.style.cssText = "font-family:'Cinzel',serif;font-size:10px;color:rgba(201,162,39,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;text-align:center;";
  title.textContent = "KAZANILAN BAŞARIMLAR";
  section.appendChild(title);

  const badgesDiv = document.createElement("div");
  badgesDiv.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;justify-content:center;";
  saved.forEach(id => {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) {
      const badge = document.createElement("div");
      badge.className = "achievement-badge";
      badge.textContent = a.label;
      badgesDiv.appendChild(badge);
    }
  });
  section.appendChild(badgesDiv);
}

// ── Ölüm Arşivi ───────────────────────────────────────────────────
function saveDeathArchive(reason) {
  const archive = JSON.parse(localStorage.getItem("sadrazam_deaths") || "[]");
  archive.unshift({
    year,
    reason: reason.slice(0, 80),
    sultan: selectedSultan ? selectedSultan.name : "—",
    advisors: selectedAdvisors.map(a => a.name).join(", "),
    date: new Date().toLocaleDateString("tr")
  });
  // Max 10
  if (archive.length > 10) archive.pop();
  localStorage.setItem("sadrazam_deaths", JSON.stringify(archive));
}

function renderDeathArchive() {
  const archive = JSON.parse(localStorage.getItem("sadrazam_deaths") || "[]").slice(1, 4); // son 3 (1 = şimdiki)
  if (!archive.length) return;

  let section = document.getElementById("death-archive-section");
  if (!section) {
    section = document.createElement("div");
    section.id = "death-archive-section";
    const panel = document.getElementById("gameover-panel");
    if (panel) {
      const restartBtn = document.getElementById("restart-btn");
      panel.insertBefore(section, restartBtn);
    }
  }
  section.innerHTML = `<div class="death-archive-title">GEÇMİŞ ÖLÜMLER</div>`;

  archive.forEach(d => {
    const entry = document.createElement("div");
    entry.className = "death-entry";
    entry.innerHTML = `<strong>${d.sultan}</strong> · ${d.year} yıl · ${d.date}<br><span>${d.reason}</span>`;
    section.appendChild(entry);
  });
}

function saveHighScore() {
  const best = parseInt(localStorage.getItem("sadrazam_best_year") || "0");
  if (year > best) {
    localStorage.setItem("sadrazam_best_year", String(year));
  }
}

// ── Paylaşım ─────────────────────────────────────────────────────
document.getElementById("share-btn").addEventListener("click", () => {
  const sultanName = selectedSultan ? selectedSultan.name : "Sultan";
  const text = `Sadrazam'da ${sultanName} döneminde ${year} yıl ayakta kalabildim! 🗡️ Sen kaç yıl dayanabilirsin? sadrazam-web.vercel.app`;
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
  gameScreen.classList.remove("night-mode");
  card.style.opacity = "0";
  currentCard = null;
  selectedSultan = null;
  selectedAdvisors = [];
  hideNegotiationPanel();

  // Clean up extra elements
  ["new-record-banner","death-archive-section","achievements-section"].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.parentNode) { /* keep for next round */ }
  });

  const cinematicEl = document.getElementById("cinematic-death");
  if (cinematicEl) cinematicEl.classList.add("hidden");

  introScreen.style.display = "";
}

// ── Init ──────────────────────────────────────────────────────────
updateStatUI();
