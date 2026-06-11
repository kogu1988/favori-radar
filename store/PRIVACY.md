# Favori Radar Gizlilik Politikası

Son güncelleme: 11 Haziran 2026

Favori Radar, kullanıcının Sahibinden.com hesabındaki favori ilanları ve fiyat
değişimlerini kendi cihazında takip etmesine yardımcı olan bir tarayıcı
eklentisidir.

## İşlenen Veriler

Eklenti, favori ilan sayfalarında ve ilan detay sayfalarında kullanıcıya
gösterilen şu verileri işleyebilir:

- İlan başlığı, bağlantısı, kategorisi, konumu ve açıklaması
- İlan özellikleri ve görselleri
- İlan fiyatı ve fiyatın gözlemlendiği tarih
- Satıcı adı, satıcı türü ve sayfada görünür telefon numarası
- Kullanıcının oluşturduğu favori liste adı

## Kullanım Amacı

Bu veriler yalnızca favori ilanları düzenlemek, ilan detaylarını göstermek ve
fiyat değişikliklerini takip etmek amacıyla kullanılır.

## Saklama ve Aktarım

Veriler tarayıcının yerel depolama alanında ve IndexedDB veritabanında saklanır.
Favori Radar'ın bir sunucusu yoktur. Veriler geliştiriciye veya üçüncü taraflara
gönderilmez, satılmaz ve reklam amacıyla kullanılmaz.

## İzinler

- `storage`: Tarama durumunu ve eklenti ayarlarını yerel olarak saklamak için.
- `tabs`: Favori sayfasını bulmak, açmak ve kullanıcı isteğiyle ilana gitmek için.
- `alarms`: Yerel yenileme hatırlatıcısını planlamak için.
- Sahibinden.com alan izinleri: Favori listelerini ve ilan detaylarını, açık
  kullanıcı oturumuyla okuyabilmek için.

## Veri Silme

Kullanıcı eklentiyi kaldırarak Chrome'un eklentiye ait yerel verilerini
silebilir. Tarayıcı ayarlarından eklenti depolama verileri de ayrıca
temizlenebilir.

## Güvenlik ve Sorumluluk

Eklenti giriş bilgilerini veya parolaları okumaz. Sahibinden.com sayfalarının
yapısı değiştiğinde bazı özellikler geçici olarak çalışmayabilir.

Favori Radar, Sahibinden.com tarafından geliştirilmemiştir ve Sahibinden.com
ile resmi bir bağlantısı yoktur.

## İletişim

Destek: favoriradar@gmail.com
