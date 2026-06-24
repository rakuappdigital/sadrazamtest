// haptics.js — Sadrazam Haptik Geri Bildirim Sistemi
// Web: navigator.vibrate() (Android Chrome/Firefox)
// iOS: Capacitor @capacitor/haptics ile değiştirilecek

const Haptics = (() => {
  const vib = (pattern) => {
    try { navigator.vibrate?.(pattern); } catch(e) {}
  };

  return {
    // ── Kart etkileşimleri ──────────────────────────────────────
    // Kart tutuldu (drag başladı) — çok hafif dokunuş
    cardPickup:      () => vib(6),

    // Eşiğe yaklaşıldı (karar almak üzere) — çift hafif nabız
    swipeNearThreshold: () => vib([8, 12, 12]),

    // Eşik aşıldı, karar verildi — hissedilir tık
    swipeThresholdCrossed: () => vib([18, 10, 18]),

    // Sağa swipe (Evet / olumlu) — hafif çift nabız
    swipeRight:      () => vib([14, 20, 22]),

    // Sola swipe (Hayır / olumsuz) — tek orta nabız
    swipeLeft:       () => vib(28),

    // Geri döndü (snap back) — çok hafif
    snapBack:        () => vib(5),

    // ── Stat değişimleri ────────────────────────────────────────
    // Stat arttı (+) — hafif üçlü
    statPositive:    () => vib([8, 12, 8, 12, 8]),

    // Stat düştü (-) — tek sert darbe
    statNegative:    () => vib(35),

    // Stat tehlike bölgesinde (<20 veya >80) — kalp atışı
    statDanger:      () => vib([55, 180, 55]),

    // ── Oyun olayları ───────────────────────────────────────────
    // Yıl geçişi — ritimli üçlü
    yearAdvance:     () => vib([18, 12, 18, 12, 30]),

    // Sultan mektubu — yumuşak sarsilma
    letterArrival:   () => vib([5, 50, 10, 50, 5]),

    // Kriz kartı geldi — uyarı titreşimi
    crisisCard:      () => vib([80, 40, 80, 40, 100]),

    // Müttefik yardımı geldi — olumlu ritim
    allyActivated:   () => vib([20, 15, 25, 15, 35]),

    // Lanet tetiklendi — sert titreşim
    curseTriggered:  () => vib([60, 30, 100]),

    // Başarım kazanıldı — kutlama ritmi
    achievement:     () => vib([20, 15, 20, 15, 20, 15, 50]),

    // Görev tamamlandı (gizli) — hafif çift nabız
    missionComplete: () => vib([15, 25, 25]),

    // ── Şans kartı ──────────────────────────────────────────────
    // Sikke dönüyor — titreşen beklenti
    coinSpin:        () => vib([5, 20, 5, 20, 5, 20, 5]),

    // Şans kazandı — kutlama
    chanceWin:       () => vib([15, 20, 25, 15, 40]),

    // Şans kaybetti — hayal kırıklığı
    chanceLose:      () => vib([70, 40, 90]),

    // ── Game Over ───────────────────────────────────────────────
    // Ölüm — dramatik uzun titreşim
    gameOver:        () => vib([100, 60, 80, 60, 150]),

    // ── Yardımcı ────────────────────────────────────────────────
    // Dokunmatik etkileşim (buton tap gibi)
    tap:             () => vib(8),
  };
})();

// iOS Capacitor entegrasyonu için ileride:
// import { Haptics as CapHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
// cardPickup:   () => CapHaptics.impact({ style: ImpactStyle.Light })
// swipeRight:   () => CapHaptics.notification({ type: NotificationType.Success })
// gameOver:     () => CapHaptics.notification({ type: NotificationType.Error })
// achievement:  () => CapHaptics.notification({ type: NotificationType.Success })
