# 05: Maç Akışı (3. Adım)

- **Tarih:** 2026-10-28, 00:07
- **Durum:** ✅ Bitti

## Kullanıcının seçtikleri

| Konu | Seçim |
|---|---|
| Süre ve bitiş | Menüden seçilsin: süre (2 / 3 / 5 dk) ve gol limiti (yok / 3 / 5 / 7). Hangisi önce dolarsa maç biter. |
| Beraberlik | Altın gol. Üstte "UZATMA" yazar, yanında Rocket League'deki gibi uzatmanın ne kadar sürdüğü sayar (+0:23). |
| Maç sonu ekranı | Sonuç ve istatistik: kazanan, skor, goller (kimden), şut, topa sahip olma %. Butonlar: Tekrar oyna / Menü. |
| Saat yeri | Skor tabelasının altında. Son 10 saniyede kırmızı yanıp söner. |
| Ayar seçimi | Neon hap butonlar (seçili olan cyan parlar) |
| Esc | Duraklatma paneli: Devam et / Yeniden başlat / Menü |
| Santra gösterimi | Orta çizgi ve yuvarlak santrayı kullanan takımın renginde parlar |

## Yapılanlar

### Santra kuralı

- Maçın ilk santrası rastgele bir takımda. Gol olunca **golü yiyen takım** santra yapar.
- Topa dokunulana kadar:
  - Herkes kendi yarı sahasında kalır.
  - Santrayı kullanmayan takım orta yuvarlağa giremez.
  - Santrayı kullanan takım orta yuvarlağın içinde karşı yarıya geçebilir.
- Sınırlar görünmez duvar gibi çalışıyor. Botlar santra rakipteyse duvara yüklenmiyor, yerinde bekliyor.
- Santra sırasında orta çizgi ve yuvarlak santrayı kullanan takımın renginde parlıyor, yuvarlağın içi hafifçe nabız gibi atıyor.

### Süre, gol limiti, uzatma

- Saat sadece oyun akarken işliyor, gol kutlamasında duruyor.
- Süre dolunca: skor farklıysa maç biter. Beraberse **UZATMA** başlar ve ilk gol (altın gol) maçı bitirir.
- Uzatmada saat sarı olur ve "UZATMA +0:23" gibi uzatmanın süresini sayar. Başlarken kısa bir "UZATMA · altın gol kazanır" bildirimi çıkar.
- Uzatmadaki golde ekranda "GOL!" yerine "ALTIN GOL!" yazar.
- Gol limiti seçildiyse limite ulaşan takım, gol kutlamasından sonra maçı kazanır.
- Ayarlar tarayıcıda hatırlanıyor (varsayılan: 3 dk, limit yok).

### Duraklatma (Esc)

- Oyun tamamen durur. Panelde Devam et / Yeniden başlat / Menü var. Esc'e tekrar basınca devam eder.
- "Yeniden başlat" aynı mod ve ayarlarla yeni maç açar. Takımın ve numaralar yine rastgele olur.
- Eski **R (sıfırla)** tuşu kaldırıldı, yerine panelde "Yeniden başlat" var.

### Maç sonu ekranı

- "★ MOR KAZANDI ★" (kazanan takımın renginde)
- Altında "Kazandın!" ya da "Kaybettin", altın golle bittiyse "· Altın gol"
- Büyük skor
- İstatistikler:
  - **Goller:** forma numarası ve gol sayısı, örneğin `10 (2) · 27 (1)`. Senin numaran yeşil. Kendi kalesine goller "k.k." olarak yazılıyor.
  - **Şut:** rakip kalenin ağzına (biraz pay ile) doğru giden vuruşlar
  - **Topa sahip:** topa en son dokunan takımın süresi, yüzde olarak
- Enter = tekrar oyna, Esc = menü

## Benim verdiğim küçük kararlar (değiştirilebilir)

- Uzatma saati ve bildirimi sarı (`#ffe14f`, stamina halkasının "azaldı" rengiyle aynı)
- Uzatmada "ALTIN GOL!" yazısı
- Maç sonunda "Kazandın! / Kaybettin" alt yazısı (takım rastgele olduğu için)
- Panellerin arkası hafif bulanık

## Testler

**Tarayıcısız (sadece botlar):**

- 3v3, 1 dakika: Süre tam 60 sn'de doldu, önde olan takım kazandı ✅
- Santra kuralı her adımda kontrol edildi: **0 ihlal** ✅
- 1v1, gol limiti 2: Maç 2-0 olunca bitti ✅
- 2 saniyelik 10 maç (beraberliği zorlamak için): 10'u da uzatmaya gitti, 10'u da altın golle bitti ✅
- Oyuncu gol sayıları toplamı skorla tutuyor ✅

**Chrome'da ekran görüntüleri:** Menü (hap butonlar), santra (mor parlayan orta yuvarlak), uzatma saati (UZATMA +0:04), duraklatma paneli, maç sonu (MOR KAZANDI, Kazandın! · Altın gol, 0:1 ve istatistikler). JavaScript hatası yok ✅

## Bilinmesi gerekenler

- **Santra sizdeyse topa sen dokunana kadar oyun başlamaz.** Santrada topa en yakın oyuncu sensin, takım arkadaşı botlar senin vurmanı bekler, rakipler de kural gereği bekler. Saat bu sırada işler. Test sırasında oyuncu hareketsiz kalınca uzatmada maç bu yüzden ilerlemedi. Gerçek oyunda sorun değil, ama istenirse "X saniye içinde dokunulmazsa santrayı bot yapsın" eklenebilir.
- Süre tam dolduğu anda top kaleye gidiyor olsa bile maç biter (bekleme yok).

## Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `js/sim.js` | Maç kuralları (süre, uzatma, gol limiti, kazanan), santra kuralı, istatistikler (gol, şut, topa sahip olma). `resetMatch` kaldırıldı. |
| `js/bots.js` | Santra rakipteyken bekleme |
| `js/main.js` | Ekran akışı (menü / oyun / duraklatma / maç sonu), ayar hapları, saat, maç sonu istatistikleri |
| `js/render.js` | Santrada renkli orta yuvarlak, "ALTIN GOL!" yazısı |
| `index.html` | Saat, ayar hapları, duraklatma ve maç sonu panelleri. Yardım satırında R yerine "Esc duraklat" |
| `style.css` | Saat, hap butonlar, paneller, butonlar, istatistik tablosu |
