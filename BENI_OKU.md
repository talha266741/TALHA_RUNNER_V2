# TALHA RUNNER — BENİ OKU

> Bu dosya TALHA RUNNER projesinin kalıcı proje hafızasıdır. Yeni bir ChatGPT sohbetinde önce bu dosya okunmalı, ardından repodaki güncel kaynak kod incelenmelidir. Sohbet özeti yardımcı bağlamdır; çalışan kaynak kod ve bu dosyadaki kesin kararlar ana referanstır.

## 1. TALHA RUNNER NEDİR?

TALHA RUNNER V2, Talha İnce'nin Adobe InDesign içinde ChatGPT tarafından hazırlanan JavaScript/ExtendScript kodlarını hızlı biçimde çalıştırabilmesi için geliştirilmiş bir InDesign UXP panelidir.

Temel fikir:

1. Talha yapılacak dizgi/otomasyon işini ChatGPT ile tarif eder.
2. ChatGPT gerekli InDesign kodunu hazırlar.
3. Kod TALHA RUNNER editöründe çalıştırılır.
4. Runner kodu InDesign `app.doScript()` üzerinden `ScriptLanguage.JAVASCRIPT` olarak yürütür.
5. Runner seviyesinde işlem `UndoModes.ENTIRE_SCRIPT` ile tek geri alma adımı altında tutulur.
6. Tekrar kullanılacak kodlar Favoriler'e kaydedilebilir.
7. Runner'ın kaynak kodu GitHub'daki `talha266741/TALHA_RUNNER_V2` private reposunda tutulur.

Runner görev-özel mantık içermez. Soru dizme, stil uygulama, tablo düzenleme vb. işler Runner'ın içine gömülmez; çalıştırılan kod parçalarında bulunur. Runner altyapıdır: kod girişi → çalıştırma → durum → geçmiş/favoriler → güncelleme erişimi.

## 2. ÇALIŞMA MİMARİSİ

- `manifest.json`: UXP eklenti kimliği, sürüm, InDesign host bilgisi, izinler ve panel tanımı.
- `index.html`: panel arayüzü ve görünümü.
- `main.js`: Runner davranışı, InDesign'a kod gönderme, geçmiş, favoriler ve güncelleme işlemleri.
- `BENI_OKU.md`: proje hafızası, teknik kararlar ve Karekök dizgi bilgileri.
- GitHub `main`: güncel kaynak için ana dal.
- CCX: normal Adobe eklenti kurulumu için paketlenmiş sürüm.

### Güncelleme yaklaşımı

Private GitHub repo nedeniyle eklenti içine kişisel GitHub tokenı gömülmez. Bu güvenli değildir. UXP'nin kurulu CCX paketini kendi kendine sessizce değiştirebildiği varsayılmaz.

Güvenli/pratik güncelleme akışı:

1. Kaynak GitHub'da güncellenir.
2. Yeni CCX release hazırlanır.
3. Runner'daki `Güncelle` düğmesi private GitHub reposunun Releases sayfasını varsayılan tarayıcıda açar.
4. Kullanıcı GitHub'da oturum açmış hesabıyla güncel CCX'i indirip kurar.

Bu mekanizma ileride Adobe UXP'nin güvenli ve doğrulanmış bir self-update yolu sağladığı teyit edilirse geliştirilebilir. Doğrulanmamış self-modification yöntemleri kullanılmaz.

## 3. SÜRÜM VE GÜNCEL DURUM

Bu dosyanın oluşturulduğu geliştirme turunda hedef sürüm: **2.0.3**.

2.0.2'de doğrulanmış temel özellikler:

- InDesign paneli açılıyor.
- Kod `app.doScript(..., ScriptLanguage.JAVASCRIPT, ..., UndoModes.ENTIRE_SCRIPT, "Talha Runner V2")` ile çalışıyor.
- Ctrl+Enter çalıştırıyor.
- Temizle çalışıyor.
- İsteğe bağlı çalıştırma sonrası temizleme var.
- Geçmiş en fazla 20 kodu oturum içinde tutuyor.
- Geçmişten numarayla kod editöre geri yükleniyor.
- İşlem sonunda InDesign odağını geri verme deneniyor.

2.0.3 hedefleri:

- Kalıcı `Favoriye Kaydet`.
- Kalıcı `Favorilerim`: yükleme, yeniden adlandırma, silme.
- `Güncelle` düğmesinin gerçek GitHub Releases akışını açması.
- `BENI_OKU.md` kalıcı proje hafızası.

## 4. KOD YAZARKEN KULLANILAN İKİ AYRI ORTAM

