# Teknoloji Yığını

| Katman | Seçim | Gerekçe |
| --- | --- | --- |
| Dağıtım | Chrome/Edge Manifest V3 eklentisi | Mevcut kullanıcı oturumunu güvenli biçimde kullanır |
| Dil | TypeScript | DOM değişimleri ve veri modeli için tip güvenliği |
| Arayüz | React 19 | Küçük, bileşen tabanlı dashboard |
| Derleme | Vite 6 | Hızlı geliştirme ve küçük üretim çıktısı |
| Veri | Native IndexedDB | Ücretsiz, yerel ve yüksek kapasiteli |
| Zamanlama | `chrome.alarms` | MV3 uyumlu düşük maliyetli hatırlatma |
| Bildirim | `chrome.notifications` | Harici servis gerektirmez |
| Grafik | Native SVG | Ek paket ve bundle maliyeti yok |
| Test | Vitest, ikinci aşama | DOM adaptörü ortaya çıktığında eklenir |

## Bilinçli Olarak Kullanılmayanlar

- Backend ve bulut veritabanı
- Kullanıcı hesabı/şifre saklama
- Next.js, Electron ve Docker
- Redux veya başka global state kütüphanesi
- UI component ve grafik kütüphanesi
- Ücretli bildirim, analitik veya izleme servisi
