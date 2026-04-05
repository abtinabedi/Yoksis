# QR Kod ile Yoklama ve Katılım Sistemi

Etkinlik, ders veya konferans gibi ortamlarda katılımcı yoklamasının QR kod üzerinden alınmasını sağlayan web tabanlı bir uygulamadır. Sistem iki taraflı çalışmaktadır: yönetici arayüzü ve katılımcı akışı.

---

## Kullanılan Teknolojiler

**Frontend ve Backend**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4

**Veritabanı**
- Neon (PostgreSQL)
- Drizzle ORM

**Güvenlik ve Kimlik Doğrulama**
- JWT (jose kütüphanesi)
- bcryptjs (şifre hash'leme)

**QR Kod**
- qrcode (sunucu taraflı QR üretimi)
- html5-qrcode (kamera ile QR okuma, istemci taraflı)

**Diğer**
- papaparse (CSV parse)
- xlsx / SheetJS (Excel export)

**Deployment**
- Vercel

---

## Özellikler

**Yönetici Tarafı**

Yönetici, sisteme e-posta ve şifresiyle giriş yapar. Giriş başarılıysa 7 gün geçerli bir oturum açılır ve kullanıcı yönetici paneline yönlendirilir.

Etkinlik oluşturma ekranında etkinlik adı, açıklama, başlangıç ve bitiş saati girilir. İsteğe bağlı olarak etkinliğin GPS koordinatları ve konum doğrulama yarıçapı tanımlanabilir. Etkinlik oluşturulduğunda arka planda rastgele bir QR gizli anahtarı üretilir.

Etkinlik detay ekranında yönetici, o etkinliğe ait QR kodu görüntüler. QR kod her 60 saniyede otomatik olarak değişir; bunun için sunucu taraflı HMAC-SHA256 tabanlı bir token sistemi kullanılmaktadır. Ekranda geri sayım çubuğu ile kaç saniye içinde QR'nin yenileneceği gösterilir.

Katılımcılar sekmesinden sisteme önceden katılımcı listesi yüklenebilir. Bu işlem manuel (form üzerinden tek tek) veya CSV dosyası yüklenerek toplu olarak yapılabilir. CSV dosyasında "Ad Soyad", "Email" ve "Telefon" sütunları beklenmektedir. Her katılımcı için var/yok durumu görüntülenir; yönetici gerekirse manuel olarak da katılım işaretleyebilir.

Yoklama sekmesinden tüm katılım kayıtları listelenir; katılımcı adı, e-posta, katılım zamanı ve kayıt türü (QR ile, manuel veya walk-in) gösterilir. Bu liste Excel formatında dışa aktarılabilir.

**Katılımcı Tarafı**

Katılımcılar, etkinliğe ait QR kodu telefon kamerasıyla okutur. Uygulama önce konum iznini ister. Konum doğrulaması aktif olan etkinliklerde, katılımcının etkinlik konumuna olan mesafesi hesaplanır; tanımlanan yarıçap dışındaysa katılım reddedilir.

QR kod doğrulandıktan sonra bir form gösterilir. Katılımcı e-posta adresini girerse sistem bu adresi kayıtlı katılımcı listesiyle eşleştirir. Eşleşme varsa kayıt otomatik oluşturulur, eşleşme yoksa ad soyad ile birlikte iletişim bilgisi istenir (walk-in akışı). Daha önce katılım kaydı oluşturulmuş bir e-posta tekrar kayıt yapamaz.

**Hata Senaryoları**

- Süresi dolmuş veya sahte QR kod kullanılırsa işlem reddedilir.
- Etkinlik bulunamazsa hata mesajı gösterilir.
- Konum alınamazsa ya da mesafe yarıçap dışındaysa katılım engellenir.
- Yetkisiz kullanıcılar admin sayfalarına erişmeye çalışırsa login sayfasına yönlendirilir.
- Aynı katılımcı aynı etkinliğe birden fazla kayıt yapamaz.

---

## Kurulum

Projeyi klonlayın ve bağımlılıkları yükleyin:

```bash
git clone <repo-url>
cd yoksis
npm install
```

Proje kök dizininde `.env.local` adında bir dosya oluşturun ve aşağıdaki değerleri doldurun:

```
DATABASE_URL="postgresql://..."
JWT_SECRET="guclu-ve-uzun-bir-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`DATABASE_URL` için Neon üzerinden bir proje oluşturup connection string'i almanız gerekmektedir. https://neon.tech adresinden ücretsiz hesap açılabilir.

Veritabanı tablolarını oluşturun:

```bash
npm run db:push
```

İlk yönetici kullanıcısını oluşturun:

```bash
npm run seed
```

Bu komut çalıştıktan sonra terminalden varsayılan giriş bilgilerini görebilirsiniz. (E-posta: `admin@yoklama.com`, Şifre: `admin1234`)

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışmaya başlar.

---

## Kullanılabilir Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Üretim buildini oluşturur |
| `npm run start` | Üretim sunucusunu başlatır |
| `npm run db:push` | Drizzle şemasını veritabanına uygular |
| `npm run db:studio` | Drizzle Studio arayüzünü açar |
| `npm run seed` | Varsayılan admin kullanıcısını oluşturur |

---

## Proje Yapısı

```
app/
  (admin)/          Admin sayfaları (login zorunlu)
    dashboard/      Etkinlik listesi
    events/
      new/          Yeni etkinlik oluşturma
      [id]/         Etkinlik detayı, QR ekranı, katılımcılar, yoklama
  attend/
    [token]/        Katılımcı QR okutma ve kayıt sayfası
  api/
    auth/           Giriş ve çıkış endpoint'leri
    events/         Etkinlik CRUD ve alt işlemler
    attend/         QR doğrulama ve katılım kayıt endpoint'i

db/
  schema/           Drizzle tablo tanımları
  index.ts          Neon bağlantısı

lib/
  auth.ts           JWT işlemleri
  qr.ts             QR token üretimi ve konum hesaplama

components/
  attend/           Kamera QR okuyucu bileşeni

scripts/
  seed.ts           Veritabanı seed scripti
```

---

## QR Yenileme Mekanizması

Her etkinlik oluşturulduğunda 64 karakterli rastgele bir gizli anahtar (`qr_secret`) üretilir ve veritabanında saklanır.

QR içindeki token, bu anahtar ile birlikte mevcut zaman dilimi (`floor(timestamp / 60000)`) kullanılarak HMAC-SHA256 ile oluşturulur. Zaman dilimi her dakika bir değiştiğinden, token da her dakika otomatik olarak farklı bir değer üretir.

Katılımcı QR'yi okuttuğunda sunucu, gelen token'ı mevcut ve bir önceki zaman dilimine göre doğrular. Bir önceki dilimin de kabul edilmesi, dakika sınırında olası gecikme durumlarını tolere etmek içindir.

---

## Konum Doğrulama

Konum doğrulaması etkinlik bazında, yönetici tarafından aktif edilebilir. Aktif edildiğinde etkinlik için bir GPS koordinatı ve yarıçap (metre cinsinden) tanımlanır.

Katılımcı QR okuttuğunda tarayıcı Geolocation API'si aracılığıyla konum alınır. Bu konum ile etkinlik koordinatı arasındaki mesafe Haversine formülü ile hesaplanır. Mesafe tanımlanan yarıçapı aşıyorsa katılım kaydı oluşturulmaz.

Konum alınamazsa ve etkinlikte konum doğrulaması aktifse katılım yine reddedilir. Düşük hassasiyet ortamları için yarıçap değeri yeterince geniş tutulabilir.

---

## Deployment

Proje Vercel'e deploy edilmek üzere yapılandırılmıştır. Vercel üzerinde bir proje oluşturup ortam değişkenlerini (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`) tanımladıktan sonra deploy tetiklenebilir.

`NEXT_PUBLIC_APP_URL` değeri Vercel'deki proje URL'iniz olmalıdır; bu değer QR içine gömülen bağlantı adresini belirler.

---

## Güvenlik Notları

- Yönetici şifreleri veritabanında bcrypt ile hashlenmiş olarak saklanır.
- Oturum bilgisi httpOnly cookie ile tutulur, JavaScript erişimine kapalıdır.
- QR tokenlar sunucu tarafında doğrulanır; istemci tarafı doğrulama yapılmaz.
- Tüm admin API endpoint'leri JWT doğrulaması gerektirir.
