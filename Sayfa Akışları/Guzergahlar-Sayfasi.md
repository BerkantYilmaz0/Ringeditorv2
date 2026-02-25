# Güzergahlar Sayfası — Kullanıcı Akışı Dokümantasyonu

> **Sayfa URL:** `/Routes`  
> **Amaç:** Ring güzergahlarını ve duraklarını harita tabanlı arayüzle oluşturma, düzenleme, silme ve durak yönetimi.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Sayfa Düzeni](#2-sayfa-düzeni)
3. [Güzergah Listesi (Sol Panel)](#3-güzergah-listesi-sol-panel)
4. [Harita (Sağ Panel)](#4-harita-sağ-panel)
5. [Yeni Güzergah Oluşturma (RouteEditor)](#5-yeni-güzergah-oluşturma-routeeditor)
6. [Güzergah Düzenleme](#6-güzergah-düzenleme)
7. [Güzergah Silme](#7-güzergah-silme)
8. [Durak Düzenleme Modu](#8-durak-düzenleme-modu)
9. [Durak Yöneticisi (StopManager)](#9-durak-yöneticisi-stopmanager)
10. [Haritadan Durak Ekleme](#10-haritadan-durak-ekleme)
11. [Yapay Zeka ile Rota Oluşturma](#11-yapay-zeka-ile-rota-oluşturma)
12. [Validasyon Kuralları Özeti](#12-validasyon-kuralları-özeti)
13. [Bildirimler ve Geri Bildirimler](#13-bildirimler-ve-geri-bildirimler)
14. [Bileşen Haritası](#14-bileşen-haritası)

---

## 1. Genel Bakış

Güzergahlar sayfası iki ana bölümden oluşur:

| Bölüm | Konum | Açıklama |
|-------|-------|----------|
| **Güzergah Listesi / Durak Yöneticisi** | Sol (%33) | Listeyi gösterir veya durak düzenleme modunda çalışır |
| **Harita** | Sağ (%67) | MapLibre tabanlı interaktif harita |

Sayfa açıldığında `GET /routes` API çağrısıyla güzergahlar yüklenir ve listeden **rastgele** bir güzergah haritada gösterilir.

### Varsayılan Harita Görünümü

| Parametre | Değer |
|-----------|-------|
| Enlem | 40.0381 |
| Boylam | 32.9034 |
| Zoom | 11 |

---

## 2. Sayfa Düzeni

### Üst Aksiyonlar

Sayfanın sağ üst köşesinde bağlama göre değişen butonlar yer alır:

| Durum | Butonlar |
|-------|----------|
| Normal mod (güzergah seçili) | **🖊️ Durakları Düzenle** |
| Durak düzenleme modu | **❌ İptal** (kırmızı) + **💾 Kaydet** (yeşil) |
| Normal mod (güzergah seçili değil) | Buton yok |

### Grid Yapısı

- Yükseklik: `calc(100vh - 220px)` — ekranın tamamına yakın
- Sol panel: xs=12, md=4
- Sağ panel: xs=12, md=8

---

## 3. Güzergah Listesi (Sol Panel)

### Başlık ve Buton

- Başlık: **"Güzergah Listesi"**
- Sağ üstte: **"+ Yeni Güzergah"** butonu (mavi, contained)

### Tablo Yapısı

Sticky header, küçük boyutlu (`small`) tablo:

| Sütun | Açıklama |
|-------|----------|
| **Ad** | Güzergah adı (kalın) + açıklama (alt metin, max 30 karakter + "...") |
| **Renk** | 20×20 piksel yuvarlak renk göstergesi + gri kenarlık |
| **İşlemler** | Düzenle + Sil ikonları (tooltip ile) |

### Satır Tıklama Davranışı

- Her satır tıklanabilir (`hover` efekti + `cursor: pointer`)
- Tıklandığında güzergah haritada gösterilir
- Seçili satır: Açık mavi arka plan (`primary` rengin %10 opaklığı)
- Seçili satır hover: Daha koyu mavi (%20 opaklık)

### Düzenleme Modunda Satır Tıklama

Durak düzenleme modu aktifken başka bir güzergaha tıklanırsa:
- Onay diyaloğu (tarayıcı confirm): `"Düzenleme modundasınız. Çıkmak istiyor musunuz? Kaydedilmemiş değişiklikler kaybolacak."`
- **Tamam:** Düzenleme modu kapatılır, yeni güzergah seçilir
- **İptal:** Mevcut düzenleme devam eder

### Boş Durum

Güzergah yoksa: `"Kayıtlı güzergah bulunamadı."` (tablo ortasında)

### İşlem Butonları

| Buton | İkon | Tooltip | Eylem |
|-------|------|---------|-------|
| **Düzenle** | 🖊️ Kalem | `"Düzenle"` | RouteEditor diyaloğunu açar |
| **Sil** | 🗑️ Çöp kutusu | `"Sil"` | Onay alarak siler |

> Butonlara tıklanırken `stopPropagation` ile satır seçimi engellenir.

---

## 4. Harita (Sağ Panel)

### Harita Modu

Harita iki modda çalışır:

| Mod | Açıklama |
|-----|----------|
| **routes** (normal) | Güzergah çizgileri ve duraklar gösterilir |
| **drawing** (düzenleme) | Durak düzenleme aktif, haritada etkileşim |

### Harita Üstü Bilgi Paneli

Sol üst köşede küçük bilgi kutusu:
- Normal mod: **"Genel Bakış Haritası"** (kalın yazı)
- Durak düzenleme modu:
  - **"Durak Düzenleme Modu"** (kalın yazı)
  - `"Haritadan durak seçin veya sağ tık ile yeni ekleyin."` (mavi, kalın açıklama)

### Haritada Gösterilen öğeler

| Öğe | Koşul |
|-----|-------|
| Seçili güzergahın çizgisi | Güzergah seçiliyken |
| Tüm güzergah çizgileri | Popup mantığı için arka planda |
| Tüm duraklar | Her zaman (düzenleme modunda yeni eklenenler dahil) |

---

## 5. Yeni Güzergah Oluşturma (RouteEditor)

### Açılma

**"+ Yeni Güzergah"** butonuna tıklanır.

### Diyalog Özellikleri

- Boyut: Tam genişlik (`maxWidth="lg"`)
- Başlık: **"Yeni Güzergah"**

### Form Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Güzergah Adı** | Metin girişi | ✅ | Güzergahın adı |
| **Bağlı Ring Tipi** | Dropdown (native select) | ✅ | Ring tipi seçimi |
| **Renk** | Renk seçici (`type="color"`) | ✅ | Görsel renk seçici |
| **Açıklama** | Metin girişi | ❌ | Opsiyonel açıklama |

### Güzergah Adı ve Ring Tipi Yan Yana

İlk satırda üç alan yan yana gösterilir:
1. Güzergah Adı (tam genişlik)
2. Bağlı Ring Tipi (min 150px)
3. Renk (100px genişlik)

### Varsayılan Değerler (Yeni Güzergah)

- Renk: `#2196f3` (mavi)
- Ring Tipi: İlk mevcut ring tipi otomatik seçilir
- Çizim Modu: Otomatik aktif (`draw`)

### Harita Modları

Diyalog içinde iki harita modu arasında geçiş yapılabilir:

| Mod | Buton | Açıklama |
|-----|-------|----------|
| **İzle** | `İzle` | Haritada sadece görüntüleme |
| **Çizim Modu** | `Çizim Modu` | Haritada güzergah çizgisi çizilebilir |

Toggle buton grubuyla seçim yapılır (sadece biri aktif olabilir).

### Çizim Araçları

| Buton | Renk | Eylem |
|-------|------|-------|
| **Geri Al** | Turuncu (warning) | Son çizim adımını geri alır |
| **Temizle** | Kırmızı (error) | Tüm çizimi siler (onay ile) |

**Temizle** butonuna basıldığında: `"Tüm çizimi temizlemek istiyor musunuz?"` onay diyaloğu.

### Harita Alanı

- Yükseklik: 500px
- Kenarlık: `1px solid #ccc`, yuvarlatılmış köşeler
- MapLibre tabanlı interaktif harita
- Çizim modunda: Draw kontrolü aktif
- İzleme modunda: Güzergah çizgisi gösterilir

### Validasyonlar

| Kural | Mesaj | Gösterim |
|-------|-------|----------|
| Ad boş | `"Ad zorunludur."` | `alert()` |
| Güzergah çizilmemiş | `"Lütfen bir güzergah çizin."` | `alert()` |
| Ring tipi seçilmemiş | `"Lütfen bir Ring Tipi seçin (Veritabanı zorunluluğu)."` | `alert()` |

### Butonlar

| Buton | Eylem |
|-------|-------|
| **Vazgeç** | Diyaloğu kapatır |
| **Kaydet** | Validasyonları çalıştırır, geçerliyse kaydeder |

Kaydet butonu:
- Kayıt sırasında: `"Kaydediliyor..."` metni
- AI rota oluşturma sırasında devre dışı

### API Çağrısı

**Yeni:** `POST /routes`  
**Payload:**
```json
{
  "name": "...",
  "description": "...",
  "color": "#2196f3",
  "ring_type_id": 1,
  "geometry": { "type": "LineString", "coordinates": [...] }
}
```

---

## 6. Güzergah Düzenleme

### Akış

1. Güzergah listesinde satırın **kalem ikonuna** tıklanır
2. RouteEditor diyaloğu açılır, mevcut verilerle dolu
3. Başlık: **"Güzergah Düzenle"**
4. Mevcut geometri haritada gösterilir (düzenlenebilir)
5. Değişiklikler yapılır → **"Kaydet"**
6. API: `PUT /routes/{id}`

### Mevcut Geometri

- Eğer güzergahın geometrisi JSON string olarak geliyorsa otomatik parse edilir
- Çizim modunda mevcut geometri üzerinde düzenleme yapılabilir
- İzleme modunda güzergah çizgisi önizleme olarak gösterilir

---

## 7. Güzergah Silme

### Akış

1. Güzergah listesinde satırın **çöp kutusu ikonuna** tıklanır
2. Tarayıcı onay: `"Bu güzergahı silmek istediğinize emin misiniz?"`
3. **Tamam:** `DELETE /routes/{id}` → Liste güncellenir
4. **İptal:** Hiçbir şey olmaz

### Hata Durumu

Silme başarısız olursa: `alert("Silme işlemi başarısız.")`

---

## 8. Durak Düzenleme Modu

### Açılma

Bir güzergah seçiliyken üstteki **"🖊️ Durakları Düzenle"** butonuna basılır.

### Mod Değişiklikleri

Durak düzenleme modu aktif olduğunda:

| Öğe | Değişiklik |
|-----|------------|
| Sol panel | Güzergah listesi → **Durak Yöneticisi** (StopManager) olur |
| Harita | Etkileşimli moda geçer (durak seçme/ekleme) |
| Üst butonlar | **İptal** + **Kaydet** butonları görünür |
| Harita bilgi kutusu | `"Durak Düzenleme Modu"` + mavi açıklama |

### Mevcut Durakların Yüklenmesi

Düzenleme modu başlatıldığında:
- Seçili güzergahın mevcut durakları geçici durak listesine (`tempStops`) kopyalanır
- Bu kopyalar üzerinde çalışılır (orijinal veri değişmez)

### Haritada Durak Etkileşimi

| Eylem | Sonuç |
|-------|-------|
| Mevcut durağa tıklama | Durak seçili/seçili değil geçişi (toggle) |
| Sağ tık ile yeni durak | Yeni Durak Ekleme diyaloğu açılır |

### Kaydetme

**"💾 Kaydet"** butonuna basıldığında:
1. API: `PUT /routes/{id}` — tüm güzergah bilgisi + güncellenmiş durak listesi
2. Geçici ID'li (yeni) durakların ID'leri temizlenir
3. Başarılı: `alert("Duraklar başarıyla güncellendi!")` → Düzenleme modu kapanır
4. Hatalı: `alert("Güncelleme sırasında bir hata oluştu.")`

### İptal

**"❌ İptal"** butonuna basıldığında:
- Düzenleme modu kapatılır
- Geçici durak listesi temizlenir
- Orijinal duraklar korunur

---

## 9. Durak Yöneticisi (StopManager)

Durak düzenleme modunda sol panelde görünür.

### Başlık ve Açıklama

- Başlık: **"Durak Yönetimi"**
- Açıklama: `"Durakları sıralamak için sürükleyin. Haritadan duraklara tıklayarak ekleyin."`

### Durak Listesi

Her durak bir kart (Paper) olarak gösterilir:

| Öğe | Açıklama |
|-----|----------|
| **☰ Sürükleme tutacağı** | Sol tarafta, durak sırasını değiştirmek için |
| **Sıra No + Ad** | `"1. Kızılay"` şeklinde kalın yazı |
| **Açıklama** | Alt metin, yoksa `"Açıklama yok"` |
| **🗑️ Sil butonu** | Sağ tarafta kırmızı sil ikonu |

### Sürükle-Bırak (Drag & Drop)

- **@dnd-kit** kütüphanesi kullanılır
- Duraklar dikey liste stratejisiyle sıralanabilir
- Sürüklenen durak %50 opaklığa düşer
- Bırakıldığında `arrayMove` ile sıra güncellenir

### Desteklenen Sensörler

| Sensör | Açıklama |
|--------|----------|
| **PointerSensor** | Mouse/dokunmatik ile sürükleme |
| **KeyboardSensor** | Klavye ile sıralama |

### Durak Silme

Kart üzerindeki çöp kutusu ikonuna tıklanarak durak listeden çıkarılır.

### Boş Durum

Durak yoksa kesikli kenarlıklı kutu: `"Henüz durak eklenmemiş."`

---

## 10. Haritadan Durak Ekleme

### Haritada Mevcut Durağa Tıklama (Toggle)

Durak düzenleme modunda haritadaki bir durağa tıklandığında:
- Durak zaten listede varsa → Listeden **çıkarılır**
- Durak listede yoksa → Listeye **eklenir**

### Yeni Durak Oluşturma (Sağ Tık)

1. Haritada boş bir noktaya **sağ tıklanır**
2. **"Yeni Durak Ekle"** diyaloğu açılır

### Yeni Durak Diyaloğu

| Alan | Tip | Varsayılan | Açıklama |
|------|-----|-----------|----------|
| **Durak Adı** | Metin girişi (autoFocus) | `"Yeni Durak N"` | N = mevcut durak sayısı + 1 |

- Konum (lat/lng): Sağ tıklanan noktadan otomatik alınır
- Geçici ID: `-Date.now()` (negatif timestamp)

### Butonlar

| Buton | Eylem |
|-------|-------|
| **Vazgeç** | Diyaloğu kapatır |
| **Ekle** | Durağı geçici listeye ekler, diyaloğu kapatır |

### Klavye Desteği

- **Enter** tuşuyla da durak eklenebilir

### Geçici Durakların Haritada Görünmesi

Yeni eklenen duraklar anında haritada gösterilir:
- Tüm güzergahlardan toplanan duraklar + yeni eklenen geçici duraklar birleştirilir
- Aynı ID'ye sahip duraklar filtrelenir (tekrar engellenir)

---

## 11. Yapay Zeka ile Rota Oluşturma

RouteEditor diyaloğu içinde OSRM tabanlı otomatik rota oluşturma özelliği bulunur.

### Akış

1. **"🪄 Yapay Zeka (AI) ile Rota Oluştur"** butonuna tıklanır
2. Bilgi kutusu gösterilir: **"📍 Başlangıç Noktasını Seçin"**
3. Kullanıcı haritada bir noktaya tıklar → Başlangıç noktası belirlenir
4. Bilgi kutusu güncellenir: **"🏁 Bitiş Noktasını Seçin"**
5. Kullanıcı haritada ikinci bir noktaya tıklar → Bitiş noktası belirlenir
6. OSRM servisine rota isteği gönderilir
7. Dönen rota geometrisi haritada gösterilir

### AI Rota Modu Kısıtlamaları

AI rota modu aktifken:
- Form alanları (Ad, Ring Tipi, Renk, Açıklama) **devre dışı**
- Harita mod değişikliği (İzle/Çizim) **devre dışı**
- Geri Al ve Temizle butonları **devre dışı**
- Kaydet butonu **devre dışı**

### İptal

AI rota modundayken **"İptal"** butonuyla çıkılabilir.

### Yükleme Göstergesi

Rota hesaplanırken harita üstüne tam ekran **backdrop + dönen ikon** gösterilir.

### Hata Durumları

| Hata | Mesaj |
|------|-------|
| Rota bulunamadı | `alert("Rota bulunamadı.")` |
| Servis hatası | `alert("Rota servisi hatası.")` |

---

## 12. Validasyon Kuralları Özeti

### Güzergah Oluşturma/Düzenleme

| # | Alan | Kural | Mesaj | Gösterim |
|---|------|-------|-------|----------|
| 1 | Ad | Boş olamaz | `"Ad zorunludur."` | `alert()` |
| 2 | Geometri | Çizilmiş olmalı | `"Lütfen bir güzergah çizin."` | `alert()` |
| 3 | Ring Tipi | Seçilmiş olmalı | `"Lütfen bir Ring Tipi seçin (Veritabanı zorunluluğu)."` | `alert()` |

### Yeni Durak Ekleme

| # | Kural | Davranış |
|---|-------|----------|
| 1 | Durak adı boş olamaz | "Ekle" butonu çalışmaz (boş string kontrolü) |

### Durak Düzenleme Modu

| # | Durum | Mesaj |
|---|-------|-------|
| 1 | Düzenleme modunda başka güzergaha geçiş | `"Düzenleme modundasınız. Çıkmak istiyor musunuz? Kaydedilmemiş değişiklikler kaybolacak."` |
| 2 | Çizimi temizleme | `"Tüm çizimi temizlemek istiyor musunuz?"` |

---

## 13. Bildirimler ve Geri Bildirimler

### Alert (Diyalog/Tarayıcı)

| Mesaj | Tip | Tetikleyici |
|-------|-----|-------------|
| `"Duraklar başarıyla güncellendi!"` | ✅ Başarı | Durak kaydetme başarılı |
| `"Güncelleme sırasında bir hata oluştu."` | ❌ Hata | Durak kaydetme başarısız |
| `"Silme işlemi başarısız."` | ❌ Hata | Güzergah silme başarısız |
| `"Rota bulunamadı."` | ⚠️ Uyarı | AI rota bulunamadı |
| `"Rota servisi hatası."` | ❌ Hata | OSRM servis hatası |
| `"Ad zorunludur."` | ❌ Hata | Validasyon |
| `"Lütfen bir güzergah çizin."` | ❌ Hata | Validasyon |

### Kayıt Göstergesi

- Kaydet butonu metni: `"Kaydediliyor..."` (kayıt sırasında)
- AI modu: Backdrop + CircularProgress (harita üstünde)

---

## 14. Bileşen Haritası

```
Routes/page.tsx (Ana Sayfa)
├── Üst Aksiyonlar
│   ├── "Durakları Düzenle" butonu (normal mod)
│   └── "İptal" + "Kaydet" butonları (düzenleme modu)
├── Sol Panel (Grid xs=12, md=4)
│   ├── RouteList.tsx (Normal Mod)
│   │   ├── Güzergah tablosu (Ad, Renk, İşlemler)
│   │   ├── Satır seçimi → Haritada gösterim
│   │   ├── Düzenle → RouteEditor açar
│   │   ├── Sil → Onay + API silme
│   │   └── "Yeni Güzergah" → RouteEditor açar
│   └── StopManager.tsx (Düzenleme Modu)
│       ├── Sürükle-bırak durak listesi (@dnd-kit)
│       ├── Sıralama değiştirme
│       └── Durak silme
├── Sağ Panel (Grid xs=12, md=8)
│   └── MapLibreBoard (İnteraktif harita)
│       ├── Normal mod: Güzergah çizgisi + duraklar
│       └── Düzenleme modu: Durak seçme/ekleme
├── RouteEditor.tsx (Dialog — Güzergah Oluştur/Düzenle)
│   ├── Ad, Ring Tipi, Renk, Açıklama alanları
│   ├── Harita (çizim modu)
│   │   ├── İzle / Çizim Modu toggle
│   │   ├── Geri Al + Temizle butonları
│   │   └── MapLibreBoard (drawing modu)
│   ├── AI Rota Oluşturma
│   │   ├── Başlangıç noktası seçimi
│   │   ├── Bitiş noktası seçimi
│   │   └── OSRM rota hesaplama
│   └── Kaydet + Vazgeç butonları
└── Yeni Durak Dialog
    ├── Durak adı girişi
    └── Ekle + Vazgeç butonları
```

---

## Tam Kullanıcı Senaryoları

### Senaryo 1: Yeni Güzergah Oluşturma (Manuel Çizim)

1. Kullanıcı `/Routes` sayfasına gider
2. Sol panelde **"+ Yeni Güzergah"** butonuna basar
3. RouteEditor diyaloğu açılır, çizim modu aktif
4. Güzergah adını yazar: `"Kızılay-Batıkent"`
5. Ring tipi seçer, renk seçer
6. Haritada çizim yaparak güzergah oluşturur
7. **"Kaydet"** butonuna basar → API'ye kaydedilir → Diyalog kapanır → Liste güncellenir

### Senaryo 2: AI ile Rota Oluşturma

1. RouteEditor diyaloğunda **"🪄 Yapay Zeka (AI) ile Rota Oluştur"** butonuna basar
2. Haritada başlangıç noktasına tıklar
3. Haritada bitiş noktasına tıklar
4. OSRM rota hesaplar → Haritada güzergah çizgisi gösterilir
5. Güzergah adını ve diğer bilgileri doldurur
6. **"Kaydet"** butonuna basar

### Senaryo 3: Güzergaha Durak Ekleme

1. Listeden bir güzergaha tıklar → Haritada gösterilir
2. **"🖊️ Durakları Düzenle"** butonuna basar
3. Sol panel → Durak Yöneticisi'ne dönüşür
4. Haritada mevcut duraklara tıklayarak ekler
5. Haritada boş noktaya sağ tıklayarak yeni durak oluşturur
6. Durakları sürükle-bırakla sıralar
7. **"💾 Kaydet"** butonuna basar
8. `"Duraklar başarıyla güncellendi!"` → Düzenleme modu kapanır

### Senaryo 4: Güzergah Silme

1. Listede satırın çöp kutusu ikonuna tıklar
2. Onay: `"Bu güzergahı silmek istediğinize emin misiniz?"`
3. **Tamam** → Güzergah silinir, listeden kaldırılır

### Senaryo 5: Durak Sırasını Değiştirme

1. Durak düzenleme modunu açar
2. Sol paneldeki durak listesinde bir durağı tutar
3. Yukarı veya aşağı sürükler
4. Bırakır → Sıra güncellenir
5. **"💾 Kaydet"** butonuna basar → Yeni sıra kaydedilir

---

*Bu doküman, Güzergahlar sayfasının tüm kullanıcı etkileşimlerini, harita özelliklerini, durak yönetim akışlarını, validasyon kurallarını ve geri bildirim mekanizmalarını kapsamaktadır.*
