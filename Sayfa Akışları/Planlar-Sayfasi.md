# Planlar Sayfası — Kullanıcı Akışı Dokümantasyonu

> **Sayfa URL:** `/Plans`  
> **Amaç:** Takvim tabanlı arayüz ile günlük seferleri görüntüleme, oluşturma, düzenleme, silme ve şablonları planlara uygulama.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Takvim Görünümleri](#2-takvim-görünümleri)
3. [Aylık Görünüm (dayGridMonth)](#3-aylık-görünüm-daygridmonth)
4. [Günlük Görünüm (timeGridDay)](#4-günlük-görünüm-timegridday)
5. [Liste Görünümü (listDay)](#5-liste-görünümü-listday)
6. [Aktif Ringler Paneli (Legend)](#6-aktif-ringler-paneli-legend)
7. [Yeni Sefer Ekleme (AddJobDialog)](#7-yeni-sefer-ekleme-addjobdialog)
8. [Tekil Sefer Düzenleme (EditJobDialog)](#8-tekil-sefer-düzenleme-editjobdialog)
9. [Toplu Sefer Düzenleme (JobsForm)](#9-toplu-sefer-düzenleme-jobsform)
10. [Şablondan Sefer Ekleme (ApplyTemplateDialog)](#10-şablondan-sefer-ekleme-applytemplatedialog)
11. [Şablon Önizleme ve Uygulama (PreviewTemplateDialog)](#11-şablon-önizleme-ve-uygulama-previewtemplatedialog)
12. [Validasyon Kuralları Özeti](#12-validasyon-kuralları-özeti)
13. [Bildirimler ve Geri Bildirimler](#13-bildirimler-ve-geri-bildirimler)
14. [Klavye Kısayolları](#14-klavye-kısayolları)
15. [Bileşen Haritası](#15-bileşen-haritası)

---

## 1. Genel Bakış

Planlar sayfası **FullCalendar** kütüphanesine dayanan bir takvim arayüzü sunar. Kullanıcı seferleri takvim üzerinde görsel olarak izleyebilir, tarihlere tıklayarak sefer ekleyebilir ve mevcut seferlere tıklayarak düzenleyebilir.

Sayfa açıldığında paralel olarak şu veriler yüklenir:

| Veri | API Endpoint | Açıklama |
|------|-------------|----------|
| Ring Tipleri | `GET /ring-types` | Sefer renk ve tip bilgileri |
| Araçlar | `GET /device` | Plaka listesi |
| Rotalar | `GET /routes` | Güzergah listesi |
| Seferler | `GET /jobs?from=...&to=...` | Takvim aralığına göre seferler |

---

## 2. Takvim Görünümleri

Takvimin sağ üst köşesindeki butonlarla görünüm değiştirilebilir:

| Görünüm | Buton Metni | Açıklama |
|---------|-------------|----------|
| **Aylık** | `Ay` | Aylık takvim, günlere seferler yerleştirilir |
| **Günlük** | `Gün` | Bir günün saatlik zaman çizelgesi |
| **Liste** | `Liste` | Bir günün seferlerinin düz liste hali |

### Takvim Navigasyonu

| Buton | Konum | Eylem |
|-------|-------|-------|
| **◀ (Önceki)** | Sol üst | Önceki ay/güne git |
| **▶ (Sonraki)** | Sol üst | Sonraki ay/güne git |
| **Bugün** | Sol üst | Bugüne dön |

### Takvim Dil Ayarı
- Dil: **Türkçe** (`trLocale`)
- Haftanın ilk günü: **Pazartesi** (`firstDay: 1`)

---

## 3. Aylık Görünüm (dayGridMonth)

### Sefer Gösterimi

Aylık görünümde seferler iki gruba ayrılarak gösterilir:

#### Şablon Kaynaklı Seferler
- Aynı güne, aynı şablona ait seferler **tek bir özet event** halinde gruplandırılır
- Gösterim: Şablon adı (ör: `"Yaz Şablonu"`)
- Tüm gün etkinliği (`allDay: true`) olarak gösterilir

#### Manuel Seferler
- Her sefer ayrı ayrı gösterilir
- Gösterim: Renkli nokta + rota/ring adı

### Gün Tıklama Davranışı

Aylık görünümde bir güne tıklandığında:
1. Takvim otomatik olarak **günlük görünüme** geçer
2. Tıklanan gün seçili gün olarak ayarlanır

### "Daha Fazla" Bağlantısı

Bir günde çok fazla sefer varsa `"N adet sefer mevcut."` metniyle **popover** açılır.

---

## 4. Günlük Görünüm (timeGridDay)

### Zaman Dilimleri

| Özellik | Değer |
|---------|-------|
| Dilim süresi | 10 dakika |
| Etiket aralığı | 10 dakika |
| Saat formatı | 24 saat (ör: `14:30`) |
| Snap süresi | 10 dakika |

### Sefer Gösterimi

Her sefer şu bilgilerle gösterilir:
- Renkli nokta (ring renginde)
- Saat + Rota adı + Plaka
- Örnek: `"14:30 Kızılay-Batıkent (06 ABC 123)"`

### Gün Tıklama Davranışı

Günlük görünümde bir saat dilimine tıklandığında:
- **Yeni Sefer Ekleme diyaloğu** açılır (tıklanan gün/saat bilgisiyle)

### Üst Butonlar (Günlük Görünümde)

Günlük ve liste görünümünde sayfanın üstünde ek butonlar görünür:

| Buton | Renk | Koşul | Eylem |
|-------|------|-------|-------|
| **Şablondan Sefer Ekle** | Mavi (primary) | Her zaman görünür | Şablon uygulama diyaloğunu açar |
| **Seferleri Düzenle** | Mor (secondary) | Sadece Gün/Liste görünümünde | Toplu düzenleme formunu açar |

---

## 5. Liste Görünümü (listDay)

Günlük görünümle aynı verileri düz liste halinde gösterir. Daha kompakt bir görünüm sunar.

---

## 6. Aktif Ringler Paneli (Legend)

Takvimin altında bir panel yer alır:

- Başlık: **"Aktif Ringler"**
- Sol kenarda turuncu bordür (`#f59e0b`)
- Her ring tipi, rengine ait bir nokta ve adıyla listelenir
- Örnek: `🔵 Kızılay-Batıkent`, `🟢 Ulus-Keçiören`

---

## 7. Yeni Sefer Ekleme (AddJobDialog)

### Açılma

- **Günlük görünümde** bir saat dilimine tıklanır
- **"Yeni Sefer Ekle"** diyaloğu açılır

### Diyalog İçeriği

Üst kısımda seçilen tarih gösterilir:
- Format: `"Seçilen tarih: 24 Şubat 2026"` (Türkçe uzun tarih formatı)

### Form Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Saat** | Saat seçici (`time`) | ✅ | Seferin kalkış saati |
| **Ring Tipi** | Dropdown (select) | ✅ | Ring tipi seçimi |
| **Rota** | Salt okunur metin | Otomatik | Ring tipine göre otomatik dolar |
| **Plaka** | Dropdown (select) | ✅ | Araç seçimi (max 250px yükseklik dropdown) |

### Rota Otomatik Seçimi

- Ring tipi seçildiğinde, o ring tipine ait ilk rota otomatik olarak seçilir
- Rota alanı **salt okunurdur**
- Eşleşen rota yoksa: `"Bu ring tipine ait rota yok"` gösterilir

### Seçili Ring Tipi Gösterimi

Ring tipi seçildiğinde alanın altında renk kutusu ve ad gösterilir:
- `🟦 Kızılay-Batıkent` şeklinde renkli kare + ad

### Validasyonlar

| Kural | Hata Mesajı |
|-------|------------|
| Saat seçilmedi | `"Lütfen saat seçin."` |
| Ring tipi seçilmedi | `"Lütfen ring tipi seçin."` |
| Plaka seçilmedi | `"Lütfen plaka seçin."` |
| Rota seçilmedi | `"Lütfen bir rota seçin."` |
| Geçmiş güne sefer | `"Geçmiş günlere sefer eklenemez veya güncellenemez."` |
| Bugün ama geçmiş saat | `"Geçmiş saate sefer ekleyemezsiniz."` |
| Aynı plaka+saat çakışması | `"Bu plaka için HH:mm saatinde zaten bir sefer var!"` |

### Çakışma Kontrolü

Sefer kaydedilmeden önce backend'e çakışma kontrolü yapılır:
- API: `POST /jobs/check-conflict` → `{ duetime, deviceid }`
- Çakışma varsa: `"Bu plaka için HH:mm saatinde zaten bir sefer var!"`

### Butonlar

| Buton | Eylem |
|-------|-------|
| **Kaydet** | Validasyonları çalıştırır, çakışma kontrolü yapar, geçerliyse kaydeder |
| **İptal** | Formu sıfırlar, diyaloğu kapatır |

### Başarı Sonrası

- Form sıfırlanır
- Diyalog kapanır
- Takvim verileri güncellenir

---

## 8. Tekil Sefer Düzenleme (EditJobDialog)

### Açılma

Takvimde herhangi bir **sefere (event'e)** tıklandığında açılır.

### Diyalog İçeriği

Geniş bir diyalog (`maxWidth="lg"`) içinde yatay olarak dizilmiş alanlar:

| Alan | Tip | Davranış |
|------|-----|----------|
| **Saat** | Time input | Değiştirilip blur olduğunda anında kaydeder |
| **Type** | Dropdown | Değiştirildiğinde anında kaydeder |
| **Rota** | Salt okunur | Ring tipine göre otomatik gösterilir |
| **Plaka** | Dropdown | Değiştirildiğinde anında kaydeder |

### Anında Kaydetme (Auto-Save)

Bu diyalogda her alan değişikliği **anında API'ye gönderilir**:
- Her değişiklikte `PUT /jobs/{id}` çağrılır
- Tüm mevcut alanlar (saat, tip, plaka, rota) payload'a dahil edilir
- Başarı: `"✅ Güncelleme başarılı"` alert (2 saniye)
- Hata: `"❌ Güncelleme başarısız"` alert

### Seferi Silme

| Buton | Renk | Konum | Eylem |
|-------|------|-------|-------|
| **Seferi Sil** | Kırmızı (outlined) | Sağ tarafta | Silme onay diyaloğunu açar |

#### Silme Onay Diyaloğu

- Başlık: `"Seferi Sil"`
- Mesaj: `"Bu seferi silmek istediğine emin misin?"`
- Butonlar:
  - **Vazgeç:** Diyaloğu kapatır
  - **Sil** (kırmızı): Seferi siler, diyalogları kapatır, takvimi günceller

---

## 9. Toplu Sefer Düzenleme (JobsForm)

### Açılma

Günlük veya liste görünümündeyken üstteki **"Seferleri Düzenle"** butonuna basılır.

### Panel Özellikleri

- Sabit konumlu modal panel (%70 genişlik)
- Başlık: `"Seferleri Düzenle"`
- Sağ üstte **✕ kapat** butonu

### Sefer Filtreleme

Yalnızca seçilen güne ait ve **gelecek saatlerdeki** seferler gösterilir. Geçmiş saatteki seferler filtrelenir.

### Arama

- Placeholder: `"Sefer ara (saat / ring / plaka)..."`
- Anlık filtreleme (saat, ring adı, plaka)

### Gruplama

Seferler **ring tipine göre accordion** yapısında gruplandırılır:
- Her accordion sol kenarda ring renginde bordür
- Ring adı + sefer sayısı gösterimi
- Varsayılan olarak açık gelir

### Grup İçi Checkbox

Her grubun başlık satırında **grup bazlı tümünü seç** checkbox'ı vardır:
- Tamamı seçili: Dolu yeşil
- Kısmı seçili: Indeterminate
- Hiçbiri: Boş

### Sefer Tablosu (Grup İçi)

| Sütun | Açıklama |
|-------|----------|
| ☐ Checkbox | Sefer seçme |
| Saat | HH:mm formatında |
| Rota | Güzergah adı veya `"—"` |
| Plaka | Araç plakası |
| Aksiyonlar | Sil butonu (seçiliyse) |

### Inline Düzenleme

Satıra tıklanarak inline düzenleme moduna geçilir:

| Alan | Bileşen |
|------|---------|
| Saat | Time input |
| Type | Autocomplete (arama yapılabilir) |
| Rota | Salt okunur (ring tipine göre otomatik) |
| Plaka | Autocomplete (arama yapılabilir) |

Kaydet (✓) ve İptal (✕) butonlarıyla yönetilir.

**Önemli fark:** Bu inline edit her kaydetmede anında API'ye `PUT /jobs/{id}` gönderir (şablonlardan farklı olarak toplu değil tekil kayıt).

### Tekil Silme

1. Sefer checkbox'ı işaretlenir
2. Satırda çöp kutusu ikonu görünür
3. Tıklanır → Onay diyaloğu: `"Bu seferi silmek istediğinize emin misiniz?"`
4. Sil → API'den silinir (`DELETE /jobs/{id}`) → Liste güncellenir

### Toplu Silme

1. Bir veya daha fazla sefer seçilir
2. **"Seçilen Seferleri Sil (N)"** butonuna basılır
3. Onay diyaloğu: `"Seçtiğiniz N sefer silinecek. Emin misiniz?"`
4. Sil → Paralel API çağrılarıyla silinir → Liste güncellenir

### Boş Durum

Sefer yoksa: `"Henüz kayıt yok."` (bilgi alert'i)

---

## 10. Şablondan Sefer Ekleme (ApplyTemplateDialog)

### Açılma

Sayfanın üstündeki **"Şablondan Sefer Ekle"** butonuna tıklanır.

### Diyalog İçeriği

Başlık: **"Şablonu Planlara Uygula"**

### Form Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Şablon** | Dropdown | ✅ | Mevcut şablonlardan seçim |
| **Başlangıç** | Tarih seçici | ✅ | Uygulanacak ilk gün |
| **Bitiş** | Tarih seçici | ✅ | Uygulanacak son gün |
| **Haftanın Günleri** | Checkbox grubu | ✅ (en az 1) | Uygulanacak günler |

### Şablon Yükleme

- Diyalog açıldığında şablonlar API'den çekilir
- Yüklenirken: Dropdown'da `"Yükleniyor…"` gösterilir (dönen ikon ile)

### Gün Seçimi

Günler checkbox olarak listelenir: `Pzt, Sal, Çar, Per, Cum, Cmt, Paz`

Varsayılan olarak **tüm günler** seçilidir.

**Hızlı Seçim Butonları:**

| Buton | Eylem |
|-------|-------|
| **Hafta İçi** | Pzt-Cum seçer |
| **Hafta Sonu** | Cmt-Paz seçer |
| **Tümü** | Hepsini seçer |
| **Hiçbiri** | Hepsini temizler |

### Devam Butonu Aktivasyon Koşulları

Buton aktif olması için:
- Şablon seçilmiş
- Başlangıç tarihi girilmiş
- Bitiş tarihi girilmiş
- Başlangıç ≤ Bitiş
- En az 1 gün seçilmiş

### Validasyonlar

| Kural | Hata Mesajı |
|-------|------------|
| Geçmiş tarih seçildi | `"Geçmiş tarihlere sefer ekleme yapamazsınız!!"` |

### "Devam" Butonu Tıklandığında

1. Backend'e çakışma kontrolü gönderilir: `POST /jobs/check-conflict`
2. Çakışma sonuçlarıyla birlikte **Önizleme Diyaloğu** açılır
3. Bu diyalog kapanır

### Butonlar

| Buton | Eylem |
|-------|-------|
| **İptal** | Diyaloğu kapatır |
| **Devam** | Çakışma kontrolü yapar, önizlemeye geçer |

---

## 11. Şablon Önizleme ve Uygulama (PreviewTemplateDialog)

### Açılma

ApplyTemplateDialog'dan çakışma kontrolü tamamlandığında otomatik açılır.

### Diyalog İçeriği

Başlık: **"Şablon Önizleme ve Uygulama"**

### Çakışma Yoksa

- Yeşil alert: `"Çakışma bulunamadı."` ✅
- Doğrudan **"Uygula"** butonuyla devam edilebilir

### Çakışma Varsa

- Sarı uyarı: `"N çakışma bulundu"` ⚠️
- Çakışan seferlerin listesi scrollable alan içinde:
  - 📅 Tarih/saat – 🚍 Plaka
  - Güzergah adı
- **Çakışma Davranışı Seçimi** (RadioGroup):

| Seçenek | Açıklama |
|---------|----------|
| **Var olanları atla** (varsayılan) | Çakışan saatleri geçer, yeni olanlari ekler |
| **Üzerine yaz** | Çakışan seferlerin üzerine yazar |

### "Uygula" Butonu Tıklandığında

1. API çağrısı: `POST /jobs/apply-template`
2. Payload:
   - `template_id`, `start_date`, `end_date`, `days_of_week`, `conflict` (skip/overwrite)
3. Sonuç beklenir

### Uygulama Sonuçları

Başarılıysa yeşil alert: `"İşlem tamamlandı 🎉"`

#### "Atla" Modu Seçiliyse:

| Bilgi | Gösterim |
|-------|----------|
| Yeni eklenen seferler | `"Yeni eklenen seferler: N"` |
| Atlanan seferler | `"Atlanan seferler: N"` (mavi renk) |

#### "Üzerine Yaz" Modu Seçiliyse:

| Bilgi | Gösterim |
|-------|----------|
| Üzerine yazılan seferler | `"Üzerine yazılan sefer sayısı: N"` (kırmızı renk) |

#### Detaylı Sefer Listesi

Uygulanan seferler scrollable alanda gösterilir:
- 📅 Tarih/saat – 🚍 Plaka
- Güzergah adı

### Butonlar

| Durum | Butonlar |
|-------|----------|
| Uygulama öncesi | **İptal** + **Uygula** |
| Uygulama sürerken | **Uygulanıyor…** (devre dışı) |
| Uygulama sonrası | **Kapat** (sayfayı yeniler) |

> **Not:** "Kapat" butonu tıklandığında `window.location.reload()` ile sayfa tamamen yenilenir.

---

## 12. Validasyon Kuralları Özeti

### Yeni Sefer Ekleme (AddJobDialog)

| # | Alan | Kural | Mesaj |
|---|------|-------|-------|
| 1 | Saat | Zorunlu | `"Lütfen saat seçin."` |
| 2 | Ring Tipi | Zorunlu | `"Lütfen ring tipi seçin."` |
| 3 | Plaka | Zorunlu | `"Lütfen plaka seçin."` |
| 4 | Rota | Zorunlu | `"Lütfen bir rota seçin."` |
| 5 | Tarih | Geçmiş gün olamaz | `"Geçmiş günlere sefer eklenemez veya güncellenemez."` |
| 6 | Saat | Bugünse geçmiş saat olamaz | `"Geçmiş saate sefer ekleyemezsiniz."` |
| 7 | Plaka+Saat | Çakışma kontrolü (API) | `"Bu plaka için HH:mm saatinde zaten bir sefer var!"` |

### Şablon Uygulama (ApplyTemplateDialog)

| # | Kural | Mesaj |
|---|-------|-------|
| 1 | Geçmiş tarih | `"Geçmiş tarihlere sefer ekleme yapamazsınız!!"` |
| 2 | Başlangıç > Bitiş | Devam butonu devre dışı kalır |
| 3 | Gün seçilmemiş | Devam butonu devre dışı kalır |

### Toplu Düzenleme (JobsForm - Inline Edit)

| # | Alan | Kural | Mesaj |
|---|------|-------|-------|
| 1 | Genel | API hata mesajı | Backend'den dönen hata mesajı gösterilir |

---

## 13. Bildirimler ve Geri Bildirimler

### Yükleme Göstergeleri

| Durum | Gösterim |
|-------|----------|
| Seferler yüklenirken | Merkezi dönen ikon + `"Yükleniyor..."` yazısı |
| Kayıt sırasında (JobsForm) | Tam ekran backdrop + dönen ikon |
| Şablon uygulanırken | Buton metni: `"Uygulanıyor…"` |
| Çakışma kontrolü | Buton metni: `"Kontrol ediliyor…"` |

### Toast Mesajları (JobsForm)

| Mesaj | Tip |
|-------|-----|
| `"Sefer güncellendi."` | ✅ Başarı |
| Backend hata mesajı | ❌ Hata |

### Alert Mesajları (EditJobDialog)

| Mesaj | Tip | Süre |
|-------|-----|------|
| `"✅ Güncelleme başarılı"` | Başarı | 2 saniye |
| `"❌ Güncelleme başarısız"` | Hata | Manuel kapatma |

### Hata Durumları

| Hata | Gösterim |
|------|----------|
| Ring tipleri alınamadı | Kırmızı metin: `"Ring tipleri alınamadı."` |
| Sefer verileri alınamadı | Kırmızı metin: `"Sefer verileri alınamadı."` |

---

## 14. Klavye Kısayolları

### Inline Edit (JobsForm içindeki JobRow)

| Tuş | Eylem |
|-----|-------|
| **Enter** | Düzenlemeyi kaydeder |
| **Escape** | Düzenlemeyi iptal eder |

---

## 15. Bileşen Haritası

```
Plans/page.tsx (Ana Sayfa)
├── CalendarShell.tsx (FullCalendar sarmalayıcı)
│   ├── Aylık görünüm (dayGridMonth)
│   │   └── Şablon gruplaması (calendarGrouping.ts)
│   ├── Günlük görünüm (timeGridDay)
│   └── Liste görünümü (listDay)
├── Legend.tsx (Aktif Ringler paneli)
├── AddJobDialog.tsx (Yeni sefer ekleme diyaloğu)
│   ├── Saat, Ring Tipi, Rota (otomatik), Plaka alanları
│   ├── Çakışma kontrolü (POST /jobs/check-conflict)
│   └── Validasyonlar
├── EditJobDialog.tsx (Tekil sefer düzenleme diyaloğu)
│   ├── Saat, Type, Rota, Plaka — anında kayıt
│   └── Silme onay diyaloğu
├── JobsForm.tsx (Toplu sefer düzenleme paneli)
│   ├── Sefer arama
│   ├── Accordion grupları (ring tipine göre)
│   │   └── JobRow.tsx (Her satır)
│   │       ├── Normal görünüm
│   │       ├── Inline edit görünümü
│   │       ├── RingLabel (renkli etiket)
│   │       └── DeviceLabel (plaka etiketi)
│   ├── ConfirmDialog.tsx (Tekil/Toplu silme onay)
│   ├── Toast bildirimleri
│   └── Kayıt backdrop
├── ApplyTemplateToPlans.tsx (Şablon seçim diyaloğu)
│   ├── Şablon dropdown
│   ├── Tarih aralığı
│   ├── Gün seçimi (hızlı seçim butonları ile)
│   └── Çakışma kontrolü
└── PreviewTemplateDialog.tsx (Önizleme ve uygulama)
    ├── Çakışma listesi
    ├── Atla / Üzerine Yaz seçimi
    └── Uygulama sonuç gösterimi
```

---

## Tam Kullanıcı Senaryoları

### Senaryo 1: Takvimden Tekil Sefer Ekleme

1. Kullanıcı `/Plans` sayfasına gider
2. Aylık görünümde bir güne tıklar → Günlük görünüme geçer
3. Günlük görünümde bir saat dilimine tıklar
4. **"Yeni Sefer Ekle"** diyaloğu açılır
5. Saat seçer, ring tipi seçer, rota otomatik dolar, plaka seçer
6. **"Kaydet"** butonuna basar
7. Çakışma kontrolü yapılır → sorun yoksa kaydedilir
8. Diyalog kapanır, takvimde yeni sefer görünür

### Senaryo 2: Şablonu Takvime Uygulama

1. **"Şablondan Sefer Ekle"** butonuna basar
2. Şablon seçer, tarih aralığı belirler, günleri seçer
3. **"Devam"** butonuna basar → çakışma kontrolü yapılır
4. Önizleme diyaloğu açılır, çakışmalar gösterilir
5. "Var olanları atla" veya "Üzerine yaz" seçer
6. **"Uygula"** butonuna basar
7. Sonuç gösterilir: N eklenen, M atlanan
8. **"Kapat"** butonuna basar → sayfa yenilenir

### Senaryo 3: Mevcut Seferi Düzenleme

1. Takvimde bir sefere tıklar → **EditJobDialog** açılır
2. Saat, tip veya plaka değiştirir → anında kaydedilir
3. Yeşil alert: `"✅ Güncelleme başarılı"`
4. Diyaloğu kapatır

---

*Bu doküman, Planlar sayfasının tüm kullanıcı etkileşimlerini, takvim davranışlarını, diyalog akışlarını, validasyon kurallarını ve geri bildirim mekanizmalarını kapsamaktadır.*
