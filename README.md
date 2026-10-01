# TALHA RUNNER V2

**Yapay zekâya ne yapmak istediğini anlat. Kodu al. InDesign'da çalıştır. İşine yarıyorsa favoriye kaydet.**

TALHA RUNNER, Adobe InDesign içinde JavaScript / ExtendScript kodlarını hızlıca çalıştırmak için geliştirilmiş açık kaynak bir UXP panelidir.

Ama asıl kullanım fikri bundan daha basit:

> InDesign'da yapmak istediğin işi ChatGPT veya kullandığın başka bir yapay zekâya tarif et. Üretilen kodu TALHA RUNNER'a yapıştır ve çalıştır.

Her küçük otomasyon için ayrı bir script dosyası oluşturmak, Scripts klasörünü bulmak, dosyayı kaydetmek ve sonra tekrar aramak zorunda kalmadan; fikirden çalışan otomasyona mümkün olduğunca kısa bir yol sunmayı amaçlar.

---

## Neden yaptık?

InDesign çok güçlü bir otomasyon altyapısına sahip. Fakat günlük kullanımda küçük bir işi otomatikleştirmek istediğinde süreç çoğu zaman gereğinden uzun olabiliyor:

```text
Bir iş fark et
      ↓
Script yaz / yazdır
      ↓
Dosya oluştur
      ↓
Doğru klasöre kaydet
      ↓
Scripts panelinden bul
      ↓
Çalıştır
```

Üretken yapay zekâ ile artık kodu üretmek çok daha kolay. TALHA RUNNER bu yeni çalışma biçimine uygun basit bir köprü oluşturmak için doğdu:

```text
Ne istediğini yapay zekâya anlat
              ↓
        Kodu ürettir
              ↓
    TALHA RUNNER'a yapıştır
              ↓
          ÇALIŞTIR
              ↓
      İşine yaradı mı?
              ↓
       ★ Favoriye Kaydet
```

Amaç, InDesign kullanıcısının programcı olmak zorunda kalmadan kendi küçük otomasyonlarını deneyebilmesi; geliştiricinin ise test etmek istediği kodu hızla çalıştırabilmesidir.

---

## Nasıl kullanılır?

### 1. Yapay zekâya derdini anlat

Örneğin:

> “InDesign'da seçili metindeki çift boşlukları tek boşluğa çeviren bir JavaScript yaz. İşlem tek Undo ile geri alınabilsin.”

veya:

> “Açık belgede seçili tablonun tüm hücrelerindeki metni ortala.”

veya tamamen kendi iş akışına özgü başka bir işlem.

Yapay zekâdan **InDesign JavaScript / ExtendScript olarak çalıştırılabilecek kodu** vermesini iste.

### 2. Kodu TALHA RUNNER'a yapıştır

Paneldeki kod alanına gelen kodu yapıştır.

### 3. Çalıştır

**▶ ÇALIŞTIR** düğmesine bas veya `Ctrl + Enter` kullan.

Runner kodu InDesign'a gönderir ve işlemi `UndoModes.ENTIRE_SCRIPT` altında çalıştırır. Böylece uygun işlemler InDesign'da tek bir geri alma adımı olarak tutulabilir.

### 4. İşe yarayan kodu sakla

Kod tekrar kullanacağın bir araç haline geldiyse **★ Favoriye Kaydet** ile isim vererek saklayabilirsin.

Bir defalık denemeler için **Geçmiş**, sürekli kullandığın araçlar için **Favorilerim** vardır.

Bugün yapay zekâdan istediğin küçük bir işlem, yarın tek tıklamayla kullandığın kişisel InDesign aracına dönüşebilir.

---

## TALHA RUNNER ne değildir?

TALHA RUNNER belirli bir yayınevine, tasarım sistemine veya tek bir iş akışına bağlı otomasyon paketi değildir.

Runner'ın görevi mümkün olduğunca genel kalmaktır:

**kod girişi → çalıştırma → durum → geçmiş → favoriler → güncelleme**

Belirli bir işi yapan asıl mantık, çalıştırdığın kodun içindedir. Bu nedenle aynı Runner; metin temizleme, paragraf stilleri, tablolar, belge kontrolleri, toplu düzenlemeler veya senin geliştirdiğin bambaşka InDesign otomasyonları için kullanılabilir.

---

## Özellikler

