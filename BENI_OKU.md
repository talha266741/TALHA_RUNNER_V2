# TALHA RUNNER — BENİ OKU

> Bu dosya TALHA RUNNER V2'nin PUBLIC proje hafızasıdır. Yeni bir geliştirme oturumunda önce bu dosya, ardından repodaki güncel kaynak kod okunmalıdır.

## 1. PROJE

TALHA RUNNER V2, Adobe InDesign içinde JavaScript/ExtendScript kodlarını hızlı biçimde çalıştırmak için geliştirilen açık kaynak bir UXP panelidir.

Temel kullanım fikri: kullanıcı yapmak istediği InDesign işini bir yapay zekâya anlatır → üretilen kodu Runner'a yapıştırır → çalıştırır → yararlıysa favoriye kaydeder.

Runner görev-özel dizgi mantığı içermez. Runner altyapıdır: kod girişi → çalıştırma → durum → geçmiş/favoriler → güncelleme.

Repo: `talha266741/TALHA_RUNNER_V2`
Görünürlük: PUBLIC
Ana dal: `main`

## 2. PUBLIC / PRIVATE BİLGİ AYRIMI — KESİN KURAL

Bu public repo yalnız TALHA RUNNER'ın genel kaynak kodunu, mimarisini, sürüm bilgisini ve genel geliştirme kararlarını içerir.

Müşteri/kurum/işveren özelinde öğrenilmiş dizgi bilgileri, gerçek belge adları, özel stil yolları/değerleri, sembol eşlemeleri, üretim kuralları ve benzeri kuruma özgü bilgiler BU REPOYA YAZILMAZ. Bunlar ayrı PRIVATE bilgi deposunda tutulur.

## 3. TEMEL DOSYALAR

- `manifest.json`: UXP eklenti kimliği, sürüm, host ve izinler.
- `index.html`: mümkün olduğunca sabit ve genel panel kabuğu.
- `main.js`: küçük, kalıcı Core/bootstrap ve updater.
- `runtime.js`: normal Runner UI davranışı; uzaktan güncellenebilir katman.
- `update.json`: public güncelleme kanalı manifesti.
- `README.md`: son kullanıcı dokümantasyonu.
- `BENI_OKU.md`: public proje hafızası ve teknik kararlar.

## 4. CORE / RUNTIME GÜNCELLEME MİMARİSİ

Updater mimarisinin ilk uygulaması 2.1.0 hattında repoya eklenmiştir.

Adobe UXP'nin resmi davranışına göre plugin klasörü salt okunurdur; plugin data/sandbox alanı kalıcı yazılabilir depolama sağlar. UXP manifest v5 ayrıca ağ erişimi için domain izni ve string'den kod üretimi için `allowCodeGenerationFromStrings` izni sunar.

Bu nedenle kurulu plugin dosyalarını kendi kendine değiştirmek yerine iki katman kullanılır:

1. **Core (`main.js`)**: paketle kurulan bootstrap. UXP/InDesign modüllerini alır, update kanalını kontrol eder, runtime'ı doğrular/etkinleştirir ve fallback sağlar.
2. **Runtime (`runtime.js`)**: normal Runner davranışının bulunduğu güncellenebilir katman.

Güncelleme kanalı:

`https://raw.githubusercontent.com/talha266741/TALHA_RUNNER_V2/main/update.json`

`update.json` şu anda `runtimeVersion`, `minCoreVersion`, `runtimeUrl` ve notları taşır.

İlk uygulamada indirilen runtime kaynak metni UXP `localStorage` içinde kalıcı cache olarak tutulur. Bu, UXP'nin plugin data alanıyla aynı amaç sınıfında kalıcı plugin depolamasıdır ve normal runtime güncellemelerinde kurulu plugin klasörüne yazmayı gerektirmez. İleride gerekirse cache fiziksel plugin-data dosyasına taşınabilir; kullanıcı akışı değişmemelidir.

Core başlangıçta cache edilmiş runtime'ı derleyip yüklemeyi dener; cache bozuksa paket içindeki `runtime.js` fallback'ine döner.

`Güncelle` akışı:

1. `update.json` HTTPS ile alınır.
2. Schema ve minimum Core sürümü kontrol edilir.
3. Yeni runtime sürümü yoksa işlem biter.
4. Runtime kaynağı indirilir.
5. `new Function` ile module factory olarak derlenebilirliği ve beklenen export biçimi kontrol edilir.
6. Panel açıksa aday runtime etkinleştirilir.
7. Başarılıysa source + version cache'e yazılır.
8. Etkinleştirme başarısızsa önceki cache veya paket içi runtime geri yüklenir.
9. Ağ yoksa başlangıçta cache/fallback sayesinde Runner çalışmaya devam eder.

