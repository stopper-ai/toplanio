# Toplanio Mobil · Faz 1

React Native + Expo ile iOS, Android ve web için ilk uygulama kodu. Pazarlama sitesinden bağımsızdır.

## Çalıştırma

Node 24 kullanın. `npm ci` ardından `npm start` çalıştırın. Web için `npm run web`.

## Bu sürümde

- Inter ve Plus Jakarta Sans; turuncu ve #0021F2 mavi.
- Açılış, örnek topluluk keşfi, arama/filtre, yerel profil.
- 30 topluluk türü; isim, logo, renk, açıklama, adres ve önizleme ile üç adımlı oluşturma.
- Cihazda kalıcı taslak ve topluluk kayıtları.
- Supabase bağlandığında e-posta/parola kaydı, doğrulama, giriş, oturum, hesaba topluluk kaydetme ve logo yükleme.
- SQL migration dosyaları.

## Sunucuyu bağlama

1. Supabase projesinde `supabase/migrations` altındaki SQL dosyalarını sırasıyla uygulayın.
2. `.env` içinde proje URL'si ve publishable/anon anahtarını belirtin.
3. Auth ayarlarında e-posta doğrulamasını açık tutun.
4. İki farklı test hesabıyla sahiplik ve RLS kontrollerini doğrulayın.

Service role anahtarını uygulamaya koymayın.
