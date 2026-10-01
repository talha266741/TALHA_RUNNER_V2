# TALHA RUNNER — BENİ OKU

> Bu dosya TALHA RUNNER V2'nin PUBLIC proje hafızasıdır. Yeni bir geliştirme oturumunda önce bu dosya, ardından repodaki güncel kaynak kod okunmalıdır.

## 1. PROJE

TALHA RUNNER V2, Adobe InDesign içinde JavaScript/ExtendScript kodlarını hızlı biçimde çalıştırmak için geliştirilen bir UXP panelidir.

Runner görev-özel dizgi mantığı içermez. Soru dizme, stil uygulama, tablo düzenleme vb. işler Runner'ın içine gömülmez; editörde çalıştırılan kod parçalarında bulunur. Runner altyapıdır: kod girişi → çalıştırma → durum → geçmiş/favoriler → güncelleme.

Repo: `talha266741/TALHA_RUNNER_V2`
Görünürlük: PUBLIC
Ana dal: `main`

## 2. PUBLIC / PRIVATE BİLGİ AYRIMI — KESİN KURAL

Bu public repo yalnız TALHA RUNNER'ın genel kaynak kodunu, mimarisini, sürüm bilgisini ve genel geliştirme kararlarını içerir.

Müşteri/kurum/işveren özelinde öğrenilmiş dizgi bilgileri, gerçek belge adları, özel stil yolları/değerleri, sembol eşlemeleri, üretim kuralları ve benzeri kuruma özgü bilgiler BU REPOYA YAZILMAZ.

Bu tür bilgiler ayrı bir PRIVATE bilgi deposunda tutulur. Runner geliştirmesi için gerekli olmayan özel iş bilgisi public dokümantasyona taşınmaz.

## 3. TEMEL DOSYALAR

- `manifest.json`: UXP eklenti kimliği, sürüm, InDesign host bilgisi, izinler ve panel tanımı.
- `index.html`: panel kabuğu ve görünümü.
- `main.js`: bootstrap/Core davranışı, InDesign entegrasyonu ve güncelleme altyapısı.
- `BENI_OKU.md`: yalnız public proje hafızası ve genel teknik kararlar.
- Güncelleme runtime dosyaları: normal Runner geliştirmelerinin yeniden CCX kurulumu gerektirmeden dağıtılacağı katman.

## 4. HEDEF GÜNCELLEME MİMARİSİ

Kullanıcı bir kez updater özellikli Core/Bootstrap CCX paketini kurar. Bundan sonraki normal Runner değişikliklerinde hedef kullanıcı akışı yalnızca paneldeki `Güncelle` düğmesine basmaktır.

Kurulu plugin paketinin kendi dosyalarını değiştirmesine güvenilmez. Core sabit bootstrap olarak kalır; güncellenebilir Runner runtime'ı public GitHub kaynağından HTTPS ile alınır ve UXP'nin kalıcı yazılabilir plugin-data alanında saklanır.

Hedef akış:

1. Core açılır.
2. Son çalışan runtime plugin-data alanından yüklenir; yoksa paket içindeki fallback kullanılır.
3. Kullanıcı `Güncelle` düğmesine basar.
4. Core public update manifestini kontrol eder.
5. Yeni runtime varsa indirir ve doğrular.
6. Aday runtime güvenli biçimde kaydedilir ve etkinleştirilir.
7. Güncelleme bozuksa mevcut/önceki çalışan runtime korunur veya geri yüklenir.
8. Ağ yoksa son çalışan runtime ile çevrimdışı kullanım sürer.

Normal UI/Runner davranışı değişiklikleri runtime katmanında tutulmalıdır. Core/manifest değişikliği gerektiren işler istisnadır; mimari bu ihtiyacı mümkün olduğunca azaltacak şekilde tasarlanmalıdır.

Plugin içine GitHub PAT/token/secrets gömülmez.

## 5. RUNNER'IN İKİ JAVASCRIPT ORTAMI

### A) UXP / Core-runtime katmanı

Runner'ın kendi kodu UXP JavaScript ortamında çalışır. InDesign ve UXP modülleri Core tarafından alınır. Güncellenebilir runtime mümkün olduğunca Core'un verdiği kontrollü context üzerinden çalışmalıdır.

### B) Runner editöründeki InDesign kodu

Editöre yapıştırılan kod InDesign'a şu mantıkla gönderilir:

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

## 6. GENEL SCRIPT GELİŞTİRME KURALLARI

- Runner editöründe çalıştırılan kod dış seviyede Runner tarafından `UndoModes.ENTIRE_SCRIPT` ile tek Undo altında tutulur. Snippet gereksiz yere tekrar ENTIRE_SCRIPT içine sarılmaz.
- Kod revizyonunda kullanıcıya satır yaması yaptırmak yerine tam çalışır kod veya doğrudan repo güncellemesi tercih edilir.
- Scriptlere otomatik son kullanma tarihi/tarih sınırı eklenmez.
- ScriptUI/dialog sonrası kullanıcı odağı ve gerçek son insertion point korunmaya çalışılır.
- Tablo hücresi bağlamında geçersiz story index varsayımlarından kaçınılır; hücrenin kendi `characters` / `insertionPoints` koleksiyonları dikkate alınır.
- İnceleme/dump araçları mümkün olduğunda belgeyi değiştirmeden ayrı çıktı üretir.
- `node --check` yalnız JavaScript sözdizimini doğrular; InDesign/UXP runtime doğrulaması olarak sunulmaz.

## 7. DOĞRULANMIŞ RUNNER ÖZELLİKLERİ

2.0.x hattında doğrulanmış temel davranışlar:

- InDesign UXP paneli açılır.
- Kod `app.doScript` ile çalışır ve Runner seviyesinde tek Undo kullanır.
- Ctrl+Enter çalıştırır.
- Editör temizlenebilir.
- İsteğe bağlı çalıştırma sonrası temizleme vardır.
- Geçmiş oturum içinde tutulur.
- Favoriler kalıcı saklanabilir; kaydetme/yükleme/yeniden adlandırma/silme akışları bulunur.
- İşlem sonrası InDesign odağını geri verme yaklaşımı bulunur.

## 8. BOOTSTRAP HEDEFİ

Updater özellikli bootstrap/Core hattı `2.1.x` olarak ele alınır. Bu hattın amacı, bir defalık manuel paket/kurulumdan sonra normal Runner geliştirmelerini `Güncelle` düğmesiyle dağıtmaktır.

Bootstrap tamamlanmadan kullanıcıya son CCX'i paketlemesi söylenmez.

## 9. GELİŞTİRME OTURUMU BAŞLANGIÇ KURALI

Yeni oturumda:

1. Bu `BENI_OKU.md` dosyasını oku.
2. `manifest.json`, `index.html`, `main.js` ve update/runtime dosyalarının güncel sürümlerini repodan çek.
3. Kaynak kodu sohbet özetinden daha güncel kabul et.
4. Özel kurum/dizgi bilgisi gerekiyorsa public repoya yazma; PRIVATE bilgi deposunu kullan.
5. Normal geliştirmede hedefi koru: kullanıcıya paket yaptırmak yerine GitHub güncellemesi → panelde `Güncelle`.

## 10. GÜVENLİK / YAYIN KURALI

Public repoya commit etmeden önce içerikte özel kurum bilgisi, kişisel erişim anahtarı, token, parola, özel belge verisi veya yalnız private bilgi deposunda bulunması gereken çalışma bilgisinin olmadığını kontrol et.

Public/private ayrımı bir dokümantasyon tercihi değil, proje kuralıdır.