### Önemli

Bu mimari kaynak seviyesinde uygulanmıştır fakat gerçek InDesign UXP ortamında bootstrap paketiyle uçtan uca test edilmeden “doğrulanmış updater” sayılmaz. Kullanıcıya son manuel paket/kurulum ancak test için hazır Core tamamlandığında yaptırılır.

Normal Runner UI ve davranış değişiklikleri `runtime.js` içinde tutulmalıdır. Core/manifest değişikliği gerektiren işler istisnadır.

Plugin içine GitHub PAT/token/secrets gömülmez. Public raw GitHub kaynağı kullanılır.

## 5. MANIFEST 2.1.0

Güncel manifest updater için:

- `allowCodeGenerationFromStrings: true`
- `localFileSystem: "plugin"`
- `network.domains: ["https://raw.githubusercontent.com"]`

içerir.

`localFileSystem: "plugin"` sandbox erişimi için yeterlidir; kullanıcının genel dosya sistemine updater adına geniş erişim verilmez.

## 6. RUNNER'IN İKİ JAVASCRIPT ORTAMI

### A) UXP / Core-runtime katmanı

Runner'ın kendi kodu UXP JavaScript ortamında çalışır. Core, `indesign` modülünden `app`, `ScriptLanguage`, `UndoModes` alır ve runtime'a kontrollü context verir.

Uzaktan runtime CommonJS-benzeri factory kaynağıdır. Core bunu `new Function` ile module export'a dönüştürür. Bu kullanım manifestteki `allowCodeGenerationFromStrings` iznine dayanır.

### B) Runner editöründeki InDesign kodu

Editöre yapıştırılan kod şu mantıkla gönderilir:

```js
app.doScript(
    code,
    ScriptLanguage.JAVASCRIPT,
    undefined,
    UndoModes.ENTIRE_SCRIPT,
    "Talha Runner V2"
);
```

UXP panel API'leri ile `doScript` üzerinden çalışan InDesign JavaScript ortamı birbirine karıştırılmaz.

## 7. GENEL SCRIPT GELİŞTİRME KURALLARI

- Runner editöründeki kod dış seviyede Runner tarafından `UndoModes.ENTIRE_SCRIPT` ile tek Undo altında tutulur; snippet gereksiz yere tekrar sarılmaz.
- Kod revizyonunda kullanıcıya satır yaması yaptırmak yerine tam çalışır kod veya doğrudan repo güncellemesi tercih edilir.
- Scriptlere otomatik son kullanma tarihi eklenmez.
- ScriptUI/dialog sonrası kullanıcı odağı ve gerçek son insertion point korunmaya çalışılır.
- Tablo hücresi bağlamında geçersiz story index varsayımlarından kaçınılır.
- `node --check` yalnız JavaScript sözdizimi kontrolüdür; InDesign/UXP runtime doğrulaması değildir.

## 8. DOĞRULANMIŞ RUNNER ÖZELLİKLERİ

2.0.x hattında gerçek InDesign kullanımında doğrulanmış temel davranışlar:

- UXP paneli açılır.
- Kod `app.doScript` ile çalışır ve Runner seviyesinde tek Undo kullanır.
- Ctrl+Enter çalıştırır.
- Editör temizlenebilir.
- İsteğe bağlı çalıştırma sonrası temizleme vardır.
- Geçmiş oturum içinde tutulur.
- Favoriler kalıcı saklanabilir; kaydetme/yükleme/yeniden adlandırma/silme akışları bulunur.
- İşlem sonrası InDesign odağını geri verme yaklaşımı bulunur.

2.1.0 Core/runtime updater kodu repoya uygulanmıştır; gerçek UXP bootstrap testi sıradaki aşamadır.

## 9. GELİŞTİRME OTURUMU BAŞLANGIÇ KURALI

Yeni oturumda:

1. Bu dosyayı oku.
2. `manifest.json`, `index.html`, `main.js`, `runtime.js`, `update.json` dosyalarını repodan çek.
3. Kaynak kodu sohbet özetinden daha güncel kabul et.
4. Özel kurum/dizgi bilgisini public repoya yazma.
5. Normal geliştirmede hedefi koru: GitHub runtime güncellemesi → panelde `Güncelle`; tekrar CCX paketleme istisna olmalı.

## 10. GÜVENLİK / YAYIN KURALI

Public repoya commit etmeden önce özel kurum bilgisi, kişisel erişim anahtarı, token, parola veya private çalışma bilgisinin bulunmadığını kontrol et.

Public/private ayrımı bir dokümantasyon tercihi değil, proje kuralıdır.