Bu ayrım kritiktir.

### A) Runner'ın kendi kodu: UXP JavaScript

`main.js` UXP ortamında çalışır. Burada örneğin:

```js
const { entrypoints, shell } = require("uxp");
const { app, ScriptLanguage, UndoModes } = require("indesign");
```

kullanılır. Panel DOM'u, `localStorage`, UXP `shell` gibi API'ler bu katmandadır.

### B) Runner editörüne yapıştırılan kod: InDesign JavaScript / ExtendScript uyumlu kod

Runner editöründeki metin InDesign'a şu mantıkla gönderilir:

```js
app.doScript(
    code,
    ScriptLanguage.JAVASCRIPT,
    undefined,
    UndoModes.ENTIRE_SCRIPT,
    "Talha Runner V2"
);
```

Bu nedenle editöre yapıştırılan kodu UXP panel koduyla karıştırma. `document.getElementById`, UXP `shell`, panel `localStorage` gibi UXP kavramlarını sıradan InDesign snippet'ine taşımak doğru değildir.

### Tek Undo kuralı

Runner zaten dış seviyede `UndoModes.ENTIRE_SCRIPT` uygular. Runner'da çalıştırılmak üzere hazırlanan snippet'ler normalde kendilerini yeniden `app.doScript(...ENTIRE_SCRIPT...)` içine sarmamalıdır. Gereksiz çift sarmalama hata ayıklamayı ve davranışı karmaşıklaştırır.

## 5. INDESIGN SCRIPT YAZIM STANDARTLARI — KESİN KURALLAR

**KESİN KURAL — Tam kod:** Talha'ya kod revizyonunda “şu satırı bul, bununla değiştir” biçiminde yama verilmez. Her zaman doğrudan çalıştırılabilir tam kod verilir. GitHub bağlantısı kullanılabiliyorsa Talha'nın onayıyla dosya doğrudan güncellenir.

**KESİN KURAL — Tek Undo:** Runner dışındaki bağımsız InDesign scriptleri de mümkün olduğunda tek Undo ile geri alınabilir tasarlanır. Runner snippet'lerinde ise Runner'ın mevcut ENTIRE_SCRIPT sarmalaması dikkate alınır.

**KESİN KURAL — Tarih sınırı yok:** Scriptlere otomatik son kullanma tarihi/tarih damgası kontrolü eklenmez.

**KESİN KURAL — Tablo hücreleri:** İmleç tablo hücresindeyken `parentStory` indekslerine körü körüne güvenilmez. Hücrenin kendi `characters` ve `insertionPoints` koleksiyonları tercih edilir. Aksi yaklaşım daha önce `Object is Invalid` türü hatalara yol açmıştır.

**KESİN KURAL — Odak ve imleç:** ScriptUI panel/dialog kullanılıyorsa işlem öncesi aktif InDesign penceresi tutulur; işlem bitince pencere öne getirilir ve oluşturulan/işlenen metnin gerçek son `InsertionPoint` noktası seçilerek kullanıcının hemen yazmaya devam edebilmesi hedeflenir.

**KESİN KURAL — Belgeyi değiştirmeyen dump:** Inspector/stil dump gibi inceleme kodları belgeye yeni sayfa veya text frame ekleyerek çıktı yazmamalıdır. Çıktı ayrı ScriptUI penceresinde gösterilmelidir.

**KESİN KURAL — Dump kimliği:** Belge/stil inceleme çıktılarında belge adı, klasörü ve tam yol bulunmalıdır. Kaydedilmemiş belgede `[Henüz kaydedilmedi]` yazılır.

**KESİN KURAL — Stil adı tek başına yeterli değil:** Aynı isim root ve style group içinde bulunabilir. Stil tam yolu (`SAYISAL/soru_plain` gibi) alınmalıdır.

**KESİN KURAL — Parser iddiası:** `node --check` kullanıldıysa yalnızca JavaScript sözdiziminin kontrol edildiği söylenir; bunun InDesign/UXP runtime davranışını doğruladığı iddia edilmez.

## 6. ÇALIŞMADIĞI / KULLANILMAMASI GEREKTİĞİ BİLİNEN YAKLAŞIMLAR

### Tablo hücresinde story index'e kör güvenmek

Neden: Hücre bağlamında story tabanlı indeks/nesne referansları geçersizleşebilir ve `Object is Invalid` üretebilir. Hücrenin kendi koleksiyonları kullanılmalıdır.

### ScriptUI kapandıktan sonra yalnızca metni değiştirip odağı önemsememek

