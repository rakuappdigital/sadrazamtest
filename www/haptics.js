// haptics.js — Sadrazam Haptik Geri Bildirim Sistemi
// Capacitor (iOS/Android native) öncelikli, web fallback ikincil

const Haptics = (() => {
  // Capacitor Haptics API (iOS native — gerçek haptik)
  let _cap = null;
  if (window.Capacitor?.isNativePlatform?.()) {
    try {
      _cap = window.Capacitor.Plugins.Haptics;
    } catch(e) {}
  }

  // iOS native haptik
  const impact = (style) => {
    if (_cap) {
      _cap.impact({ style }).catch(() => {});
    } else {
      try { navigator.vibrate?.(style === 'HEAVY' ? 40 : style === 'MEDIUM' ? 20 : 8); } catch(e) {}
    }
  };
  const notification = (type) => {
    if (_cap) {
      _cap.notification({ type }).catch(() => {});
    } else {
      const p = type === 'SUCCESS' ? [10,15,15] : type === 'ERROR' ? [60,30,80] : [20,10,20];
      try { navigator.vibrate?.(p); } catch(e) {}
    }
  };

  // Web fallback (Android)
  const vib = (pattern) => {
    if (_cap) return; // native kullanıyorsa web'i atlayalım
    try { navigator.vibrate?.(pattern); } catch(e) {}
  };

  return {
    // ── Kart etkileşimleri ──────────────────────────────────────
    cardPickup:            () => impact('LIGHT'),
    swipeNearThreshold:    () => vib([8, 12, 12]),
    swipeThresholdCrossed: () => impact('MEDIUM'),
    swipeRight:            () => impact('LIGHT'),
    swipeLeft:             () => impact('MEDIUM'),
    snapBack:              () => vib(5),

    // ── Stat değişimleri ────────────────────────────────────────
    statPositive:    () => impact('LIGHT'),
    statNegative:    () => impact('MEDIUM'),
    statDanger:      () => notification('WARNING'),

    // ── Oyun olayları ───────────────────────────────────────────
    yearAdvance:     () => { impact('MEDIUM'); },
    letterArrival:   () => vib([5, 50, 10, 50, 5]),
    crisisCard:      () => notification('WARNING'),
    allyActivated:   () => notification('SUCCESS'),
    curseTriggered:  () => notification('ERROR'),
    achievement:     () => notification('SUCCESS'),
    missionComplete: () => impact('MEDIUM'),

    // ── Şans kartı ──────────────────────────────────────────────
    coinSpin:        () => vib([5, 20, 5, 20, 5, 20, 5]),
    chanceWin:       () => notification('SUCCESS'),
    chanceLose:      () => notification('ERROR'),

    // ── Game Over ───────────────────────────────────────────────
    gameOver:        () => { notification('ERROR'); setTimeout(() => impact('HEAVY'), 400); },

    // ── Yardımcı ────────────────────────────────────────────────
    tap:             () => impact('LIGHT'),
  };
})();

// iOS Capacitor entegrasyonu için ileride:
// import { Haptics as CapHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
// cardPickup:   () => CapHaptics.impact({ style: ImpactStyle.Light })
// swipeRight:   () => CapHaptics.notification({ type: NotificationType.Success })
// gameOver:     () => CapHaptics.notification({ type: NotificationType.Error })
// achievement:  () => CapHaptics.notification({ type: NotificationType.Success })
