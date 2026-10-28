# 02: Botlar ve Modlar (2. Adım)

- **Tarih:** 2026-10-27, 23:41
- **Durum:** ✅ Bitti, kullanıcının denemesi bekleniyor

## Kullanıcının istekleri

1. Saha küçük ya da oyuncu büyük duruyor, 6 kişi kalabalık olmasın
2. Raporlar Masaüstüne değil `work_done` klasörüne yazılsın, Masaüstündeki rapor silinsin
3. 2. adıma geç ve 1v1 modunu da ekle (1v1, 2v2, 3v3)

## Yapılanlar

### 1. Saha boyutu ve oyuncu büyüklüğü

Her modun artık kendi sahası var. Oyuncu ve top da biraz küçüldü:

| | Önce | 1v1 | 2v2 | 3v3 |
|---|---|---|---|---|
| Saha | 1100 × 520 | 1100 × 500 | 1300 × 600 | 1550 × 720 |
| Kale ağzı | 150 | 140 | 160 | 180 |

| | Önce | Şimdi |
|---|---|---|
| Oyuncu yarıçapı | 15 | 14 |
| Top yarıçapı | 10 | 9 |
| Normal hız | ~220 birim/sn | ~260 birim/sn |
| Sprint hızı | ~330 birim/sn | ~390 birim/sn |
| Şut gücü | 11 | 13 |

Saha büyüyünce gidip gelmek uzamasın diye hız ve şut gücünü biraz artırdım. Ekran her modda sahayı otomatik sığdırıyor. 3v3'te oyuncular ekranda daha küçük görünüyor, böylece kalabalık hissi azalıyor.

### 2. Botlar (`js/bots.js`, yeni dosya)

- **Takım beyni (TeamBrain):** Her karede takımdaki herkese bir rol veriyor. Sen de buna dahilsin.
  - **chaser:** topa giden (topa en yakın ve doğru tarafta olan)
  - **keeper:** kaleyi koruyan, kalenin önünde topun hizasında duran (2v2 ve 3v3)
  - **support:** topun biraz gerisinde, karşı kanatta bekleyen (3v3)
  - Sen topa en yakınsan chaser sensin, takım arkadaşı botlar başka işe geçer.
- **Bot kontrolcüsü:** Rolüne göre hareket ediyor.
  - Topun birazdan nerede olacağını tahmin ediyor.
  - Rakip kaleye doğru açıya geçip öyle vuruyor. Topun önündeyse yandan dolaşıyor ki topu kendi kalesine itmesin.
  - Kendi kalesinin önünde düzgün vuramıyorsa topu uzaklaştırıyor.
  - Kaleci, kaleye hızla gelen topun yoluna giriyor.
  - Her botun kalede nişan aldığı nokta biraz farklı, şutlarında küçük bir sapma var.
- Botlar da senin gibi aynı "input"u üretiyor (hareket, sprint, şut, nişan). Simülasyon bot mu insan mı bilmiyor, online'da bu sayede kolay olacak.

### 3. Menü ve mod seçimi

- Açılışta NURIBALL logosu (NURI turuncu, BALL mor) ve 3 neon kart: 1v1, 2v2, 3v3
- Kartların içinde mini saha ve santra dizilişini gösteren oyuncu noktaları
- Fareyle tıkla ya da klavyede 1 / 2 / 3'e bas
- Maç sırasında **Esc** menüye döner. Menüden yeni maç başlar, eski maç devam etmez.

### 4. Takım ve numaralar

- Takımın her maçta rastgele (turuncu ya da mor)
- Maç başında üstte 2,6 saniyelik bir bildirim: "Takımın: MOR ← sola hücum"
- Sen hep 10 numarasın. Botlara 1-99 arası rastgele, tekrar etmeyen numaralar veriliyor.

### 5. Raporlar

- Masaüstündeki `Nuriball - 1. Adım Raporu.md` silindi.
- `nuriball\work_done\` açıldı. İçinde `README.md` (dizin ve yol haritası), `01_...` ve `02_...` var.

## Kullanıcının seçtiği stil (bu adım)

| Konu | Seçim |
|---|---|
| Menü | Neon kartlar |
| Takım | Rastgele |
| Bot numaraları | Rastgele |
| Senin oyuncun | Ayrıca işaret yok, stamina halkası ve nişan çizgisi yeterli |

## Benim verdiğim küçük kararlar (değiştirilebilir)

- Logo rengi: NURI turuncu, BALL mor (takım renkleri)
- Menünün arkası koyu ve hafif bulanık
- Takım bildirimi: takım renginde çerçeveli kutu, yukarıda, 2,6 sn
- Kart üzerine gelince yukarı kalkıyor ve parlıyor, köşede kısayol tuşu görünüyor

## Testler

**Sadece botların oynadığı maçlar** (tarayıcısız, modda 6 maç × 3 dk):

| Mod | Gol/maç | Turuncu | Mor | Kendi kalesine | Takılı kalan top |
|---|---|---|---|---|---|
| 1v1 | 19,2 | 59 | 56 | 5 | 0 |
| 2v2 | 9,7 | 30 | 28 | 4 | 0 |
| 3v3 | 6,2 | 19 | 18 | 6 | 0 |

- Takımlar dengeli. Top hiçbir maçta 10 sn'den uzun durmadı.
- "Kendi kalesine" sayısı, topa en son dokunanın sayılan golde karşı takımdan olduğu durumlar (sekmeler dahil).

**Tarayıcıda (Chrome arka planda açılarak):**

- Menü, 1v1 ve 3v3 ekranları çizildi, JavaScript hatası yok ✅
- 30 saniyelik maçta skor ilerledi, 3v3'te iki takımın da kalecisi kalede ✅

## Bilinen eksikler ve sonraki adım

- **1v1'de çok gol oluyor** (3 dk'da ~19). Bot neredeyse her yerden şut çekiyor, rakip bot da iyi savunamıyor. 4. adımda (bot zekâsı) düzelecek.
- Santra kuralı yok: Golden sonra iki takım da hemen topa koşabiliyor (3. adım).
- Maç süresi ve maç sonu yok (3. adım).
- Zorluk seviyesi yok (4. adım).

## Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `js/config.js` | Mod tablosu (`NB.MODES`), yeni oyuncu/top boyutu, hız ve şut gücü |
| `js/sim.js` | Saha artık her dünyaya özel, takım büyüklüğüne göre diziliş, topa son dokunan takibi |
| `js/bots.js` | **Yeni:** takım beyni ve bot kontrolcüsü |
| `js/render.js` | Sahayı her modun boyutuna göre ekrana sığdırma |
| `js/main.js` | Menü, mod başlatma, rastgele takım ve numaralar, Esc ile menü |
| `index.html` | Menü, takım bildirimi, bots.js |
| `style.css` | Menü kartları, logo, bildirim |
