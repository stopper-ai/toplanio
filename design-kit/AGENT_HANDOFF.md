# Diğer ajana devir

Hedef: https://toplanio-mobile-preview.serdarsenel.chatgpt.site/?view=dashboard

Mevcut Site kaynağını açın. Dashboard.tsx, dashboardTheme.ts, DashboardIcon.tsx ve MemberAvatar.tsx değişiklikleri uygulanmıştır. Expo/React yapısını ve mevcut API işlevlerini koruyun. Dashboard yeniden düzenlendi; 25 yeni fallback avatar ortak MemberAvatar bileşenine bağlandı. Fotoğraflı profiller gerçek fotoğrafı kullanır. Avatar seçici/veritabanı alanı eklenmedi.

## Tasarım otoritesi
- Marka: #FF4D00 turuncu, #0021F2 mavi, #061B2E lacivert. Pantone karşılığı uydurmayın.
- Inter 400/500 gövde; Plus Jakarta Sans 700/800 başlık.
- Gerçek dashboard stil katmanı styles/dashboardTheme.ts. Genel CSS kataloğu yardımcı örnektir.
- Piksel avatar: hayvan, robot, fantastik varlık. İnsan portresi yok.
- Mevcut logo assets/logo-original.webp; resmi SVG master iddiası yok.

## Doğrulama
TypeScript ve üretim derlemesi yayın öncesi çalıştırılır. Tarayıcı görsel kontrolü bu ortamda yapılmadı. Paket QA dosyaları font/ikon/PNG kontrollerini içerir; tam WCAG uygunluk iddiası değildir. Manueldeki klavye, responsive, modal odak ve rol senaryolarını gerçek tarayıcıda tamamlayın.

## Sonraki iş
Önce güncel kaynak ile bu dosyaların farkını kontrol edin. Avatar dizisini yeniden sıralamayın. API yanıtında olmayan büyüme, ciro, bildirim veya okundu verisi üretmeyin. Referans dört ekranı mevcut backend'in otomatik vaatleri saymayın. Aynı Site projesine, mevcut erişimi koruyarak yayınlayın.

Eşzamanlı mobil görünüm güncellemesi birleştirildi. scripts/prepare-web.mjs ve ConnectedApp.tsx üzerindeki diğer ajanın değişiklikleri korundu. Hatalı, kendisine işaret eden node_modules symlink kaydı kaynak kontrolünden çıkarıldı; bağımlılıklar lockfile ile yeniden kuruldu.
