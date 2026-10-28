# 04: Takım Arkadaşlarının Staminası

- **Tarih:** 2026-10-27, 23:59
- **Durum:** ✅ Bitti (3. adımdan önce araya eklenen küçük özellik)

## Kullanıcının isteği

> "Kendi takım arkadaşlarımın staminasını bir şekilde görsem? Pas opsiyonunu düşünmeme yardımcı olur."

Amaç: Pası, sprint atıp topa yetişebilecek arkadaşa vermek.

## Kullanıcının seçtiği stil

| Konu | Seçim |
|---|---|
| Görünüş | İnce, soluk halka (seninkinin sade hali) |
| Rakipler | Gösterilmez, sadece kendi takımın |

## Yapılanlar

- Takım arkadaşlarının etrafında stamina halkası:
  - **Sen:** 3 px kalın, tam parlak, ışıltılı (değişmedi)
  - **Arkadaşların:** 1,5 px ince, yarı saydam, ışıltısız
- Renk kuralı ikisinde de aynı: yeşil → %35'in altında sarı → tamamen bitince kırmızı yanıp söner.
- Takımın her maçta rastgele olduğu için halkalar o maçta senin takımında kim varsa onlarda çıkıyor.
- 1v1'de takım arkadaşı olmadığı için değişiklik görünmez.

## Test

- Chrome'da 3v3 maç açıldı, ekran görüntüsünde senin halkan kalın, iki arkadaşınınki ince ve soluk, rakiplerde yok ✅
- JavaScript hatası yok ✅

## Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `js/render.js` | Halka çizimi ayrı fonksiyona alındı (`drawStaminaRing`), takım arkadaşları için ince ve soluk sürümü eklendi |