Neden: İşlem doğru tamamlansa bile klavye odağı InDesign'a veya gerçek son insertion point'e dönmeyebilir. Kullanıcı mouse ile tekrar tıklamak zorunda kalır.

### Inspector çıktısını aktif belgeye yazmak

Neden: İnceleme işlemi belgeyi kirletir, sayfa/text frame ekler ve kullanıcı içeriğini gereksiz değiştirir. Ayrı çıktı penceresi kullanılmalıdır.

### Runner snippet'ini tekrar ENTIRE_SCRIPT ile sarmak

Neden: Runner zaten tek Undo sarmalaması yapar. Çift katman gereksizdir ve davranışı karmaşıklaştırabilir.

### Private GitHub tokenını plugin içine gömmek

Neden: Token paket içinden çıkarılabilir; güvenlik riski yaratır. Private repo güncellemesinde tarayıcının mevcut GitHub oturumu kullanılmalıdır.

### UXP ile ExtendScript ortamını aynı kabul etmek

Neden: Runner'ın UXP katmanındaki API'ler ile InDesign'a `doScript` aracılığıyla gönderilen kodun çalışma ortamı aynı değildir. Bir katmanda çalışan API diğerinde bulunmayabilir.

## 7. KAREKÖK DİZGİ KARARLARI

Aşağıdaki bilgiler Talha ile gerçek dizgi örneklerinden çıkarılmış proje bilgisidir. `KESİN KURAL`, `GÖZLEM`, `AÇIK KARAR` ayrımı korunmalıdır. Tek bir örnekten evrensel kural uydurulmamalıdır.

### Genel

**KESİN KURAL:** Dizgi otomasyonu mevcut Karekök yapısını öğrenmeli; stil/karakter/font eşlemeleri tahmin edilmemelidir.

**KESİN KURAL:** Aynı görünen stil adının farklı gruplardaki sürümleri farklı özelliklere sahip olabilir. Tam stil yolu önemlidir.

### İncelenen belge örneği: `21_Tema-6_HBT-15.indd`

Bu belgede iki ayrı paragraf stil sistemi gözlenmiştir:

- `SAYISAL/soru_plain`: Arial Roman, 10 pt / 14 pt, LEFT_ALIGN, left indent 7, first line -7, Space After 1.
- `SAYISAL/soru_bold`: Arial Bold, 10/14, LEFT_ALIGN, left 7, first -7, SA 3, based on `soru_plain`.
- `SAYISAL/cevap_altalta`: Arial Roman, 10/14, LEFT_ALIGN, left 12, first -5, SA 1.
- `SAYISAL/soru_oncul`: Arial Roman, 10/14, LEFT_ALIGN, left 12, first -12, SA 1.
- `SAYISAL/cevap_yanyana`: Arial Roman, 10/14, LEFT_ALIGN, left 7, first -7, SA 2.
- root `soru_plain`: Arial Roman, 9/13, LEFT_JUSTIFIED, left 7, first -7, SA 1.
- root `soru_bold`: Arial Bold, 9/13, LEFT_JUSTIFIED, left 7, first -7, SA 3, based on root `soru_plain`.
- root `yan_yana`: Arial Roman, 9/13, LEFT_JUSTIFIED, left 7, first -7, SA 2.
- root `Cevap_alt_alta`: Arial Regular, 9/13, LEFT_JUSTIFIED, left 12, first -5, SA 1.
- root `öncül`: Arial Roman, 9/13, LEFT_JUSTIFIED, left 12, first -12, SA 1.
- root `Tablo`: Arial Regular, 9/12, LEFT_ALIGN, sıfır indent/space.

**GÖZLEM:** Bu belge içinde `SAYISAL` grubu 10/14 + LEFT_ALIGN sistemi ile root stiller 9/13 + LEFT_JUSTIFIED sistemi birlikte bulunuyor. Bu gözlem başka belgeler için otomatik evrensel kural yapılmamalıdır.

### Soru / paragraf davranışları

**GÖZLEM / öğrenilmiş karar:** Bold soru paragrafında Space After çoğunlukla 3; soru devam eden/ara paragraf olduğunda 1'e düşürülen durumlar vardır. Bağlam kontrol edilmelidir.

**GÖZLEM:** Öncül yapılarında Space After 1 kullanımı görülmüştür.

**GÖZLEM:** Yan yana cevaplarda FULLY_JUSTIFIED kullanımı her yapıya uygulanmaz; yalnız uygun seçenek yapılarında kullanılır.

### Matematik ve semboller

**KESİN KURAL:** Font/sembol kaynak karakterleri tahmin edilmez. Kaynak belge/tablo üzerinden doğrulanır.

