# Sadrazamtest Geliştirme Kuralları

## 1. Çalışanı Bozma
- Yeni özellik eklerken mevcut özellikleri bozma
- Emin değilsen önce test et, sonra uygula
- CSS/JS değişikliklerinde, mevcut çalışan kısımlara **!important**, override veya global kural ekleme

## 2. Yedek Al
- Karmaşık değişikliklerden önce: `git commit` ile mevcut durumu kaydet
- Yedek commit mesajı: `backup: [açıklama] — geri dönülebilir`
- Sorun çözülemezse "yedege dön" dediğinde o commit'e döneceğim

## 3. Uyarı Ver
- Karmaşık işlemlerde başlamadan önce: **"Bu değişiklik X'i etkileyebilir, devam edeyim mi?"** diye sor
- Birden fazla dosyayı aynı anda etkileyen değişikliklerde uyar
- CSS cascade, z-index, position değişikliklerinde özellikle dikkat et

## 4. CSS Kuralları (öğrenilen hatalar)
- `#game { position: fixed }` — **ASLA değiştirme**, kart swipe bunu kullanıyor
- Yeni element eklerken `position: absolute` + `pointer-events: none` (interaktif değilse)
- Aynı selector için birden fazla CSS kuralı oluşturma — cascade karışır
- Base CSS'e (!important ile) override ekleme

## 5. Test Sırası
1. Syntax kontrolü: `node --check game.js`
2. Mevcut özellikler çalışıyor mu? (kart swipe, menü, oyun akışı)
3. Yeni özellik çalışıyor mu?
4. Deploy et
