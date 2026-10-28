# 01: Saha ve Fizik (1. Adım)

- **Tarih:** 2026-10-27
- **Durum:** ✅ Bitti
- **Not:** Bu raporun ilk hali Masaüstündeydi. Kullanıcının isteğiyle oradan silindi, buraya taşındı.

## Yapılanlar

- Saha: çizgiler, orta yuvarlak, iki kale (file ve direkler)
- Top fiziği: sürtünme, duvar ve direklerden sekme
- Oyuncu fiziği: ivmeli hareket, oyuncu-top ve oyuncu-oyuncu çarpışması
- Oyuncular saha çizgisinin biraz dışına çıkabiliyor, top çıkamıyor
- Şut: sol tık, mouse yönüne sabit güç. Erken tık kısa süre bekletiliyor.
- Sprint: Shift. Stamina 2 sn'de biter. Tamamen biterse %25 dolana kadar sprint yok.
- Gol: Top çizgiyi tamamen geçince sayılır, "GOL!" yazısı çıkar, sonra santra.
- Skor tabelası ve alt yardım yazısı

## Kullanıcının seçtiği stil

| Konu | Seçim |
|---|---|
| Tema | Karanlık neon |
| Saha | Lacivert zemin, cyan çizgi, hafif ızgara |
| Takımlar | Turuncu `#ff8a1f` ve Mor `#a24bff` |
| Top | Parlak beyaz |
| Oyuncu | Daire ve forma numarası |
| Stamina | Oyuncu etrafında neon yeşil halka (azalınca sarı, bitince kırmızı yanıp söner) |
| Kontrol | WASD ve oklar, sol tık mouse yönüne şut, Shift sprint |
| Şut | Tıkla, sabit güç |

## Benim verdiğim küçük kararlar

- Kesikli beyaz nişan çizgisi (sadece senin oyuncunda)
- Şut anında kısa beyaz halka
- Kale içleri savunan takımın renginde çok hafif
- Direkler ve file cyan
- Sistem yazı tipi, artı şeklinde imleç

## Testler

- Oyuncu topa koşup gol attı ✅
- 5000 rastgele sert vuruşta top sahadan hiç kaçmadı ✅
- Stamina tam 2 sn'de bitti ✅

## Kullanıcı geri bildirimi (2. adımdan önce)

> "Renkler tertemiz ama saha küçük ya da oyuncu büyük."

Bu 2. adımda çözüldü (bkz. `02_botlar-ve-modlar.md`).
