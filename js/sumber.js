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
 *     (ref: G-Ads)   = datang dari iklan Google
 *     (ref: ChatGPT) = datang dari iklan ChatGPT (utm_source=chatgpt & utm_medium=cpc,
 *                      05/10/2026 — akaun iklan OpenAI "Medal Lanyard Malaysia")
 *     (ref: Web)     = pelawat laman biasa (carian organik, kongsi pautan)
 * Sumber iklan TERAKHIR menang (last click), diingat 30 hari.
 *
 * ⚠️ Kod ini DIBACA oleh sistem (dashboard/leads/_laporan_harian.py →
 * TANDA_GOOGLE / TANDA_CHATGPT). Tukar teks di sini = tukar di sana juga, kalau tidak lead
 * Google hilang dari laporan tanpa sebarang ralat.
 */
(function () {
  'use strict';

  var KUNCI = 'ml_sumber_iklan';
  var TEMPOH_MS = 30 * 24 * 60 * 60 * 1000;
  var TANDA = { gads: '(ref: G-Ads)', chatgpt: '(ref: ChatGPT)', web: '(ref: Web)' };

  // Sumber iklan lawatan INI: 'gads' / 'chatgpt' / null.
  function sumberUrl() {
    var q = new URLSearchParams(window.location.search);
    if (q.get('gclid') || q.get('gbraid') || q.get('wbraid')) return 'gads';
    var src = (q.get('utm_source') || '').toLowerCase();
    var paid = /^(cpc|ppc|paid)/i.test(q.get('utm_medium') || '');
    if (paid && src === 'google') return 'gads';
    // ChatGPT biasa (bukan iklan) tambah utm_source=chatgpt.com tanpa medium
    // -> itu bukan iklan, jadi syarat cpc WAJIB.
    if (paid && src === 'chatgpt') return 'chatgpt';
    return null;
  }

  function ingat() {
    var kini = sumberUrl();
    try {
      if (kini) {
        localStorage.setItem(KUNCI, JSON.stringify({ s: kini, t: Date.now() }));
        return kini;
      }
      var v = localStorage.getItem(KUNCI) || '';
      // Format lama (sebelum 05/10/2026) = cap masa sahaja -> iklan Google.
      var o = /^\d+$/.test(v) ? { s: 'gads', t: Number(v) } : JSON.parse(v || 'null');
      if (o && TANDA[o.s] && Date.now() - o.t < TEMPOH_MS) return o.s;
      return 'web';
    } catch (e) {
      // Storan disekat (mod peribadi): masih betul untuk lawatan ini.
      return kini || 'web';
    }
  }

  var tanda = TANDA[ingat()];

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
