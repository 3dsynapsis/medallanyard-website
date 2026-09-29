/* Kalkulator harga medal (Boss 29/09/2026).
 *
 * HARGA & TIER di bawah = SALINAN price list rasmi Medal di dashboard
 * (Sales → Price List; table price_list + price_list_diskaun). Laman ini
 * statik & PUBLIC — ia tak boleh baca DB. Bila Boss ubah harga di dashboard,
 * ubah di sini JUGA, serta nilai awal + JSON-LD dlm index.html. JANGAN sesekali
 * letak harga kos di fail ini.
 *
 * Peraturan kira mesti SAMA dgn jadual dashboard, supaya angka laman = angka
 * yang salesman quote: diskaun tier dikenakan pada SETIAP item (lanyard juga),
 * dan harga seunit setiap item dibundarkan ke 2 tempat perpuluhan dahulu.
 */
(function () {
  'use strict';

  var HARGA = {
    acrylic: { 1: 10.56, 2: 12.00 },
    kayu:    { 1: 11.00, 2: 13.00 },
    lanyard: 4.00
  };
  // [kuantiti minimum, % diskaun]
  var TIER = [[50, 0], [100, 20], [200, 23], [300, 25], [500, 27], [1000, 30]];
  var MIN = 50, MAX = 10000;
  var NAMA = { acrylic: 'Acrylic', kayu: 'Kayu' };
  var WA = 'https://wa.me/60182327747';

  var akar = document.getElementById('kalkulator');
  if (!akar) return;

  function $(id) { return document.getElementById(id); }
  function bulat(x) { return Math.round(x * 100) / 100; }
  function rm(x) {
    return x.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pcs(n) { return Math.round(n).toLocaleString('en-MY'); }

  function diskaunUntuk(q) {
    var d = 0;
    for (var i = 0; i < TIER.length; i++) if (q >= TIER[i][0]) d = TIER[i][1];
    return d;
  }
  function lepasDiskaun(harga, d) { return bulat(harga * (100 - d) / 100); }

  function kira(material, muka, q, lanyard) {
    var d = diskaunUntuk(q);
    var medal = lepasDiskaun(HARGA[material][muka], d);
    var lan = lanyard ? lepasDiskaun(HARGA.lanyard, d) : 0;
    var seunit = bulat(medal + lan);
    var asas = bulat(HARGA[material][muka] + (lanyard ? HARGA.lanyard : 0));
    // `jumlah` hanya utk banding tier dlm cadangan() — JANGAN dipapar
    // (Boss 29/09/2026: angka RM3,000++ buat customer rasa mahal).
    return {
      d: d, medal: medal, lanyard: lan, seunit: seunit,
      jumlah: bulat(seunit * q), jimatSeunit: bulat(asas - seunit)
    };
  }

  /* ── Elemen ── */
  var borang = akar.querySelector('.kk-kawalan');
  var inQty = $('kk-qty');
  var inLan = $('kk-lanyard');
  var bantu = $('kk-qty-bantu');
  var chip = akar.querySelectorAll('.kk-tangga button');   // pemilih kuantiti pantas
  var nod = akar.querySelectorAll('.kk-tangga li');
  var isi = akar.querySelector('.kk-isi');
  var kotakCadang = $('kk-cadang');
  var lencana = $('kk-lencana');
  var cta = $('kk-cta');
  var status = $('kk-status');
  var BANTU_ASAL = bantu.textContent;
  // Tanda sumber yang sedia ada pada href semasa. sumber.js menanda pada
  // DOMContentLoaded — SELEPAS fail defer ini jalan — jadi baca setiap kali,
  // jangan sekali sahaja masa mula.
  function tandaDari(href) {
    try {
      var m = (new URL(href).searchParams.get('text') || '').match(/\(ref: [^)]+\)/);
      return m ? m[0] : null;
    } catch (e) { return null; }
  }

  function pilihan(nama) {
    var el = borang.querySelector('input[name="' + nama + '"]:checked');
    return el ? el.value : null;
  }
  function qtyMentah() {
    var n = parseInt(inQty.value, 10);
    return isNaN(n) ? 0 : n;
  }

  /* ── Nombor bergerak (Motion) — hiasan sahaja; tanpa Motion terus tukar ── */
  var GERAK = !!(window.Motion && document.documentElement.classList.contains('gerak'));
  var dipapar = {}, kawal = {};
  function tunjuk(id, nilai) {
    var el = $(id);
    if (!el) return;
    var dari = dipapar[id];
    dipapar[id] = nilai;
    if (kawal[id]) { kawal[id].stop(); kawal[id] = null; }
    // Tab tersorok = requestAnimationFrame berhenti → nombor tersangkut pada
    // nilai LAMA (harga salah!). Terus tulis nilai akhir.
    if (!GERAK || document.hidden || dari === undefined || dari === nilai) {
      el.textContent = rm(nilai);
      return;
    }
    kawal[id] = window.Motion.animate(dari, nilai, {
      duration: 0.45, ease: [0.22, 1, 0.36, 1],
      onUpdate: function (v) { el.textContent = rm(v); },
      onComplete: function () { el.textContent = rm(nilai); }
    });
  }

  /* ── Cadangan tier seterusnya ──
     Kes paling berharga: harga jatuh begitu banyak di tier baru sehingga
     JUMLAH untuk kuantiti lebih besar jadi LEBIH MURAH (cth 90 pcs = RM1,310
     tapi 100 pcs = RM1,165). Customer yang tak perasan akan bayar lebih.
     Teks sengaja TANPA angka jumlah — lihat nota dlm kira(). */
  function cadangan(material, muka, q, lanyard, kini) {
    if (q > 1000) {
      return { teks: 'Lebih 1,000 pcs? Kami boleh beri <b>harga khas</b> — sebut kuantiti anda dalam WhatsApp.' };
    }
    if (q === 1000) {
      return { teks: 'Anda dah dapat <b>diskaun maksimum 30%</b>. Tempahan lebih besar — tanya harga khas.' };
    }
    for (var i = 0; i < TIER.length; i++) {
      var t = TIER[i][0];
      if (t <= q) continue;
      var h = kira(material, muka, t, lanyard);
      if (h.jumlah <= kini.jumlah) {
        return {
          teks: 'Tempah <b>' + pcs(t) + ' pcs</b> — dapat ' + pcs(t - q) + ' pcs lagi tapi bayar <b>kurang</b> ' +
            'daripada ' + pcs(q) + ' pcs. Harga turun ke <b>RM' + rm(h.seunit) + '/pcs</b>.',
          ke: t, butang: 'Tukar ke ' + pcs(t) + ' pcs'
        };
      }
      // Hanya galakkan bila lompatan munasabah — jangan suruh 300 jadi 500.
      if (t - q <= q * 0.5) {
        return {
          teks: 'Tambah <b>' + pcs(t - q) + ' pcs</b> lagi → harga turun ke <b>RM' + rm(h.seunit) +
            '/pcs</b> (diskaun ' + h.d + '%).',
          ke: t, butang: 'Guna ' + pcs(t) + ' pcs'
        };
      }
      return null;
    }
    return null;
  }

  function lukisCadangan(c) {
    if (!c) { kotakCadang.hidden = true; kotakCadang.innerHTML = ''; return; }
    kotakCadang.innerHTML =
      '<svg class="ik" aria-hidden="true"><use href="#i-tag"/></svg><div><p>' + c.teks + '</p>' +
      (c.ke ? '<button type="button" data-ke="' + c.ke + '">' + c.butang +
        ' <svg class="ik" aria-hidden="true"><use href="#i-arrow"/></svg></button>' : '') +
      '</div>';
    kotakCadang.hidden = false;
  }

  function teksWA(material, muka, q, lanyard, h) {
    return 'Hai, saya nak sahkan sebut harga medal:\n' +
      '• Medal ' + NAMA[material] + ' ' + muka + ' muka\n' +
      '• Lanyard custom: ' + (lanyard ? 'Ya' : 'Tidak') + '\n' +
      '• Kuantiti: ' + pcs(q) + ' pcs\n' +
      'Anggaran di laman: RM' + rm(h.seunit) + '/pcs\n\n' +
      'Boleh bantu sahkan?';
  }

  /* ── Lukis semua ── */
  var diskaunLepas = null, tundaStatus = null;
  function render(awal) {
    var material = pilihan('material'), muka = pilihan('muka');
    var lanyard = inLan.checked;
    var mentah = qtyMentah();
    var q = Math.min(Math.max(mentah, MIN), MAX);
    var kurang = mentah < MIN;

    bantu.textContent = kurang ? 'Minimum tempahan 50 pcs — anggaran dikira untuk 50 pcs.' : BANTU_ASAL;
    bantu.classList.toggle('kk-ralat', kurang);
    inQty.setAttribute('aria-invalid', kurang ? 'true' : 'false');

    var h = kira(material, muka, q, lanyard);

    tunjuk('kk-seunit', h.seunit);
    tunjuk('kk-r-seunit', h.seunit);
    $('kk-r-qty').textContent = pcs(q) + ' pcs';
    $('kk-r-diskaun').textContent = h.d ? 'Diskaun −' + h.d + '%' : 'Harga asas';
    $('kk-baris-jimat').hidden = h.jimatSeunit <= 0;
    $('kk-jimat').textContent = 'RM' + rm(h.jimatSeunit) + '/pcs';

    // Senarai harga seunit setiap tier utk pilihan material/muka/lanyard semasa
    // (kemas kini di tempat, bukan innerHTML — butang yang baru ditekan kekal fokus)
    var bBanding = $('kk-banding').querySelectorAll('button');
    for (var m = 0; m < bBanding.length && m < TIER.length; m++) {
      var kiniTier = q >= TIER[m][0] && (m === TIER.length - 1 || q < TIER[m + 1][0]);
      bBanding[m].querySelector('b').textContent = 'RM' + rm(kira(material, muka, TIER[m][0], lanyard).seunit);
      if (kiniTier) bBanding[m].setAttribute('aria-current', 'true');
      else bBanding[m].removeAttribute('aria-current');
    }

    lencana.querySelector('span').textContent =
      h.d ? 'Diskaun kuantiti −' + h.d + '%' : 'Harga asas · 50–99 pcs';
    lencana.classList.toggle('kk-lencana-asas', !h.d);
    if (!awal && GERAK && diskaunLepas !== null && h.d !== diskaunLepas) {
      window.Motion.animate(lencana, { scale: [1, 1.12, 1] }, { duration: 0.45, ease: 'easeOut' });
    }
    diskaunLepas = h.d;

    akar.querySelector('[data-arah="-1"]').disabled = q <= MIN;
    akar.querySelector('[data-arah="1"]').disabled = q >= MAX;

    for (var i = 0; i < chip.length; i++) {
      chip[i].setAttribute('aria-pressed', String(Number(chip[i].dataset.qty) === q));
    }

    // Tangga: nod dicapai + isian trek separa ke tier seterusnya
    var idx = 0;
    for (var j = 0; j < TIER.length; j++) if (q >= TIER[j][0]) idx = j;
    for (var k = 0; k < nod.length; k++) {
      nod[k].classList.toggle('kk-capai', k <= idx);
      nod[k].classList.toggle('kk-kini', k === idx);
    }
    var pecahan = 0;
    if (idx < TIER.length - 1) {
      pecahan = (q - TIER[idx][0]) / (TIER[idx + 1][0] - TIER[idx][0]);
    }
    var p = Math.min(1, (idx + pecahan) / (TIER.length - 1));
    isi.style.transform = 'scaleX(' + p + ')';

    lukisCadangan(cadangan(material, muka, q, lanyard, h));

    var teks = teksWA(material, muka, q, lanyard, h);
    if (typeof window.mlTandakan === 'function') {
      cta.href = WA + '?text=' + encodeURIComponent(teks);
      window.mlTandakan(cta);                         // (ref: G-Ads) / (ref: Web)
    } else {
      // sumber.js lama dlm cache (tiada mlTandakan): bawa tanda yang ia dah
      // letak pada href ke href baru. Tanpa ni lead Google hilang dari laporan.
      var tanda = tandaDari(cta.href);
      cta.href = WA + '?text=' + encodeURIComponent(tanda ? teks + '\n\n' + tanda : teks);
    }

    // Satu mesej status penuh utk pembaca skrin, ditangguh supaya tak
    // berbunyi pada setiap ketukan kekunci.
    if (!awal) {
      clearTimeout(tundaStatus);
      tundaStatus = setTimeout(function () {
        status.textContent = 'Anggaran RM' + rm(h.seunit) + ' seunit untuk ' + pcs(q) + ' pcs' +
          (h.d ? ', diskaun ' + h.d + ' peratus.' : '.');
      }, 600);
    }
  }

  /* ── Ukur penggunaan: sekali setiap lawatan, supaya GA4 boleh banding
     "guna kalkulator" vs "klik WhatsApp dari kalkulator". ── */
  var dahDiukur = false;
  function ukur() {
    if (dahDiukur) return;
    dahDiukur = true;
    if (typeof window.gtag === 'function') window.gtag('event', 'guna_kalkulator');
  }

  function setQty(n) {
    inQty.value = String(Math.min(Math.max(Math.round(n), MIN), MAX));
    ukur();
    render(false);
  }
  function langkah(q, arah) {
    // Langkah membesar ikut skala — 10 pcs sekali tekan terlalu lambat utk 800 pcs
    var saiz = arah > 0 ? (q < 200 ? 10 : q < 500 ? 50 : 100)
                        : (q <= 200 ? 10 : q <= 500 ? 50 : 100);
    return q + arah * saiz;
  }

  borang.addEventListener('submit', function (e) { e.preventDefault(); });
  borang.addEventListener('change', function (e) {
    if (e.target === inQty) {
      if (qtyMentah() < MIN || qtyMentah() > MAX) setQty(qtyMentah() || MIN);
      return;
    }
    ukur();
    render(false);
  });
  inQty.addEventListener('input', function () { ukur(); render(false); });
  inQty.addEventListener('blur', function () {
    var n = qtyMentah();
    if (n < MIN || n > MAX) setQty(n || MIN);
  });

  akar.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b || !akar.contains(b)) return;
    if (b.dataset.arah) {
      setQty(langkah(Math.max(qtyMentah(), MIN), Number(b.dataset.arah)));
    } else if (b.dataset.qty) {
      setQty(Number(b.dataset.qty));
    } else if (b.dataset.ke) {
      setQty(Number(b.dataset.ke));
      inQty.focus({ preventScroll: true });
    }
  });

  // Animasi yang tergantung semasa tab tersorok: paksa nilai akhir bila kembali
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    for (var id in dipapar) {
      if (kawal[id]) { kawal[id].stop(); kawal[id] = null; }
      if ($(id)) $(id).textContent = rm(dipapar[id]);
    }
  });

  render(true);
})();
