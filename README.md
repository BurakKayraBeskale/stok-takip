# StokTakip

Küçük ve orta ölçekli işletmeler için geliştirilmiş, web tabanlı stok ve envanter yönetim uygulaması.

## Özellikler

- **Urun Yönetimi** — Ürün ekleme, düzenleme, silme ve listeleme
- **Stok Takibi** — Giriş/çıkış hareketleri ve anlık stok durumu
- **Kategori Yönetimi** — Ürünleri kategorilere göre organize etme
- **Kullanıcı Kimlik Doğrulama** — JWT tabanlı güvenli giriş sistemi
- **Raporlama** — PDF formatında stok ve hareket raporları
- **Excel Export** — Stok verilerini Excel formatında dışa aktarma
- **E-posta Bildirimleri** — Kritik stok seviyelerinde otomatik bildirim

## Teknolojiler

### Backend
- **Node.js** + **Express** — REST API sunucusu
- **Prisma ORM** + **SQLite** — Veritabanı yönetimi
- **JWT** + **bcryptjs** — Kimlik doğrulama ve şifreleme
- **PDFKit** — PDF rapor oluşturma
- **Nodemailer** — E-posta gönderimi

### Frontend
- **React 18** — Kullanıcı arayüzü
- **React Router** — İstemci tarafı yönlendirme
- **Vite** — Geliştirme ortamı ve build aracı
- **Axios** — HTTP istemcisi
- **xlsx** — Excel dosyası oluşturma

## Kurulum

```bash
# Bağımlılıkları yükle (backend)
npm install

# Bağımlılıkları yükle (frontend)
cd client && npm install

# Veritabanını oluştur
npx prisma migrate dev

# Geliştirme sunucusunu başlat (backend)
npm run dev

# Geliştirme sunucusunu başlat (frontend)
cd client && npm run dev
```

## Lisans

Copyright (c) 2026 Burak Kayra Beşkale. MIT Lisansı kapsamında dağıtılmaktadır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
