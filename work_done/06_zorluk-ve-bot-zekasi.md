# 06: Zorluk Seviyeleri ve Bot Zekâsı (4. Adım)

- **Tarih:** 2026-10-28, 00:22
- **Durum:** ✅ Bitti

## Kullanıcının seçtikleri

| Konu | Seçim |
|---|---|
| Seviyeler | Kolay / Orta / Zor |
| Kime | Ayrı ayrı: **ARKADAŞ** ve **RAKİP** için iki satır |
| Görünüş | Aynı hap butonlar ama renkli: kolay yeşil, orta cyan, zor kırmızı |
| Santrada beklersen | 3 sn sonra bot arkadaş santrayı yapar (2v2/3v3). 1v1'de bekler. |

## Yapılanlar

### 1. Zorluk seviyeleri (`NB.DIFFICULTY`, config.js)

Her seviye bir aralık tanımlıyor. Her bot kendi değerini bu aralıktan rastgele çekiyor, böylece aynı seviyedeki botlar bile birbirinden biraz farklı oynuyor.

| Özellik | Kolay | Orta | Zor |
|---|---|---|---|
| Tepki süresi (şuttan sonra) | 0,23-0,4 sn | 0,12-0,27 sn | 0,05-0,13 sn |
| Topu görme sıklığı | 8-13 adımda bir | 4-9 | 2-4 |
| Şut sapması | büyük | orta | çok az |
| Kaleci tahmin hatası | 28-50 birim | 14-34 | 5-14 |
| Pas verme ihtimali | %10-30 | %25-60 | %45-75 |
| Santrada bekleme | 0,4-1 sn | 0,2-0,75 sn | 0,13-0,33 sn |
| Hareket gücü | %88 (biraz yavaş) | %100 | %100 |
| Akıllı şut | hiç | %40 | her zaman |
| Arkadaşlarla mesafe | dikkat etmez (kümelenir) | dikkat eder | dikkat eder |

Orta seviye, önceki botlarla neredeyse aynı.

### 2. Bot zekâsı

- **Akıllı şut:** Şut çekmeden önce kalenin 5 noktasına giden yollara bakıyor, rakiplerin en uzak olduğu köşeyi seçiyor. Her yol kapalıysa ve baskı yoksa şut yerine pas veriyor ya da sürmeye devam ediyor.
- **Arkadaşlarla mesafe:** Kanattaki bot takım arkadaşlarına 130 birimden fazla yaklaşmıyor, böylece kümelenme olmuyor.
- **Yana kaçma:** Gittiği yolda takım arkadaşı varsa yana kaçıyor, kafa kafaya itişmiyor.

### 3. Santrada 3 saniye kuralı

Santra senin takımındaysa ve 3 sn içinde topa dokunmazsan, en yakın bot arkadaşın santrayı yapıyor. 1v1'de arkadaşın olmadığı için oyun bekliyor.

### 4. 1v1 kalesi daraldı

1v1'de kale ağzı 140'tan **120**'ye indi. Botlar artık boş köşeyi seçtiği için 1v1'de gol sayısı çok artmıştı. Orta-orta 1v1'de gol sayısı 3 dakikada yaklaşık 19'dan yaklaşık 17'ye indi.

## Bulunan ve düzeltilen hatalar

1. **Santrada kilitlenme:** 2v2'de santrayı yapacak takımın iki botu aynı çizgide kafa kafaya itişip kalıyordu. Sebebi, rollerin önceki pozisyondan kalmasıydı: önde duran bot hâlâ "kaleci" sayılıp geri koşuyordu. Artık her santrada roller baştan dağıtılıyor, botlar ayrıca yollarındaki arkadaştan yana kaçıyor.
2. **Santrayı bot arkadaşın yapamaması (2v2):** Bot "son adam" savunmasına geçip geri çekiliyordu, çünkü rakip topa daha yakın görünüyordu. Oysa santrada rakip topa dokunamaz. Santra bizdeyken savunma davranışı kapatıldı.

## Testler

**Zorluk eşleşmeleri** (sadece botlar, her eşleşmede 10 maç × 3 dk, taraflar dönüşümlü):

| Mod | Zor - Kolay | Zor - Orta | Orta - Kolay | Orta - Orta |
|---|---|---|---|---|
| 1v1 | %90 · 8,4-3,1 | %90 · 8,4-5,6 | %90 · 10,6-6,6 | %30 · 8,4-9,0 |
| 2v2 | %100 · 8,4-0,8 | %90 · 6,1-2,3 | %90 · 5,0-1,9 | %40 · 2,9-3,7 |
| 3v3 | %100 · 6,7-0,8 | %100 · 4,9-1,4 | %90 · 3,1-0,7 | %30 · 1,5-2,3 |

(Yüzde: soldaki seviyenin kazanma oranı. Sonra ortalama skor.)

- Seviyeler net ayrışıyor, hiçbir maçta top takılmadı.
- **Taraf avantajı yok mu?** Orta-orta 30'ar maç: 1v1'de turuncu 15, mor 15. 2v2'de turuncu 15, mor 15. ✅
- **Santra 3 sn kuralı:** Sen hareketsizken 2v2'de bot 5,3 sn'de, 3v3'te 3,2 sn'de topa dokundu. 1v1'de bekledi ✅
- Chrome'da 1v1, 2v2 ve 3v3 maçlarında JavaScript hatası yok. Menü ekran görüntüsünde renkli haplar doğru ✅

## Bilinen eksikler

- 1v1 hâlâ gollü bir mod (orta-orta 3 dk'da ~17 gol). Kalecisiz birebir oyunun doğası, ama istenirse saha ya da kale boyutu daha da ayarlanabilir.
- Botlar insan oyuncuyla karşılaştırmalı test edilemedi (testler bot-bot). Gerçek his için kullanıcının oynaması gerekiyor.

## Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `js/config.js` | `NB.DIFFICULTY` (kolay/orta/zor), 1v1 kale ağzı 120 |
| `js/bots.js` | Botlar seviye alıyor, akıllı şut (`bestLane`), arkadaş mesafesi (`spread`), yana kaçma (`sidestepMates`), santrada 3 sn kuralı, santrada rol sıfırlama, kendi santramızda savunma kapalı |
| `js/main.js` | ARKADAŞ / RAKİP ayarları, botlara seviye verme, ayarların hatırlanması |
| `index.html` | ARKADAŞ ve RAKİP hap satırları |
| `style.css` | Seviye rengine göre parlayan haplar |
