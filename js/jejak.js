/* Jejak klik WhatsApp -> Google Ads (conversion) + GA4 (event).
 *
 * KENAPA FAIL BERASINGAN: laman ini statik dan tiada borang, jadi SATU-SATUNYA
 * isyarat kejayaan yang wujud ialah klik ke WhatsApp. Kalau ia tidak dihantar
 * balik kepada Google, Google Ads hanya tahu bilangan klik iklan — ia tidak
 * pernah belajar carian mana yang jadi lead. Itu bermakna bidaan automatik
 * mengoptimum untuk KLIK, bukan pelanggan.
 *
 * ID di bawah:
 *   AW-939345913 / E1ZBCPi2_uccEPmP9b8D  = "Klik WhatsApp - Medal" (Ads)
 *   G-KM319D48QV                          = stream GA4 medallanyard.com
 *
 * ⚠️ Nilai RM1.00 di bawah BUKAN nilai jualan — ia cuma penanda supaya setiap
 * lead ada berat yang sama. Jangan tafsir "Conv. value" dalam Ads sebagai hasil.
 */
(function () {
  'use strict';

  var AW = 'AW-939345913/E1ZBCPi2_uccEPmP9b8D';

  function lokasi(a) {
    // Bahagian mana butang itu ditekan — supaya kita tahu butang mana yang
    // betul-betul berfungsi (hero? harga? butang terapung?), bukan sekadar
    // jumlah keseluruhan.
    if (a.classList.contains('wa-terapung')) return 'terapung';
    if (a.closest('.topbar')) return 'topbar';
    if (a.closest('.kaki')) return 'kaki';
    // Hero ialah <section class="hero"> tanpa id — tanpa baris ni butang
    // PALING penting di laman jatuh ke dalam baldi "lain".
    if (a.closest('.hero')) return 'hero';
    // Butang kalkulator duduk dalam section#harga — asingkan supaya kita
    // boleh ukur sama ada kalkulator itu sendiri menjana lead.
    if (a.closest('.kalkulator')) return 'kalkulator';
    var sek = a.closest('section');
    return (sek && sek.id) ? sek.id : 'lain';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
    if (!a) return;

    // Kalau penanda disekat (adblock / rangkaian gagal), JANGAN buat apa-apa
    // selain benarkan pautan berjalan. Ukuran tidak boleh memecahkan jualan.
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'conversion', {
      send_to: AW,
      value: 1.0,
      currency: 'MYR'
    });

    // Event GA4 berasingan supaya laporan Analytics guna nama yang boleh dibaca
    // manusia, bukan "conversion" yang generik.
    window.gtag('event', 'klik_whatsapp', {
      lokasi_butang: lokasi(a)
    });

    // Tiada preventDefault: semua pautan wa.me guna target="_blank", jadi
    // halaman ini kekal terbuka dan permintaan penanda sempat dihantar.
    // Menahan navigasi di sini hanya menambah risiko tanpa faedah.
  }, false);
})();
