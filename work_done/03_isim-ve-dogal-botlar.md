# 03: İsim Değişikliği ve Doğal Botlar

- **Tarih:** 2026-10-27, gece (2. adımın hemen ardından)
- **Durum:** ✅ Bitti

## Kullanıcının istekleri

1. Proje adı şimdilik **nuriball** yerine **ballgame** olsun (geçici).
2. Kaleci botlar kaleye top gelirken geri çekilip topun girmesine sebep oluyor. Ama her topu kurtaran bir kaleci de olmasın, dengeli olsun.
3. Botlar santrada aşırı hızlı sprint atıp topa koşuyor ve hemen kaleye vuruyor. Çok ezbere oynuyorlar, biraz rastgelelik ve doğallık lazım.

## 1. İsim değişikliği

- Sayfa başlığı: `Ballgame`
- Menü logosu: **BALL** turuncu, **GAME** mor (önceki NURI/BALL düzeniyle aynı)
- Kod dosyalarının başlık yorumları ve `work_done/README.md` başlığı güncellendi
- Klasör `Masaüstü\nuriball` → `Masaüstü\ballgame` olarak yeniden adlandırıldı. İlk denemede Claude Code oturumu klasörün içinde çalıştığı için "Device or resource busy" hatası verdi. Oturum Masaüstüne geçince ikinci deneme başarılı oldu.
- Eski raporlarda (01, 02) geçen "Nuriball" adları tarihçe olduğu için olduğu gibi bırakıldı.

## 2. Kaleci hatası

**Sebep:** Top kaleye yaklaşınca kaleci "topa giden" rolüne geçiyordu. Bu rol topun birkaç an sonra nerede olacağını tahmin edip oraya koşuyor. Hızlı bir şutta bu nokta kalenin içi oluyordu, yani kaleci topla birlikte kendi kalesine koşuyordu.

**Düzeltme:**

- Kaleci artık top kaleye yakın değilse kalesini bırakıp topa koşmuyor (top kaleye saha genişliğinin %28'inden yakınsa koşabilir).
- Normalde kale ortası ile top arasındaki çizgide, top uzaklaştıkça biraz daha önde duruyor.
- Şut gelince **geri çekilmiyor**: bulunduğu hizada yana kayarak topun yoluna giriyor.
- Kaleci rolü sadece botlara verilir. Sen kaleye yakın dursan bile botlar "kalede biri var" diye varsaymıyor.
- Topa giden bot, topun "birazdan olacağı yer" yerine artık topa **en erken yetişebileceği noktaya** gidiyor.

**Denge:** Her şutta kaleciye 14-34 birim arası rastgele bir "yanlış tahmin" veriliyor. Kaleci bazen doğru köşeye gidip kurtarıyor, bazen yanlış tarafa kayıyor.

## 3. Doğallık: botlara kişilik

Her bot oluşturulurken rastgele bir kişilik alıyor:

| Özellik | Aralık | Ne işe yarar |
|---|---|---|
| Tepki süresi | 7-16 adım (0,12-0,27 sn) | Biri şut çekince topun yeni yönünü ancak bu kadar sonra fark eder, o arada eski tahminle koşar |
| Görme sıklığı | 4-9 adımda bir | Topun yerini sürekli değil, aralıklarla günceller |
| Nişan sapması | 0,05-0,12 radyan | Şutlar tam hedefe gitmez |
| Şut mesafesi | Saha genişliğinin %30-45'i | Kaleye bundan uzaktaysa genelde şut çekmez |
| Uzaktan şut | %8-25 ihtimal | Arada bir uzaktan dener |
| Pas | %25-60 ihtimal | İleride ve önü açık bir takım arkadaşı varsa pas verir |
| Sprint eşiği | %30-55 stamina | Bunun altındayken sprint atmaz |

Ayrıca her bot 1-2,5 saniyede bir kısa bir "niyet" seçiyor: kalenin hangi köşesine vuracak, pas mı arayacak, sprint mi atacak, kanatta tam nerede duracak. Böylece her an fikir değiştirmiyor ama ezbere de oynamıyor.

### Santra

- Her bot santrada 0,2-0,75 sn arası rastgele bekliyor.
- Santradan sonraki ilk ~1,7 sn kimse sprint atmıyor.

### Hücum

- Kaleye uzaksa şut yerine topu **sürüyor**, ileride boşta arkadaşı varsa **pas** veriyor.
- Rakip dibindeyse (baskı altında) şut ya da uzaklaştırma yapıyor.

### Savunma

- Kendi yarı sahasında top çekişmeliyse topa **kendi kalesi tarafından** giriyor ve topu kaleden uzağa itiyor. Önceden kendi hücum yönüne göre giriyordu, bu yüzden kenardaki toplarda şut yolu açık kalıyordu.
- Rakip topa önce yetişecekse körlemesine koşmuyor, topla kale arasına giriyor.
- Kendi kalesine giderken yol topun içinden geçiyorsa yandan dolanıyor, topu kendi kalesine itmiyor.
- **Takımda bot kaleci yoksa** (1v1, ya da 2v2'de arkadaş bot topa giderken) son adam gibi davranıyor: top rakipteyken kale önüne çekiliyor, kaleye şut gelirse kaleci gibi topun yoluna kayıyor.

## Testler (sadece botların oynadığı maçlar, modda 8 maç × 3 dk)

| Mod | Gol/maç (önce → sonra) | Santradan ilk vuruşa | Kendi kalesine | Takılma |
|---|---|---|---|---|
| 1v1 | 19,2 → **14,5** | 1,7 sn | 4 | 0 |
| 2v2 | 9,7 → **5,4** | 2,2 sn | 6 | 0 |
| 3v3 | 6,2 → **4,1** | 1,7 sn | 7 | 0 |

- 1v1'de golleri tek tek inceledim. Önceden çoğu, savunan bot topun dibinde ama şut çizgisinin dışındayken uzaktan geliyordu. Şimdi çoğu savunmacı çalımla geçildikten sonra, daha yakından geliyor (ortalama şut mesafesi saha genişliğinin %34'ünden %20'sine indi).
- "Kendi kalesine" sayısı, topa en son dokunanın karşı takımdan olduğu golleri sayıyor. Kalecinin dokunup kurtaramadığı şutlar da buna dahil.
- Chrome'da 30 sn'lik 1v1 ve 3v3 maçında JavaScript hatası yok ✅

## Bilinen eksikler

- 1v1 hâlâ gollü (3 dk'da ~14). Zorluk seviyesiyle birlikte 4. adımda yeniden ayarlanacak.
- Santra kuralı (rakip yarı sahada bekleme vb.) yok, 3. adımda gelecek.

## Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `js/bots.js` | Baştan yazıldı: kişilik, gecikmeli görme, niyet, top sürme, pas, yeni kaleci ve son adam savunması |
| `js/sim.js` | `kickoffTick`: son santranın yapıldığı an (botlar santrada beklesin diye) |
| `js/main.js` | Takım beynine senin oyuncunun bilgisi veriliyor (kaleci rolü sana verilmesin diye) |
| `index.html` | Başlık ve logo: Ballgame |
| `js/*.js` | Başlık yorumları: Ballgame |
