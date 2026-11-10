# BidAgent

BidAgent, KOBİ'lerin veya orta ölçekli şirketlerin kamu ya da büyük kurumsal firmalar tarafından yayınlanan onlarca sayfalık karmaşık teknik şartnameleri ve ihale dosyalarını inceleme sürecini otomatikleştirir.

---

## 🚀 Özellikler

1. **Güvenli Kimlik Doğrulama & Oturum Yönetimi:**
   - E-posta ile kayıt olma (her e-posta adresi ile yalnızca tek bir hesap oluşturulabilir).
   - Kullanıcı tarafından belirlenen parola.
   - **Şifremi Unuttum**: Kullanıcının kayıtlı e-posta adresine tek kullanımlık geçici şifre iletilir ve kullanıcı bu şifreyle sisteme giriş yapabilir.
   - Kullanıcıların e-posta, parola ve **oturum açma tarihleri / zaman damgaları (LoginLog)** veritabanına otomatik olarak kaydedilir.

2. **Sayfa 1: Döküman Yükleme & Yönetim Alanı:**
   - **Ortada PDF Yükleme Alanı**: Sürükle-bırak veya dosya seçici ile PDF dosyaları sisteme yüklenir.
   - **Sol Kullanıcı Paneli (Sidebar)**:
     - En üstte döküman filtreleme ve arama çubuğu.
     - Yüklenen dökümanların listesi (başlık, otomatik hesaplanan sayfa sayısı, dosya boyutu ve yüklenme tarihi).
     - Dökümana tıklandığında doğrudan inceleme ekranına geçiş.
   - **Sağ Üst Köşe**: Kullanıcı adı/e-postası ve açılır menü (Oturum açma geçmişi modalı ve çıkış yap butonu).
   - Yeni bir PDF yüklendiğinde **otomatik olarak İkinci Sayfaya** geçiş yapılır.

3. **Sayfa 2: İnceleme & Chat & Çift Ekran Görünümü:**
   - Sol panelden dökümanlar görüntülenmeye devam edebilir.
   - **Chat Ekranı**: Kullanıcı dökümanla ilgili sorularını yazar ve ok tuşuna (veya Enter'a) basar.
   - **Yanıt Alanı**: Soru gönderildiğinde chat kutusunun üstünde asistan yanıt alanı açılır (kullanıcı talebi doğrultusunda şimdilik alan ayrılmış ve boş bırakılmıştır).
   - **PDF'i Görüntüle Butonu**:
     - Tıklandığında sayfa dikey olarak ikiye bölünür (Sol: Chat Ekranı, Sağ: PDF Görüntüleyici).
     - Sol kullanıcı paneli otomatik olarak sola doğru kapanır.
     - İstenirse **"Paneli Genişlet"** butonu ile sol panel yeniden açılabilir.
     - PDF dökümanı yakınlaştırma, sayfa atlama, yeni sekmede açma ve indirme seçenekleriyle entegre görüntülenir.

---

## 🛠️ Kurulum & Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Veritabanını oluşturun ve eşitleyin
npx prisma db push

# 3. Geliştirici sunucusunu başlatın
npm run dev
```

Sunucu başladıktan sonra tarayıcınızdan **`http://localhost:3000`** adresine giderek uygulamayı kullanabilirsiniz.

---

## 🗄️ Veritabanı Mimarisi (SQLite / Prisma)

- **User**: Kullanıcı hesabı, benzersiz e-posta, hash'lenmiş şifre, geçici şifre durumu.
- **LoginLog**: Kullanıcının oturum açtığı tarih/saat, IP adresi ve tarayıcı bilgisi.
- **Document**: Yüklenen PDF dosyasının adı, fiziksel yolu, boyutu, hesaplanan sayfa sayısı ve yüklenme tarihi.
- **ChatMessage**: Döküman özelindeki sorular ve yanıt alanı.
