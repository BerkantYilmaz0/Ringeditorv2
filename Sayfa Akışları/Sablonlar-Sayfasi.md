# Şablonlar Sayfası — Kullanıcı Akışı Dokümantasyonu

> **Sayfa URL:** `/Templates`  
> **Amaç:** Sefer şablonlarını oluşturma, düzenleme, silme ve şablonlara sefer ekleme/yönetme işlemlerini gerçekleştirme.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Şablon Listesi (Ana Tablo)](#2-şablon-listesi-ana-tablo)
3. [Şablon Arama](#3-şablon-arama)
4. [Yeni Şablon Oluşturma](#4-yeni-şablon-oluşturma)
5. [Şablon Düzenleme](#5-şablon-düzenleme)
6. [Şablon Silme](#6-şablon-silme)
7. [Şablona Sefer Ekleme (TemplateJobsForm)](#7-şablona-sefer-ekleme)
8. [Sefer Listesi — Görünüm ve Gruplama](#8-sefer-listesi--görünüm-ve-gruplama)
9. [Sefer Arama](#9-sefer-arama)
10. [Inline Sefer Düzenleme](#10-inline-sefer-düzenleme)
11. [Tekil Sefer Silme](#11-tekil-sefer-silme)
12. [Toplu Sefer Seçme ve Silme](#12-toplu-sefer-seçme-ve-silme)
13. [Toplu Sefer Ekleme (Bulk Dialog)](#13-toplu-sefer-ekleme-bulk-dialog)
14. [Seferleri Kaydetme](#14-seferleri-kaydetme)
15. [Validasyon Kuralları Özeti](#15-validasyon-kuralları-özeti)
16. [Bildirimler ve Geri Bildirimler](#16-bildirimler-ve-geri-bildirimler)
17. [Klavye Kısayolları](#17-klavye-kısayolları)
18. [Sayfalama (Pagination)](#18-sayfalama-pagination)
19. [Bileşen Haritası](#19-bileşen-haritası)

---

## 1. Genel Bakış

Şablonlar sayfası iki ana katmandan oluşur:

| Katman | Açıklama |
|--------|----------|
| **Şablon Yönetimi** | Şablonları listeleme, oluşturma, düzenleme, silme |
| **Sefer Yönetimi** | Bir şablona ait seferleri ekleme, düzenleme, toplu ekleme, silme |

Kullanıcı önce bir şablon oluşturur (veya mevcut şablonu düzenler), ardından o şablona seferler ekler. Her sefer bir **saat**, **ring tipi**, **rota** ve **plaka (araç)** bilgisi içerir.

---

## 2. Şablon Listesi (Ana Tablo)

Sayfa açıldığında backend'den tüm şablonlar çekilir ve tablo halinde gösterilir.

### Tablo Sütunları

| Sütun | Genişlik | Açıklama |
|-------|----------|----------|
| **ID** | %7 | Şablonun benzersiz numarası |
| **Şablon Adı** | %30 | Şablonun kısa adı |
| **Açıklama** | %45 | Şablonun açıklama metni |
| **İşlemler** | %11 | Düzenle ve Sil butonları |

### İşlem Butonları (Her Satırda)

| Buton | İkon | Renk | Eylem |
|-------|------|------|-------|
| **Düzenle** | 🖊️ Kalem ikonu | Mavi (primary) | Şablon düzenleme formunu açar |
| **Sil** | 🗑️ Çöp kutusu ikonu | Kırmızı (error) | Onay alarak şablonu siler |

### Tablo Arka Plan Renkleri
- **Başlık satırı:** `#f5f5f5` (açık gri)
- **Veri satırları:** `#fbfbfb` (çok açık gri)

---

## 3. Şablon Arama

Tablonun üst kısmında bir arama alanı bulunur.

- **Placeholder:** `"Şablon ara…"`
- **Boyut:** Küçük (`small`)
- **Çalışma Mantığı:** Kullanıcı yazdıkça (anlık filtreleme):
  - Şablon adında arama yapar (büyük/küçük harf duyarsız)
  - Açıklama alanında arama yapar (büyük/küçük harf duyarsız)
- Eşleşmeyen şablonlar tablodan anlık olarak gizlenir
- Sayfalama filtrelenmiş sonuçlara göre güncellenir

---

## 4. Yeni Şablon Oluşturma

### Akış

1. Kullanıcı **"Yeni Şablon Ekle"** butonuna basar
2. Ekranın ortasında modal (popup) form açılır
3. Kullanıcı formu doldurur
4. **"Kaydet ve Devam Et"** butonuna basar
5. Başarılıysa yeşil başarı mesajı gösterilir
6. 300ms sonra modal kapanır ve **Sefer Ekleme Formu** otomatik açılır
7. Şablon listesi arka planda güncellenir

### Form Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Şablon Adı** | Metin girişi | ✅ Evet | Şablonun adı |
| **Açıklama** | Çok satırlı metin | ❌ Hayır | Şablon hakkında not |

### Validasyonlar (Yeni Şablon)

| Kural | Hata Mesajı | Tetiklenme Zamanı |
|-------|------------|-------------------|
| Şablon adı boş bırakılamaz | `"Şablon adı boş olamaz."` | Kaydet butonuna basıldığında |
| Şablon adı 2 karakterden kısa olamaz | `"Şablon adı 2-64 karakter arasında olmalıdır."` | Kaydet butonuna basıldığında |
| Şablon adı 64 karakterden uzun olamaz | `"Şablon adı 2-64 karakter arasında olmalıdır."` | Kaydet butonuna basıldığında |
| Açıklama 128 karakterden uzun olamaz | Alanın altında kırmızı uyarı: `"Açıklama en fazla 128 karakter olmalıdır."` | Anlık (yazarken) — alan kırmızıya döner |

### Butonlar

| Buton | Konum | Davranış |
|-------|-------|----------|
| **Kaydet ve Devam Et** | Formun sağ alt köşesi | Şablonu kaydeder, başarılı olursa seferlere geçer |
| **✕ (Kapat)** | Formun sağ üst köşesi | Formu kaydedmeden kapatır |

### Başarı / Hata Durumları

- ✅ **Başarı:** Yeşil alert: `"Şablon eklendi."` → 300ms sonra form kapanır, sefer formu açılır
- ❌ **Hata:** Kırmızı alert: `"Bir hata oluştu."` (API hatası durumunda)

---

## 5. Şablon Düzenleme

### Akış

1. Kullanıcı şablon satırındaki **kalem ikonuna** (🖊️) tıklar
2. Aynı modal form açılır, bu sefer mevcut verilerle dolu gelir
3. Başlık: **"Şablonu Düzenle"** olarak değişir
4. Kullanıcı istediği alanları değiştirir
5. **"Kaydet ve Devam Et"** butonuna basar
6. Eğer herhangi bir değişiklik yapıldıysa API'ye güncelleme gönderilir
7. Değişiklik yoksa API çağrısı yapılmaz ama yine de sefer düzenleme formuna geçilir
8. Başarılıysa yeşil alert: `"Şablon güncellendi."` → 300ms sonra kapanır
9. **Sefer Düzenleme Formu** otomatik açılır (mevcut seferlerle birlikte)

### Değişiklik Algılama

Sistem, ad veya açıklamanın değişip değişmediğini kontrol eder:
- **Değişiklik varsa:** `PUT /templates/{id}` API çağrısı yapılır
- **Değişiklik yoksa:** API çağrısı atlanır, doğrudan devam edilir

---

## 6. Şablon Silme

### Akış

1. Kullanıcı şablon satırındaki **çöp kutusu ikonuna** (🗑️) tıklar
2. Tarayıcının yerel onay diyaloğu (confirm) gösterilir
3. Mesaj: `"Bu şablonu silmek istediğinize emin misiniz?"`
4. **Tamam:** Şablon silinir, tablo güncellenir
5. **İptal:** Hiçbir şey olmaz

> ⚠️ Şablon silindiğinde o şablona ait tüm seferler de silinebilir (backend davranışına bağlı).

---

## 7. Şablona Sefer Ekleme

Şablon oluşturulduktan veya düzenlendikten sonra açılan büyük modal paneldir.

### Açılma Koşulları

| Durum | Modal Başlığı | Davranış |
|-------|---------------|----------|
| Yeni şablon oluşturuldu | `"Şablona Sefer Ekle"` | Boş liste, yeni seferler eklenir |
| Mevcut şablon düzenlendi | `"Seferleri Düzenle"` | Mevcut seferler backend'den yüklenir |

### Panel Özellikleri
- Ekranın %75 genişliğinde, %85 yüksekliğinde
- Ekranın ortasından hafif sağa kaydırılmış (left: 55%)
- Scrollable (kaydırılabilir) alan
- Sağ üst köşede **✕ kapat** butonu

### Sefer Ekleme Alanı (Üst Kısım)

Üst kısımda yeni sefer eklemek için form alanları bulunur:

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Saat** | Saat seçici (`time`) | ✅ | Seferin kalkış saati (HH:mm) |
| **Type** | Dropdown (select) | ✅ | Ring tipi seçimi — her seçenek renkli nokta ile gösterilir |
| **Rota** | Salt okunur metin | Otomatik | Seçilen ring tipine göre otomatik dolar |
| **Plaka** | Dropdown (select) | ✅ | Araç/plaka seçimi |

### Rota Otomatik Seçimi

- Ring tipi seçildiğinde, o ring tipine ait ilk rota otomatik olarak atanır
- Eşleşen rota yoksa `"—"` gösterilir
- Kullanıcı rotayı manuel değiştiremez (salt okunur)

### Sefer Ekleme Butonu

| Buton | Metin | Eylem |
|-------|-------|-------|
| **Ekle** | `"Ekle"` | Sefer ekleme validasyonlarını çalıştırır, geçerliyse listeye ekler |

### Sefer Ekleme Validasyonları

| Kural | Mesaj | Tip |
|-------|-------|-----|
| Saat seçilmedi | `"Saat seçmelisiniz."` | ❌ Hata |
| Ring tipi seçilmedi | `"Ring tipi seçmelisiniz."` | ❌ Hata |
| Plaka seçilmedi | `"Plaka seçmelisiniz."` | ❌ Hata |
| Aynı plaka + aynı saat zaten var | `"Girdiğiniz plakanın bu saatte seferi mevcut"` | ⚠️ Uyarı |

> Sefer başarıyla eklendiğinde form alanları sıfırlanır (saat, ring tipi, plaka temizlenir).

---

## 8. Sefer Listesi — Görünüm ve Gruplama

Eklenen seferler **ring tipine göre gruplandırılarak** accordion (akordiyon) yapısında gösterilir.

### Gruplama Mantığı

1. Tüm seferler önce **saate göre artan** sırada sıralanır
2. Ring tipine göre gruplandırılır
3. Gruplar **ring adına göre** alfabetik sıralanır

### Accordion (Grup) Görünümü

Her grup bir accordion bileşeni olarak gösterilir:

| Öğe | Açıklama |
|-----|----------|
| **Renk çubuğu** | Ring tipinin renginde 6px genişliğinde dikey çubuk |
| **Ring Adı** | Kalın yazıyla grubun ring tipi adı |
| **Sefer Sayısı** | Chip (etiket) içinde sefer adedi, ör: `"5 Sefer"` |
| **Aç/Kapa oku** | Accordionu genişletme/daraltma ikonu |

Tüm accordionlar varsayılan olarak **açık** gelir.

### Sefer Tablosu (Grup İçi)

Her accordion içinde küçük boyutlu (`small`) bir tablo yer alır:

| Sütun | Genişlik | Açıklama |
|-------|----------|----------|
| **☐ (Checkbox)** | — | Sefer seçme kutusu |
| **Saat** | %10 | Seferin saati (HH:mm formatında) |
| **Ring** | %15 | Ring tipi (renkli nokta + ad) |
| **Rota** | %30 | Güzergah adı veya `"—"` |
| **Plaka** | %20 | Aracın plaka bilgisi |
| **İşlemler** | sağa hizalı | Düzenle, Sil, Toplu Ekle butonları |

### Satır İşlem Butonları

| Buton | İkon | Renk | Görünürlük | Eylem |
|-------|------|------|------------|-------|
| **Düzenle** | 🖊️ Kalem | Mavi | Her zaman | Satırı inline edit moduna alır |
| **Sil** | 🗑️ Çöp kutusu | Kırmızı | Yalnızca sefer seçiliyse (checkbox işaretli) | Tekil silme diyaloğunu açar |
| **Toplu Ekle** | 📅 Takvim+ | Mor (secondary) | Her zaman (ama kaydedilmemiş seferde devre dışı) | Toplu ekleme diyaloğunu açar |

> **Not:** "Toplu Ekle" butonu, seferin bir ID'si yoksa (henüz kaydedilmemişse) devre dışıdır. Tooltip: `"Önce bu seferi kaydedin"`.

### Boş Durum Mesajları

| Durum | Mesaj | Tip |
|-------|-------|-----|
| Hiç sefer yok | `"Henüz bu şablona sefer eklenmedi."` | ℹ️ Bilgi |
| Arama sonucu boş | `"Arama kriterine uygun sefer bulunamadı."` | ⚠️ Uyarı |

---

## 9. Sefer Arama

Sefer tablosunun üstünde arama alanı bulunur.

- **Placeholder:** `"Sefer ara (saat / ring / plaka)..."`
- **Boyut:** Küçük (`small`), minimum 240px genişlik
- **Arama Alanları:**
  - Saat (HH:mm)
  - Ring tipi adı
  - Plaka
- **Çalışma:** Anlık filtreleme, büyük/küçük harf duyarsız

---

## 10. Inline Sefer Düzenleme

Sefer listesinde satıra tıklanarak veya kalem ikonuna basılarak inline düzenleme modu aktifleşir.

### Aktifleştirme Yolları

1. **Satıra tıklama:** Satırın herhangi bir yerine tıklanır (buton, checkbox, input alanları hariç)
2. **Kalem ikonuna tıklama:** Satırdaki düzenle butonuna tıklanır

### Inline Edit Modunda Görünüm

Satır düzenleme moduna geçtiğinde:
- Satır arka planı `action.hover` rengine döner
- Metinler düzenlenebilir alanlara dönüşür:

| Alan | Bileşen | Açıklama |
|------|---------|----------|
| **Saat** | Time input | Saat değiştirilebilir |
| **Ring** | Autocomplete (arama yapılabilir dropdown) | Ring tipi değiştirilebilir, aranabilir |
| **Rota** | Salt okunur TextField | Ring tipine göre otomatik güncellenir |
| **Plaka** | Autocomplete (arama yapılabilir dropdown) | Plaka değiştirilebilir, aranabilir |

### Ring Değiştirildiğinde

Ring tipi değiştirildiğinde rota otomatik güncellenir:
- Yeni ring tipine ait ilk rota atanır
- Eşleşen rota yoksa `null` olur

### İşlem Butonları (Edit Modda)

| Buton | İkon | Renk | Eylem |
|-------|------|------|-------|
| **Kaydet** | ✓ (Check) | Yeşil (success) | Değişiklikleri uygular |
| **İptal** | ✕ (X) | Gri (inherit) | Değişiklikleri geri alır |

### Inline Edit Validasyonları

| Kural | Mesaj | Tip |
|-------|-------|-----|
| Saat boş | `"Saat seçmelisiniz."` | ❌ Hata |
| Ring tipi boş | `"Ring tipi seçmelisiniz."` | ❌ Hata |
| Plaka boş | `"Plaka seçmelisiniz."` | ❌ Hata |
| Aynı plaka + aynı saat başka bir seferde var | `"Girdiğiniz plakanın bu saatte seferi mevcut"` | ⚠️ Uyarı |

> Çakışma kontrolü yapılırken düzenlenen satırın kendisi hariç tutulur.

---

## 11. Tekil Sefer Silme

### Akış

1. Kullanıcı seferin **checkbox'ını** işaretler
2. İşaretlendiğinde satırda **çöp kutusu ikonu** (🗑️) görünür olur
3. Çöp kutusu ikonuna tıklar
4. **Onay diyaloğu** açılır:
   - Başlık: `"Seferi Sil"`
   - Mesaj: `"Bu seferi silmek istediğinize emin misiniz?"`
5. İki buton:
   - **İptal:** Diyaloğu kapatır
   - **Sil** (kırmızı): Seferi siler

### Silme Davranışı

- Sefer kaydedilmişse (ID varsa): API'de silinir (`DELETE /template-jobs/{id}`)
- Sefer kaydedilmemişse (yeni eklenmişse): Sadece listeden kaldırılır

---

## 12. Toplu Sefer Seçme ve Silme

### Seçme İşlemleri

| Yol | Açıklama |
|-----|----------|
| **Tek tek seçme** | Her satırın solundaki checkbox'ı işaretleme |
| **Tümünü seç** | Tablonun üstündeki `"Tümünü Seç"` checkbox'ı |

### Tümünü Seç Checkbox Durumları

| Durum | Görünüm |
|-------|---------|
| Hiçbiri seçili değil | Boş checkbox |
| Bir kısmı seçili | Tire işaretli (indeterminate) checkbox |
| Tamamı seçili | Dolu yeşil checkbox |

### Toplu Silme

1. Bir veya daha fazla sefer seçilir
2. **"Seçilenleri Sil (N)"** butonu aktif olur (N = seçili sefer sayısı)
3. Butona tıklanır
4. **Onay diyaloğu** açılır:
   - Başlık: `"Toplu Silme Onayı"`
   - Mesaj: `"Seçtiğiniz N sefer silinecek. Emin misiniz?"` (N kalın yazıyla)
5. İki buton:
   - **İptal:** Diyaloğu kapatır
   - **Sil** (kırmızı): Seçili tüm seferleri siler

### Toplu Silme Davranışı

- ID'si olan seferler API'den silinir (her biri için ayrı `DELETE` çağrısı, paralel)
- ID'si olmayanlar (yeni eklenmiş) sadece listeden kaldırılır
- Buton seçili sefer yokken devre dışı (`disabled`)

---

## 13. Toplu Sefer Ekleme (Bulk Dialog)

Mevcut bir seferi baz alarak belirli bir zaman aralığında aynı ring tipi ve plaka ile birden fazla sefer oluşturma özelliğidir.

### Açılma

1. Kaydedilmiş bir seferin satırında **📅 Takvim+** ikonuna tıklanır
2. **"Birden Fazla Sefer Ekle"** diyaloğu açılır

> Kaydedilmemiş seferlerde bu buton devre dışıdır. Tooltip: `"Önce bu seferi kaydedin"`

### Diyalog İçeriği

#### Baz Sefer Bilgileri (Salt Okunur)

Diyalog üst kısmında baz alınan seferin bilgileri gösterilir:

| Bilgi | Açıklama |
|-------|----------|
| **Ring** | Ring tipi (renkli etiketle) |
| **Plaka** | Araç plakası |
| **Güzergah** | Rota adı veya `"—"` |

#### Form Alanları

| Alan | Tip | Varsayılan | Açıklama |
|------|-----|-----------|----------|
| **Başlangıç Saati** | Saat seçici | Baz seferin saati (kilitli) | Otomatik kaydırılabilir |
| **Bitiş Saati** | Saat seçici | Boş | Son seferin saati |
| **Sıklık (dakika)** | Sayı girişi | 20 | Seferler arası dakika farkı |

#### Başlangıç Saati Otomatik Kaydırma

Eğer baz seferin saatinde zaten aynı ring + plaka kombinasyonuyla bir sefer varsa:
- Başlangıç saati otomatik olarak bir interval (varsayılan 20dk) ileri kaydırılır
- Uyarı mesajı: `"⚠️ Seçili sefer zaten var, başlangıç otomatik kaydırıldı"`

Başlangıç saati **kilitlidir** — kullanıcı değiştiremez.

### Butonlar

| Buton | Davranış |
|-------|----------|
| **Önizleme** | Eklenecek saatleri hesaplar ve gösterir (API çağrısı yapmaz) |
| **Kaydet** | Önizleme yapılmışsa ve çakışma yoksa seferleri kaydeder |
| **Kapat** | Diyaloğu kapatır |

### Önizleme İşlemi

1. Kullanıcı saatleri ve sıklığı doldurur
2. **"Önizleme"** butonuna basar
3. Sistem hesaplar:
   - Başlangıçtan bitişe, belirtilen sıklıkla sefer saatleri üretir
   - Baz seferin saatini hariç tutar
   - Mevcut aynı ring+plaka seferlerinin saatlerini çakışma olarak tespit eder
4. Sonuç:
   - Çakışmayanlar **mavi chip'ler** halinde gösterilir
   - Toplam üretilecek sefer sayısı bilgi alanında gösterilir
   - Çakışanlar uyarı mesajıyla gösterilir

### Toplu Ekleme Validasyonları

| Kural | Mesaj | Tip |
|-------|-------|-----|
| Saat alanları boş | `"Saat alanları girilmesi zorunludur."` | ❌ Hata |
| Sıklık 1-180 dakika dışında | `"Sıklık 1-180 dakika arasında olmalıdır."` | ❌ Hata |
| Başlangıç ≥ Bitiş | `"Başlangıç saati bitiş saatinden büyük/eşit olamaz."` | ❌ Hata |
| Sefer ID'si yok | `"Toplu ekleme için önce bu seferi kaydedin (ID yok)."` | ❌ Hata |
| Tüm saatler çakışıyor | `"Bu plakanın şu saat(ler)de seferi mevcut: HH:mm, HH:mm"` | ❌ Hata |
| Eklenecek sefer yok | `"Eklenecek yeni sefer yok (tüm saatler çakışıyor)."` | ❌ Hata |
| 100'den fazla sefer | `"Tek seferde en fazla 100 sefer eklenebilir. Şu an: N sefer üretilecek."` | ❌ Hata |
| Kısmi çakışma | `"N sefer çakışıyor, atlanacak: HH:mm, HH:mm"` | ⚠️ Uyarı |

### Sıklık Sınırları

| Parametre | Değer |
|-----------|-------|
| Minimum sıklık | 1 dakika |
| Maksimum sıklık | 180 dakika |
| Varsayılan sıklık | 20 dakika |
| Önerilen aralık | 20-30 dakika |
| Adım değeri | 5 dakika |
| Maksimum sefer sayısı | 100 (tek seferde) |

### Kaydetme İşlemi

1. Önizleme başarılıysa **"Kaydet"** butonu aktif olur
2. API çağrısı: `POST /template-jobs/bulk`
3. Backend cevabı:
   - `created`: Başarıyla oluşturulan saatler
   - `skipped`: Atlanan saatler
   - `insertedCount`: Eklenen sefer sayısı
4. Başarılıysa:
   - Toast mesajı: `"N sefer eklendi."`
   - Sefer listesi güncellenir
   - Diyalog kapanır
5. Hata durumunda:
   - HTTP 400: `"Geçersiz veri: ..."`
   - HTTP 409: `"Çakışan sefer(ler) var: ..."`
   - HTTP 422: `"Validasyon hatası: ..."`
   - HTTP 500: `"Sunucu hatası. Lütfen tekrar deneyin."`

---

## 14. Seferleri Kaydetme

Tüm seferler eklendikten/düzenlendikten sonra **"Kaydet ve Bitir"** butonuna basılarak seferler kalıcı hale getirilir.

### Kaydet ve Bitir Butonu

- Konum: Panelin en alt kısmı, sağ tarafa hizalı
- Ayrılmış bordür çizgisi üstünde
- Sefer yokken **devre dışı**
- Kayıt devam ederken **devre dışı**

### Kaydetme Senaryoları

#### Yeni Şablon (İlk Kayıt)

- Tüm seferler tek bir `POST /template-jobs` çağrısıyla toplu gönderilir
- Başarı mesajı: `"Seferler eklendi."`

#### Mevcut Şablon (Düzenleme)

- **Mevcut seferler** (ID'si olanlar): Her biri ayrı `PUT /template-jobs/{id}` ile güncellenir
- **Yeni eklenen seferler** (ID'si olmayanlar): Toplu `POST /template-jobs` ile eklenir
- Güncelleme ve ekleme paralel çalışır
- Başarı mesajı: `"Seferler kaydedildi."`

### Kayıt İlerleme Göstergesi

Kayıt sırasında tam ekran bir **backdrop** (karartma) gösterilir:
- Dönen loading ikonu
- İlerleme çubuğu: `"Kayıt Ediliyor: 3 / 10"` şeklinde
- Beyaz ilerleme barı (yüzdelik)

### Kayıt Sonrası

- Başarılı: 1.5 saniye sonra panel otomatik kapanır
- Hatalı: Toast mesajı: `"Kayıt işlemi başarısız oldu."` — panel açık kalır

---

## 15. Validasyon Kuralları Özeti

### Şablon Validasyonları

| # | Alan | Kural | Mesaj |
|---|------|-------|-------|
| 1 | Şablon Adı | Boş olamaz | `"Şablon adı boş olamaz."` |
| 2 | Şablon Adı | Min 2 karakter | `"Şablon adı 2-64 karakter arasında olmalıdır."` |
| 3 | Şablon Adı | Max 64 karakter | `"Şablon adı 2-64 karakter arasında olmalıdır."` |
| 4 | Açıklama | Max 128 karakter | `"Açıklama en fazla 128 karakter olmalıdır."` |

### Sefer Validasyonları (Ekleme & Inline Edit)

| # | Alan | Kural | Mesaj | Tip |
|---|------|-------|-------|-----|
| 1 | Saat | Zorunlu | `"Saat seçmelisiniz."` | Hata |
| 2 | Ring Tipi | Zorunlu | `"Ring tipi seçmelisiniz."` | Hata |
| 3 | Plaka | Zorunlu | `"Plaka seçmelisiniz."` | Hata |
| 4 | Plaka+Saat | Benzersiz olmalı | `"Girdiğiniz plakanın bu saatte seferi mevcut"` | Uyarı |

### Toplu Ekleme Validasyonları

| # | Alan | Kural | Mesaj |
|---|------|-------|-------|
| 1 | Saatler | Zorunlu | `"Saat alanları girilmesi zorunludur."` |
| 2 | Sıklık | 1-180 arası | `"Sıklık 1-180 dakika arasında olmalıdır."` |
| 3 | Saat mantığı | Başlangıç < Bitiş | `"Başlangıç saati bitiş saatinden büyük/eşit olamaz."` |
| 4 | Sefer ID | Gerekli | `"Toplu ekleme için önce bu seferi kaydedin (ID yok)."` |
| 5 | Limit | Max 100 sefer | `"Tek seferde en fazla 100 sefer eklenebilir."` |

---

## 16. Bildirimler ve Geri Bildirimler

### Toast (Snackbar) Mesajları

Ekranın üst ortasında, 3.5 saniye süreyle gösterilir.

| Mesaj | Renk/Tip | Tetikleyici |
|-------|----------|-------------|
| `"Seferler eklendi."` | ✅ Yeşil (success) | Yeni şablonda kayıt başarılı |
| `"Seferler kaydedildi."` | ✅ Yeşil (success) | Düzenlemede kayıt başarılı |
| `"N sefer eklendi."` | ✅ Yeşil (success) | Toplu ekleme başarılı |
| `"Eklenecek yeni sefer yok."` | ℹ️ Mavi (info) | Toplu ekleme boş sonuç |
| `"Saat seçmelisiniz."` | ❌ Kırmızı (error) | Validasyon hatası |
| `"Ring tipi seçmelisiniz."` | ❌ Kırmızı (error) | Validasyon hatası |
| `"Plaka seçmelisiniz."` | ❌ Kırmızı (error) | Validasyon hatası |
| `"Girdiğiniz plakanın bu saatte seferi mevcut"` | ⚠️ Sarı (warning) | Çakışma |
| `"Kayıt işlemi başarısız oldu."` | ❌ Kırmızı (error) | API hatası |

### Alert Mesajları (Şablon Formunda)

| Mesaj | Renk | Durum |
|-------|------|-------|
| `"Şablon eklendi."` | ✅ Yeşil | Yeni şablon başarılı |
| `"Şablon güncellendi."` | ✅ Yeşil | Düzenleme başarılı |
| `"Şablon adı boş olamaz."` | ❌ Kırmızı | Validasyon |
| `"Şablon adı 2-64 karakter arasında olmalıdır."` | ❌ Kırmızı | Validasyon |
| `"Bir hata oluştu."` | ❌ Kırmızı | API hatası |

---

## 17. Klavye Kısayolları

Inline edit modundayken:

| Tuş | Eylem |
|-----|-------|
| **Enter** | Düzenlemeyi kaydeder |
| **Escape** | Düzenlemeyi iptal eder |

---

## 18. Sayfalama (Pagination)

Şablon listesi tablosunda sayfalama bulunur:

| Özellik | Değer |
|---------|-------|
| Varsayılan satır sayısı | 10 |
| Satır seçenekleri | 10, 15 |
| Etiket | `"Sayfa Satır Sayısı"` |
| Gösterim formatı | `"1-10 / 25"` şeklinde |

- Sayfa değiştirildiğinde tablo güncellenir
- Satır sayısı değiştirildiğinde sayfa 0'a (ilk sayfaya) döner
- Arama filtreleme aktifse sayfalama filtrelenmiş sonuçlara göre çalışır

> **Not:** Sefer tablosunda (TemplateJobsForm içi) sayfalama yoktur; seferler scroll ile gezilir.

---

## 19. Bileşen Haritası

```
Templates/page.tsx (Ana Sayfa)
├── Şablon Listesi (Tablo + Arama + Sayfalama)
├── TemplateForm.tsx (Modal — Şablon Oluştur/Düzenle)
│   ├── Şablon Adı + Açıklama alanları
│   └── Validasyon ve kaydetme
└── TemplateJobsForm/TemplateJobsForm.tsx (Modal — Sefer Yönetimi)
    ├── Sefer Ekleme Formu (Saat, Ring, Rota, Plaka)
    ├── Sefer Arama
    ├── Tümünü Seç + Seçilenleri Sil
    ├── Accordion Grupları (Ring tipine göre)
    │   └── TemplateJobRow.tsx (Her satır)
    │       ├── Normal görünüm (okuma modu)
    │       ├── Inline edit görünümü (düzenleme modu)
    │       ├── RingLabel.tsx (Renkli ring etiketi)
    │       └── DeviceLabel.tsx (Plaka etiketi)
    ├── ConfirmDialog.tsx (Tekil/Toplu silme onay diyaloğu)
    ├── BulkDialog.tsx (Toplu sefer ekleme diyaloğu)
    │   └── PreviewChips.tsx (Önizleme saat chip'leri)
    ├── Kaydet ve Bitir butonu
    ├── Kayıt ilerleme backdrop
    └── Toast bildirimleri (Snackbar)
```

---

## Tam Kullanıcı Senaryosu: Şablon Oluştur → Sefer Ekle → Kaydet

1. Kullanıcı `/Templates` sayfasına gider
2. **"Yeni Şablon Ekle"** butonuna basar
3. Şablon adını yazar (ör: "Hafta İçi Sabah"), opsiyonel olarak açıklama ekler
4. **"Kaydet ve Devam Et"** butonuna basar
5. Yeşil ✅ `"Şablon eklendi."` mesajı → 300ms sonra sefer ekleme formu açılır
6. Saat seçer, ring tipi seçer, rota otomatik dolar, plaka seçer
7. **"Ekle"** butonuna basar → sefer listeye eklenir
8. İsterse satıra tıklayarak inline edit yapabilir
9. İsterse kayıtlı bir seferin 📅 ikonuyla **toplu ekleme** yapabilir
10. Tüm seferler hazır olunca **"Kaydet ve Bitir"** butonuna basar
11. İlerleme çubuğu gösterilir
12. ✅ `"Seferler eklendi."` toast mesajı → 1.5 saniye sonra panel kapanır
13. Şablon listesinde yeni şablon görünür

---

*Bu doküman, Şablonlar sayfasının tüm kullanıcı etkileşimlerini, akışlarını, validasyon kurallarını ve geri bildirim mekanizmalarını kapsamaktadır.*
