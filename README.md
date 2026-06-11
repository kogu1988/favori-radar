# Favori Radar

Favori ilanların bilgilerini ve fiyat geçmişini kullanıcının cihazında tutan
hafif bir Chrome/Edge eklentisi.

## Geliştirme

```powershell
npm install
npm run build
```

Ardından Chrome/Edge eklentiler sayfasında geliştirici modunu açıp `dist`
klasörünü paketlenmemiş eklenti olarak yükleyin.

Mimari için [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), teknoloji kararları
için [docs/STACK.md](docs/STACK.md) dosyasına bakın.

## Mevcut Durum

Eklenti favori listelerini ve ilanları tarar; ilan, satıcı, görünür telefon,
kategoriye özel detay ve fiyat geçmişini yerel IndexedDB içinde saklar.

## Kullanım

1. Sahibinden.com hesabınıza giriş yapın.
2. `Favori İlanlar` sayfasını açın.
3. Eklenti simgesine tıklayarak paneli açın.
4. `Tümünü yeniden tara` ile tam taramayı başlatın.
5. Kategori kartından ilanları, ilan kartından detay ve fiyat geçmişini açın.

Veriler harici bir sunucuya gönderilmez. Eklenti yalnızca açık Sahibinden
oturumunuz ve tarayıcınızdaki yerel depolama ile çalışır.

## Mağaza Paketi

```powershell
npm run release
```

Komut temiz build alır ve Chrome Web Store'a yüklenebilecek
`release/favori-radar-1.0.0.zip` dosyasını üretir.

Yayın belgeleri için [store/README.md](store/README.md) dosyasına bakın.

Gizlilik politikası:
[https://kogu1988.github.io/favori-radar/](https://kogu1988.github.io/favori-radar/)
