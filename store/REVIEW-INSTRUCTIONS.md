# Chrome Web Store İnceleme Talimatı

Eklentinin temel işlevi giriş yapılmış bir Sahibinden.com hesabındaki favori
ilanları yerel olarak takip etmektir.

## Test Adımları

1. Chrome'da test hesabıyla Sahibinden.com'a giriş yapın.
2. En az bir ilanı favorilere ekleyin.
3. `https://banaozel.sahibinden.com/favori-ilanlar` sayfasını açın.
4. Araç çubuğundaki Favori Radar simgesine tıklayın.
5. Panelde `Tümünü yeniden tara` düğmesine basın.
6. Tarama aşamalarının panelde ilerlediğini doğrulayın.
7. Bir kategori kartını, ardından bir ilanı açın.
8. İlan detaylarının ve fiyat geçmişinin panel içinde gösterildiğini doğrulayın.
9. `Sahibinden ilanını aç` düğmesinin yalnızca kullanıcı tıklayınca yeni sekme
   açtığını doğrulayın.

Eklenti verileri uzak bir sunucuya aktarmaz. Tüm ilan ve fiyat geçmişi
eklentiye ait yerel IndexedDB veritabanında tutulur.
