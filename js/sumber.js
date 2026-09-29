/* Tanda SUMBER lead dalam mesej WhatsApp pertama (Boss 17/09/2026).
 *
 * KENAPA: lead iklan Facebook dikenal pasti sendiri (WhatsApp bawa ID iklan),
 * tetapi pelawat dari iklan Google datang melalui laman ini dan tiba di
 * WhatsApp tanpa sebarang tanda. Laporan 6 petang jadi kira belanja Google
 * tetapi tidak kira lead Google — cost per lead Medal nampak lebih teruk.
 *
 * CARA: Google Ads (auto-tagging ON) tambah ?gclid=… pada setiap klik iklan.
 * Kita ingat itu selama 30 hari, dan tambah kod ringkas di hujung teks
 * WhatsApp yang siap diisi:
 *     (ref: G-Ads)  = datang dari iklan Google
 *     (ref: Web)    = pelawat laman biasa (carian organik, kongsi pautan)
 *
 * ⚠️ Kod ini DIBACA oleh sistem (dashboard/leads/_laporan_harian.py →
 * TANDA_GOOGLE). Tukar teks di sini = tukar di sana juga, kalau tidak lead
 * Google hilang dari laporan tanpa sebarang ralat.
 */
(function () {
  'use strict';

  var KUNCI = 'ml_sumber_iklan';
  var TEMPOH_MS = 30 * 24 * 60 * 60 * 1000;
  var TANDA_GOOGLE = '(ref: G-Ads)';
  var TANDA_WEB = '(ref: Web)';

  function dariGoogleAds() {
    var q = new URLSearchParams(window.location.search);
    if (q.get('gclid') || q.get('gbraid') || q.get('wbraid')) return true;
    return q.get('utm_source') === 'google' &&
      /^(cpc|ppc|paid)/i.test(q.get('utm_medium') || '');
  }

  function ingat() {
    try {
      if (dariGoogleAds()) {
        localStorage.setItem(KUNCI, String(Date.now()));
        return true;
      }
      var t = Number(localStorage.getItem(KUNCI) || 0);
      return t > 0 && Date.now() - t < TEMPOH_MS;
    } catch (e) {
      // Storan disekat (mod peribadi): masih betul untuk lawatan ini.
      return dariGoogleAds();
    }
  }

  var tanda = ingat() ? TANDA_GOOGLE : TANDA_WEB;

  function tandakan(a) {
    try {
      var url = new URL(a.href);
      var teks = url.searchParams.get('text') ||
        'Hai, saya berminat dengan medal.';
      if (teks.indexOf('(ref:') !== -1) return;   // dah bertanda
      // Teks yang berakhir dgn ":" menunggu customer menaip (cth "Anggaran
      // kuantiti saya: ") — tanda di HUJUNG akan terselit sebelum jawapannya.
      var baru = /:\s*$/.test(teks)
        ? tanda + '\n' + teks
        : teks.replace(/\s+$/, '') + '\n\n' + tanda;
      url.searchParams.set('text', baru);
      a.href = url.toString();
    } catch (e) { /* pautan pelik — biar asal, jualan lebih penting */ }
  }

  // Pautan yang ditulis semula selepas laman dimuat (kalkulator harga.js)
  // kehilangan tanda — ia mesti panggil ini setiap kali tukar href.
  window.mlTandakan = tandakan;

  function semua() {
    var pautan = document.querySelectorAll('a[href*="wa.me"]');
    for (var i = 0; i < pautan.length; i++) tandakan(pautan[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', semua);
  } else {
    semua();
  }
})();