**GÖZLEM:** F SEMBOLLER eşlemelerinde reaksiyon oku için test edilmiş kaynak `¾®`; check işareti için test edilmiş kaynak `\` olarak kaydedilmiştir. Bullet kaynak karakteri henüz kesin değildir.

**KESİN KURAL:** MMTimes normal kaynakta eksi/artı/eşittir için normal `- + =` karakterleri kullanılır; Unicode minus keyfi olarak eklenmez. GREP/font eşlemesi mevcut kaynak sistemine göre uygulanır.

**GÖZLEM:** Kesirlerde optik boşluk bağlama göre değerlendirilir; sabit kör değer uygulanmaz.

**GÖZLEM:** Alt indis Space After/baseline ayarları görsel ve bağlamsal olabilir. İç içe alt indis için daha önce 2 pt küçültme ve baseline -3 örneği görülmüştür; yeni bağlamda doğrulanmalıdır.

**GÖZLEM:** Kötü heceleme/satır davranışını düzeltmek için tracking küçük miktarlarda kullanılabilir; yaklaşık 20–25'i aşmamak tercih edilmiştir. Test örneği `C4-63 TRACK=-5` olarak kaydedilmiştir.

### Notlar

**GÖZLEM:** InDesign Notes yapısı cevap harflerini saklamak için kullanılmaktadır/denenmiştir. Cevap anahtarı otomasyonunda Notes içeriği dikkate alınır.

## 8. INSPECTOR / ÖĞRENME SİSTEMİ

Amaç: Talha'nın seçtiği gerçek InDesign içeriğinden biçim bilgisini okuyup ChatGPT'nin Karekök dizgi mantığını daha doğru öğrenmesini sağlamak.

Inspector çıktısı mümkün olduğunca şunları korumalıdır:

- belge adı ve tam yolu,
- seçimin türü,
- paragraf/karakter stili ve tam grup yolu,
- font, punto, leading,
- justification,
- indent ve paragraph spacing,
- tracking/baseline/position gibi önemli override'lar,
- tablo/hücre bağlamı,
- Notes gibi ilgili yapılar.

Öğrenilen her değer otomatik “kesin kural” yapılmaz. Birden fazla örnek veya Talha'nın açık onayı gerekebilir.

## 9. CHATGPT İÇİN ÇALIŞMA KURALLARI

1. Yeni sohbette önce `BENI_OKU.md`, sonra göreve ilişkin güncel repo dosyaları okunur.
2. Repodaki mevcut kod görülmeden eski sohbet özetinden kod varsayılmaz.
3. Talha açıkça onay vermeden GitHub'daki çalışan kaynak değiştirilmez. “Uygula”, “yap”, “commit et”, “hepsini yap” gibi açık talimat değişiklik onayıdır.
4. Kod değişikliğinde mümkünse önce mevcut dosyanın güncel SHA/içeriği alınır; sonra tam dosya güvenli biçimde güncellenir.
5. Kesinleşmiş dizgi kararları bu dosyaya eklenir. Şüpheli çıkarımlar `GÖZLEM` veya `AÇIK KARAR` olarak yazılır.
6. Çalışmadığı doğrulanan teknik yollar, aynı hata sonraki sohbette tekrarlanmasın diye nedenleriyle kaydedilir.
7. Talha'ya lokal dosya yolu verilecekse tam yol tercih edilir.
8. Runner generic altyapı olarak tutulur; görev-özel snippet mantığı Runner çekirdeğine gereksizce gömülmez.

## 10. AÇIK İŞLER / SONRAKİ GELİŞTİRMELER

- Gerçek CCX paketleme ve release sürecini mümkün olduğunca otomatikleştirmek.
- Güncelle düğmesinin yalnız release sayfasını açmasının ötesinde güvenli sürüm kontrolü yapıp yapamayacağını araştırmak; private repo kimlik doğrulamasında token gömmemek.
- Inspector'ın yeni sürümünü geliştirmek ve Karekök format haritasını genişletmek.
- Favoriler kullanımından sonra UI/UX iyileştirmelerini gerçek kullanım üzerinden değerlendirmek.

---

## Yeni sohbet başlangıç cümlesi

Talha yalnızca şunu söyleyebilir:

> **GitHub'daki BENI_OKU.md dosyasını oku. TALHA RUNNER'a kaldığımız yerden devam ediyoruz.**

Bu durumda dosya ve güncel kaynak kod okunmalı; eski konuşmanın birebir erişilebilir olduğu varsayılmamalıdır.
