# Ring Planner (RingEditor v2)

> **Bu proje, [RingEditor v1](https://github.com/BerkantYilmaz0/RingEditor) projesinin devamı niteliğindeki v2 versiyonudur.**
> **[Canlı Demo](http://byilmaz.dev/)** · Demo giriş: `admin` / `admin123`

Bu sistem ticari amaçla kullanılmak üzere geliştirilmemiştir. Kişisel gelişim ve öğrenme amacıyla oluşturulmuş bir portföy projesidir. Ticari amaçla kullanılamaz.

### v1'den v2'ye: Ne Değişti?
v1 versiyonundaki PHP & MySQL altyapısı, v2 ile yerini tamamen modern ve ölçeklenebilir bir teknoloji yığınına bıraktı:
- **Teknoloji Atlaması:** PHP'den Node.js/TypeScript'e, MySQL'den PostgreSQL/PostGIS'e geçiş yapıldı.
- **Modern Mimari:** pnpm workspace kullanılarak monorepo yapısına geçildi.
- **Coğrafi Zeka:** Rotalar ve duraklar artık PostGIS ile coğrafi veri olarak işleniyor.
- **Hız:** esbuild ile bundle edilerek API performansında ciddi iyileştirmeler sağlandı.

---

### Proje Ne Yapar?
Kampüs veya şehir içi ring hatlarını, güzergahları ve durakları harita üzerinde planlamak ve yönetmek için geliştirilmiş full-stack bir yönetim arayüzüdür.

- **Güzergah Çizimi:** Harita üzerinde interaktif olarak doğrudan güzergah oluşturma ve OSRM ile en kısa yol hesaplama.
- **Durak Yönetimi:** Durakları harita üzerinde sürükle-bırak ile sıralama ve hatlara atama.
- **Şablon Sistemi:** Tekrarlayan sefer planlarını şablon olarak kaydetme ve tek tıkla toplu sefer üretme.
- **Sefer Planlama:** Günlük operasyonu yönetme, araç atama ve çakışma kontrolü.
- **Dashboard:** Operasyonun genel istatistiklerini ve özet bilgilerini takip etme.

---

### Teknoloji Stack

| Katman | Teknolojiler |
|--------|--------------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui, TanStack Query |
| **Backend** | Node.js 20, Express, TypeScript 5, Prisma ORM, esbuild |
| **Veritabanı** | PostgreSQL 16 + PostGIS |
| **Altyapı** | Docker & Docker Compose, Redis (Auth & Cache), pnpm |

---

### Proje Yapısı

```bash
ring-planner/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Node.js backend
├── packages/
│   └── shared/       # Ortak tipler ve validasyon şemaları
├── Sayfa Akışları/   # Sayfa bazlı detaylı dökümantasyonlar
└── akis.md           # Sistem genel mantığı ve entity ilişkileri
```

---

### API Yapısı (REST)

Tüm endpoint'ler `/api/v1` prefix'i ile başlar. Auth dışındaki işlemler JWT gerektirir.

| Yöntem | Endpoint | Açıklama |
|--------|----------|----------|
| **POST** | `/auth/login` | Giriş yap ve httpOnly cookie al |
| **POST** | `/auth/logout` | Çıkış yap ve blacklist'e al |
| **GET** | `/dashboard/stats` | Genel özet ve istatistikler |
| **GET/POST** | `/stops` | Durak listeleme ve yeni durak ekleme |
| **GET/POST** | `/routes` | Güzergah yönetimi ve harita geometrisi |
| **GET/POST** | `/ring-types` | Araç kategorileri ve renk tanımları |
| **GET/POST** | `/devices` | Plaka ve araç envanter yönetimi |
| **GET/POST** | `/templates` | Sefer şablonları (Plan taslakları) |
| **POST** | `/template-jobs/bulk`| Şablona tek seferde çoklu sefer ekleme |
| **GET/POST** | `/schedules` | Canlı sefer takvimi ve operasyon |

---

### Kurulum (Docker)

En hızlı yol. Docker ve Docker Compose yüklü olması yeterli.

```bash
# 1. Klonla
git clone <REPO_URL>
cd RingEditor

# 2. Hazırla
cp .env.example .env

# 3. Çalıştır
docker compose up --build -d

# 4. Veritabanını Yapılandır
pnpm db:migrate
pnpm db:seed
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Demo Giriş:** `admin` / `admin123`

---

### Lisans
Bu proje MIT Lisansı altında lisanslanmıştır. Tamamen öğrenme ve gelişim odaklı bir projedir.
