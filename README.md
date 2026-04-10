# Yoksis: QR Kod Tabanlı Yoklama Sistemi

Yoksis, etkinlik, ders veya toplantı gibi toplu katılımlı ortamlarda yoklama sürecini kolaylaştırmak için geliştirilmiş bir sistemdir. Dinamik QR kod üretimi ve konum doğrulama özellikleri sayesinde yoklama sürecinin güvenli ve hızlı bir şekilde tamamlanmasını sağlar.

## Temel Özellikler

### Güvenlik ve Doğrulama
Sistemde üretilen QR kodlar her 60 saniyede bir otomatik olarak yenilenir. Bu sayede katılımcıların ekran görüntüsü alıp başkasıyla paylaşması veya eski kodları kullanması engellenir. Ayrıca, etkinlik yöneticisi isterse konum doğrulaması özelliğini aktif edebilir. Bu durumda katılımcılar ancak belirlenen koordinatların ve yarıçapın içindelerse yoklama verebilirler.

### Yönetici Paneli
Yöneticiler için hazırlanan panel üzerinde şu işlemler yapılabilir:
- Etkinlik oluşturma, düzenleme ve silme.
- Katılımcı listesini Excel (CSV) veya Google Sheets üzerinden toplu olarak içe aktarma.
- Manuel olarak katılımcı ekleme veya yoklama durumunu değiştirme.
- Yoklama listesini canlı olarak takip etme.
- Sonuçları Excel formatında dışa aktarma.

### Katılımcı Paneli
Katılımcılar QR kodu okuttuktan sonra kendi bilgilerini girerek check-in yapabilirler. Ayrıca kendi önceki katılım kayıtlarını görebilecekleri basit bir arayüze sahiptirler.

## Teknik Altyapı

- Framework: Next.js (App Router yapısı)
- Dil: TypeScript
- Tasarım: Tailwind CSS
- Veritabanı: Neon Postgres ve Drizzle ORM
- Kimlik Doğrulama: JWT tabanlı, HTTP-Only cookie yönetimi

## Kurulum Adımları

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Ortam değişkenlerini (.env.local) ayarlayın:
   - DATABASE_URL: Postgres bağlantı adresi.
   - JWT_SECRET: Şifreleme anahtarı.
   - NEXT_PUBLIC_APP_URL: Uygulamanın yayındaki URL adresi.

3. Veritabanı tablolarını hazırlayın:
   ```bash
   npm run db:push
   ```

4. İlk admin kullanıcısını oluşturun:
   ```bash
   npm run seed
   ```
   (Varsayılan bilgiler: admin@yoklama.com / admin1234)

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Proje Yapısı

Uygulama Next.js'in modern klasör yapısını kullanır:
- app/(admin): Yönetici ekranları ve dashboard.
- app/(participant): Katılımcıların kendi kayıtlarını gördüğü panel.
- app/attend/[token]: QR kod okutma sayfası.
- lib: QR üretimi ve konum hesaplama gibi yardımcı fonksiyonlar.
- db: Veritabanı şemaları.

## Güvenlik Notu

Tüm admin ve kullanıcı paneli sayfaları sunucu tarafında JWT ile korunmaktadır. QR kod doğrulama işlemi tamamen sunucu tarafında yapılır, istemci tarafında herhangi bir hassas veri bırakılmaz.