- InDesign içinde doğrudan kod editörü
- JavaScript / ExtendScript kodlarını hızlı çalıştırma
- `Ctrl + Enter` kısayolu
- Runner seviyesinde `UndoModes.ENTIRE_SCRIPT`
- Son çalıştırılan kodlar için oturum geçmişi
- Kalıcı favoriler
- Favorileri yeniden adlandırma ve silme
- Çalıştırma sonrası kod alanını isteğe bağlı temizleme
- İşlem durumu ve hata mesajları
- UXP tabanlı panel

> **Not:** Güncelleme altyapısı aktif geliştirme aşamasındadır. README'deki özellikler kararlı hale geldikçe güncellenecektir.

---

## Kimler için?

TALHA RUNNER özellikle şu çalışma biçimlerine uygundur:

- InDesign'da tekrar eden işleri hızlandırmak isteyen kullanıcılar
- ChatGPT ve benzeri yapay zekâlardan InDesign otomasyonu üretmek için yararlananlar
- Her deneme için ayrı `.jsx` dosyası oluşturmak istemeyenler
- Küçük scriptleri hızlı test etmek isteyen geliştiriciler
- Zamanla kendi kişisel InDesign araç kütüphanesini oluşturmak isteyenler

Kod bilmiyorsan da kullanabilirsin; ancak yapay zekânın ürettiği kodun InDesign belgen üzerinde gerçek değişiklikler yapabileceğini unutmamalısın.

---

## Güvenlik

TALHA RUNNER kendisine verilen kodu çalıştırmak için tasarlanmıştır. Bu aynı zamanda güçlü ve dikkat gerektiren bir özelliktir.

Tanımadığın veya güvenmediğin kodu çalıştırma. Yapay zekâ tarafından üretilmiş kodu özellikle önemli belgelerde kullanmadan önce kontrol etmek ve yedek üzerinde denemek iyi bir pratiktir.

Runner'ın tek Undo yaklaşımı güvenliği ve rahat denemeyi artırır; ancak her dış etki veya her script davranışının InDesign Undo sistemi tarafından geri alınabileceği garanti edilemez.

---

## Teknik çalışma biçimi

Panel UXP JavaScript ile çalışır. Editöre yapıştırılan kod ise InDesign'a kabaca şu mekanizmayla gönderilir:

```js
app.doScript(
    code,
    ScriptLanguage.JAVASCRIPT,
    undefined,
    UndoModes.ENTIRE_SCRIPT,
    "Talha Runner V2"
);
```

Bu nedenle TALHA RUNNER'ın kendi UXP kodu ile editöre yapıştırılan InDesign JavaScript kodu iki farklı katmandır.

Runner'da çalıştırılacak scripti bir yapay zekâya hazırlatırken şu tür bir talep kullanabilirsin:

> “Adobe InDesign için JavaScript / ExtendScript uyumlu kod üret. Kod TALHA RUNNER adlı panel tarafından `app.doScript` ile zaten `UndoModes.ENTIRE_SCRIPT` altında çalıştırılacak; bu yüzden kodu tekrar `app.doScript` içine sarma.”

---

## Projenin durumu

TALHA RUNNER aktif olarak geliştiriliyor. Projenin hedeflerinden biri, kurulumdan sonra Runner'ın normal güncellemelerini paneldeki **Güncelle** düğmesi üzerinden mümkün olduğunca zahmetsiz hale getirmektir.

Kaynak kod açık tutuluyor; fikir, hata bildirimi ve katkılar memnuniyetle karşılanır.

---

## Geliştirme

Proje Adobe InDesign UXP eklentisidir. Kaynak kodu geliştirme amacıyla yüklemek için Adobe UXP Developer Tool kullanılabilir.

Temel dosyalar:

```text
manifest.json   → eklenti tanımı ve izinler
index.html      → panel arayüzü
main.js         → Runner davranışı
BENI_OKU.md     → proje mimarisi ve geliştirme kararları
```

`BENI_OKU.md`, projeyi geliştirecek kişiler ve yapay zekâ ajanları için teknik bağlamı koruyan geliştirici notudur.

---

## Katkı

Bir hata bulduysan, kullanım fikrin varsa veya Runner'ın daha iyi olmasını sağlayacak bir geliştirme düşünüyorsan GitHub Issues üzerinden paylaşabilirsin.

Proje henüz genç. Gerçek InDesign iş akışlarından gelen geri bildirim özellikle değerlidir.

---

## Kısa versiyon

**InDesign'da bir işi otomatikleştirmek mi istiyorsun?**

Yapay zekâya anlat → kodu al → TALHA RUNNER'a yapıştır → çalıştır → beğendiysen favoriye kaydet.

Hepsi bu.
