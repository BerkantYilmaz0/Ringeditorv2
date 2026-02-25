# Ring Tipleri Sayfası — Kullanıcı Akışı Dokümantasyonu

> **Sayfa URL:** `/Rings`  
> **Amaç:** Otobüs ring tiplerini listeleme, oluşturma, düzenleme ve silme işlemlerini yönetme.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Ring Tipleri Listesi (Ana Tablo)](#2-ring-tipleri-listesi-ana-tablo)
3. [Ring Tipi Arama](#3-ring-tipi-arama)
4. [Yeni Ring Tipi Oluşturma](#4-yeni-ring-tipi-oluşturma)
5. [Ring Tipi Düzenleme](#5-ring-tipi-düzenleme)
6. [Ring Tipi Silme](#6-ring-tipi-silme)
7. [Validasyon Kuralları Özeti](#7-validasyon-kuralları-özeti)
8. [Bildirimler ve Geri Bildirimler](#8-bildirimler-ve-geri-bildirimler)
9. [Sayfalama (Pagination)](#9-sayfalama-pagination)
10. [Bileşen Haritası](#10-bileşen-haritası)

---

## 1. Genel Bakış

Ring Tipleri sayfası, sistemdeki farklı otobüs ring hatlarını yönetmek için kullanılır. Her ring tipi şunları içerir:

| Alan | Açıklama |
|------|----------|
| **ID** | Benzersiz tanımlayıcı (otomatik) |
| **Ad** | Ring tipinin adı (ör: "Kızılay-Batıkent") |
| **Type ID** | Sistem tarafından otomatik atanan tip numarası |
| **Renk** | HEX formatında renk kodu (takvimde ve listelerde kullanılır) |
| **Bağlı Güzergah** | Bu ring tipine atanmış güzergah (otomatik algılanan) |

Sayfa açıldığında `GET /ring-types` API çağrısıyla tüm ring tipleri yüklenir.

---

## 2. Ring Tipleri Listesi (Ana Tablo)

### Tablo Sütunları

| Sütun | Genişlik | Açıklama |
|-------|----------|----------|
| **ID** | %7 | Ring tipinin benzersiz numarası |
| **Ad** | %20 | Ring tipinin adı |
| **Type ID** | %10 | Sistem tip numarası |
| **Renk** | %10 | 18×18 piksel renk kutusu + kenarlık (`#ccc`) |
| **İşlemler** | %10 | Düzenle ve Sil butonları |

### İşlem Butonları (Her Satırda)

| Buton | İkon | Boyut | Renk | Eylem |
|-------|------|-------|------|-------|
| **Düzenle** | 🖊️ Kalem ikonu | 23px | Mavi (primary) | Ring tipi düzenleme formunu açar |
| **Sil** | 🗑️ Çöp kutusu ikonu | 23px | Kırmızı (error) | Onay alarak ring tipini siler |

### Tablo Arka Plan Renkleri

- **Başlık satırı:** `#f5f5f5` (açık gri)
- **Veri satırları:** `#fbfbfb` (çok açık gri)

### Renk Gösterimi

Her satırda renk sütununda:
- 18×18 piksel kare renk kutusu
- Ring tipinin rengiyle doldurulmuş
- Gri kenarlık (`1px solid #ccc`)

---

## 3. Ring Tipi Arama

Tablonun üst sol köşesinde arama alanı bulunur.

- **Placeholder:** `"Ring tipi ara…"`
- **Boyut:** Küçük (`small`)
- **Çalışma Mantığı:**
  - Kullanıcı yazdıkça anlık filtreleme
  - Yalnızca **ad** alanında arama yapar
  - Büyük/küçük harf duyarsız
- Eşleşmeyen ring tipleri tablodan anlık gizlenir
- Sayfalama filtrelenmiş sonuçlara göre güncellenir

---

## 4. Yeni Ring Tipi Oluşturma

### Akış

1. Kullanıcı **"Yeni Ring Tipi Ekle"** butonuna basar
2. Diyalog (modal) açılır
3. Başlık: **"Yeni Ring Tipi Ekle"**
4. Kullanıcı formu doldurur
5. **"Kaydet"** butonuna basar
6. Başarılıysa diyalog kapanır, tablo güncellenir

### Form Alanları

| Alan | Tip | Zorunlu | Düzenlenebilir | Açıklama |
|------|-----|---------|---------------|----------|
| **Ad** | Metin girişi | ✅ | ✅ | Ring tipinin adı |
| **Type ID** | Metin girişi | — | ❌ (devre dışı) | Sistem tarafından otomatik atanır |
| **Bağlı Güzergah** | Dropdown (Select) | — | ❌ (devre dışı) | Otomatik algılanan güzergah |
| **Renk (Hex)** | Metin girişi | ✅ | ✅ | HEX renk kodu (ör: `#FF0000`) |

### Type ID Alanı

- **Devre dışı** (disabled) — kullanıcı değiştiremez
- Alt metin: `"Sistem tarafından otomatik atanır"`

### Bağlı Güzergah Alanı

- **Devre dışı** (disabled) — kullanıcı değiştiremez
- Etiket: `"Bağlı Güzergah (Otomatik)"`
- Bu alanda backend'deki güzergahlardan bu ring tipine atanmış olan (`ring_type_id` eşleşmesi) gösterilir
- Seçenekler:
  - `"Hiçbiri"` (boş değer)
  - Tüm güzergah listesi
- Eğer bir güzergah atanmışsa altında yeşil metin: `"Bu ring tipine "Güzergah Adı" güzergahı atanmış."`

### Renk Girişi

- Placeholder: `"#FF0000"`
- Manuel HEX kodu girişi

### Validasyonlar

| Kural | Hata Mesajı | Zaman |
|-------|------------|-------|
| Ad boş | `"Ad alanı boş olamaz."` | Kaydet'e basıldığında |
| Ad 2 karakterden kısa | `"Ad 2-64 karakter arasında olmalıdır."` | Kaydet'e basıldığında |
| Ad 64 karakterden uzun | `"Ad 2-64 karakter arasında olmalıdır."` | Kaydet'e basıldığında |
| Renk geçersiz HEX | `"Renk geçerli bir HEX formatında olmalıdır. (örn: #FF0000)"` | Kaydet'e basıldığında |

#### HEX Renk Validasyonu

Regex pattern: `/^#[0-9A-Fa-f]{6}$/`
- `#` ile başlamalı
- Tam 6 onaltılık karakter (0-9, A-F, a-f)
- Geçerli örnekler: `#FF0000`, `#2196f3`, `#000000`
- Geçersiz örnekler: `FF0000` (# eksik), `#GGG000` (geçersiz karakter), `#FFF` (kısa)

### Butonlar

| Buton | Eylem |
|-------|-------|
| **Kaydet** | Validasyonları çalıştırır, geçerliyse kaydeder |
| **Vazgeç** | Diyaloğu kapatır |

### Başarı/Hata Sonrası

- **Başarı:** Diyalog kapanır, tablo güncellenir
- **Hata:** Kırmızı alert: Backend hata mesajı gösterilir

---

## 5. Ring Tipi Düzenleme

### Akış

1. Kullanıcı satırdaki **kalem ikonuna** (🖊️) tıklar
2. Aynı diyalog açılır, mevcut verilerle dolu gelir
3. Başlık: **"Ring Tipi Düzenle"**
4. Kullanıcı istediği alanları değiştirir
5. **"Kaydet"** butonuna basar
6. API: `PUT /ring-types/{id}`
7. Başarılıysa diyalog kapanır, tablo güncellenir

### Düzenleme Modunda Farklılıklar

- Form alanları mevcut değerlerle doldurulur
- **Type ID** yine devre dışıdır
- **Bağlı Güzergah** otomatik olarak bu ring tipine atanmış güzergahı gösterir
- Aynı validasyonlar geçerlidir

---

## 6. Ring Tipi Silme

### Akış

1. Kullanıcı satırdaki **çöp kutusu ikonuna** (🗑️) tıklar
2. Tarayıcının yerel onay diyaloğu gösterilir
3. Mesaj: `"Bu ring tipini silmek istediğinize emin misiniz?"`
4. **Tamam:** Ring tipi silinir (`DELETE /ring-types/{id}`), tablo güncellenir
5. **İptal:** Hiçbir şey olmaz

> ⚠️ Ring tipi silindiğinde, bu tipe bağlı seferler ve güzergahlar etkilenebilir.

---

## 7. Validasyon Kuralları Özeti

| # | Alan | Kural | Hata Mesajı |
|---|------|-------|------------|
| 1 | Ad | Boş olamaz | `"Ad alanı boş olamaz."` |
| 2 | Ad | Min 2 karakter | `"Ad 2-64 karakter arasında olmalıdır."` |
| 3 | Ad | Max 64 karakter | `"Ad 2-64 karakter arasında olmalıdır."` |
| 4 | Renk | Geçerli HEX (`#RRGGBB`) | `"Renk geçerli bir HEX formatında olmalıdır. (örn: #FF0000)"` |
| 5 | — | Backend hatası | Backend'den dönen hata mesajı |

---

## 8. Bildirimler ve Geri Bildirimler

### Alert Mesajları (Diyalog İçi)

| Mesaj | Tip | Tetikleyici |
|-------|-----|-------------|
| `"Ad alanı boş olamaz."` | ❌ Kırmızı (error) | Validasyon hatası |
| `"Ad 2-64 karakter arasında olmalıdır."` | ❌ Kırmızı (error) | Validasyon hatası |
| `"Renk geçerli bir HEX formatında olmalıdır. (örn: #FF0000)"` | ❌ Kırmızı (error) | Validasyon hatası |
| Backend hata mesajı | ❌ Kırmızı (error) | API hatası |
| `"Bu ring tipine "..." güzergahı atanmış."` | ✅ Yeşil metin (bilgi) | Bağlı güzergah var |

### console.error Logları

| Durum | Mesaj |
|-------|-------|
| Veri çekme hatası | `"Veri çekme hatası:"` |
| Silme hatası | `"Ring tipi silme hatası:"` |
| Güzergah yükleme hatası | `"Routes fetch failed"` |

---

## 9. Sayfalama (Pagination)

| Özellik | Değer |
|---------|-------|
| Varsayılan satır sayısı | 10 |
| Satır seçenekleri | 10, 15 |
| Etiket | `"Sayfa Satır Sayısı"` |
| Gösterim formatı | `"1-10 / 25"` |

- Sayfa değiştirildiğinde tablo güncellenir
- Satır sayısı değiştirildiğinde sayfa 0'a döner
- Arama filtresi aktifse sayfalama filtrelenmiş sonuçlara göre çalışır

---

## 10. Bileşen Haritası

```
Rings/page.tsx (Ana Sayfa)
├── Tablo
│   ├── Arama alanı
│   ├── "Yeni Ring Tipi Ekle" butonu
│   ├── Tablo satırları
│   │   ├── ID, Ad, Type ID, Renk kutusu
│   │   └── Düzenle + Sil butonları
│   └── Sayfalama
└── RingTypeForm.tsx (Dialog — Oluştur/Düzenle)
    ├── Ad alanı
    ├── Type ID alanı (devre dışı)
    ├── Bağlı Güzergah dropdown (devre dışı, otomatik)
    ├── Renk (Hex) alanı
    ├── Validasyon alertleri
    └── Kaydet + Vazgeç butonları
```

---

## Tam Kullanıcı Senaryoları

### Senaryo 1: Yeni Ring Tipi Oluşturma

1. Kullanıcı `/Rings` sayfasına gider
2. **"Yeni Ring Tipi Ekle"** butonuna basar
3. Ad yazar: `"Kızılay-Batıkent"`
4. Renk girer: `#2196f3`
5. **"Kaydet"** butonuna basar
6. Diyalog kapanır, tabloda yeni ring tipi görünür

### Senaryo 2: Ring Tipi Düzenleme

1. Tablodaki satırın kalem ikonuna tıklar
2. Diyalog açılır, mevcut ad ve renk dolu gelir
3. Rengi değiştirir: `#FF5722`
4. **"Kaydet"** butonuna basar
5. Diyalog kapanır, renk kutusu güncellenir

### Senaryo 3: Ring Tipi Silme

1. Tablodaki satırın çöp kutusu ikonuna tıklar
2. `"Bu ring tipini silmek istediğinize emin misiniz?"` sorusu
3. **Tamam** → Ring tipi silinir, satır kaybolur

### Senaryo 4: Ring Tipi Arama

1. Arama kutusuna `"Kızılay"` yazar
2. Tablo anlık filtrelenir, yalnızca eşleşen ring tipleri gösterilir
3. Arama kutusunu temizler → tüm ring tipleri geri döner

---

*Bu doküman, Ring Tipleri sayfasının tüm kullanıcı etkileşimlerini, form akışlarını, validasyon kurallarını ve geri bildirim mekanizmalarını kapsamaktadır.*
