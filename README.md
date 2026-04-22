# StokTakip

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

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
- **Prisma ORM** + **PostgreSQL** — Veritabanı yönetimi
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

## Screenshots

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/9e0490c7-c771-44fc-a8a7-aa74aef4d433)

### Ürün Listesi
![Ürün Listesi](https://github.com/user-attachments/assets/28af70a5-4322-4364-962f-c5bf1458189c)

### Stok Hareketleri
![Stok Hareketleri](https://github.com/user-attachments/assets/7ad7197a-0ea2-4b00-b265-53ba48b7d2a5)

### Raporlar
![Raporlar](https://github.com/user-attachments/assets/dfff2c61-bc0a-464f-97b6-7de295ffd15d)


## Lisans

Copyright (c) 2026 Burak Kayra Beşkale. MIT Lisansı kapsamında dağıtılmaktadır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
