/* Medal Lanyard Malaysia — animasi guna Motion (motion.dev, pustaka vanilla
   oleh pembuat Framer Motion). Semua di sini HIASAN: kalau Motion gagal
   dimuat atau pengguna pilih "kurangkan animasi", main.js buang kelas
   html.gerak dan laman kekal lengkap tanpa fail ini. */
(function () {
  "use strict";

  if (!window.Motion || !document.documentElement.classList.contains("gerak")) return;

  var M = window.Motion;
  var animate = M.animate, inView = M.inView, scroll = M.scroll, stagger = M.stagger;
  var EASE = [0.22, 1, 0.36, 1];                      // "ease-out-quint" — mendarat lembut
  var SPRING = { type: "spring", stiffness: 260, damping: 24 };
  var SPRING_LOMPAT = { type: "spring", stiffness: 420, damping: 14 };
  var halus = window.matchMedia("(pointer: fine)").matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function lepas(ctrl, fn) {
    // AnimationPlaybackControls: .finished (baru) atau .then (lama)
    if (ctrl && ctrl.finished) ctrl.finished.then(fn);
    else if (ctrl && ctrl.then) ctrl.then(fn);
    else fn();
  }
  function bersih(el) {
    el.classList.add("in");
    el.style.opacity = "";
    el.style.transform = "";
    el.style.filter = "";
  }

  /* ════════ 1. HERO — tajuk masuk kata demi kata ════════ */
  var h1 = $(".hero h1");
  var kata = [];
  if (h1) {
    // pecah nod teks jadi <span> per kata; span .emas dikekalkan sebagai satu unit
    Array.prototype.slice.call(h1.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/( +)/).forEach(function (bah) {
          if (!bah) return;
          if (/^ +$/.test(bah)) { frag.appendChild(document.createTextNode(bah)); return; }
          var s = document.createElement("span");
          s.className = "hero-h1-kata";
          s.textContent = bah;
          frag.appendChild(s);
          kata.push(s);
        });
        h1.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        n.classList.add("hero-h1-kata");
        kata.push(n);
      }
    });
    h1.style.opacity = "1";
    animate(kata,
      { opacity: [0, 1], y: [28, 0], filter: ["blur(8px)", "blur(0px)"] },
      { duration: 0.8, ease: EASE, delay: stagger(0.045, { startDelay: 0.15 }) });
  }

  var muncul = $$(".hero .muncul").filter(function (el) { return el !== h1; });
  var foto = $(".hero-foto");
  muncul.forEach(function (el, i) {
    if (el === foto) return;
    var tunda = el.classList.contains("eyebrow") ? 0.05 : 0.55 + i * 0.1;
    animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.7, ease: EASE, delay: tunda });
  });
  // chip hero satu-satu
  animate($$(".hero-chip li"), { opacity: [0, 1], y: [10, 0] },
    { duration: 0.5, ease: EASE, delay: stagger(0.08, { startDelay: 1.0 }) });

  /* Foto hero: timbul + putar kecil (spring), lencana logo "dicop" masuk */
  if (foto) {
    var utama = $(".hero-utama", foto);
    var lencana = $(".hero-lencana", foto);
    var kilau = $(".hero-kilau", foto);
    animate(foto, { opacity: [0, 1] }, { duration: 0.6, delay: 0.25 });
    var masuk = animate(utama,
      { scale: [0.9, 1], rotate: [6, 1.4], y: [40, 0] },
      { type: "spring", stiffness: 120, damping: 16, delay: 0.25 });
    animate(lencana,
      { scale: [0, 1], rotate: [-60, -6] },
      Object.assign({}, SPRING_LOMPAT, { delay: 0.9 }));
    // kilauan emas menyapu foto — ulang setiap ~5 saat
    animate(kilau, { opacity: [0, 1, 1, 0], backgroundPosition: ["120% 0", "-30% 0"] },
      { duration: 1.6, ease: "easeInOut", delay: 1.4, repeat: Infinity, repeatDelay: 4.5 });

    // condong ikut kursor (desktop sahaja)
    lepas(masuk, function () {
      if (!halus) return;
      foto.addEventListener("pointermove", function (e) {
        var r = foto.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        animate(utama, { rotateY: px * 12, rotateX: -py * 12, rotate: 1.4, scale: 1.02 },
          { type: "spring", stiffness: 150, damping: 18 });
        animate(lencana, { x: px * -18, y: py * -18 }, { type: "spring", stiffness: 150, damping: 18 });
      });
      foto.addEventListener("pointerleave", function () {
        animate(utama, { rotateY: 0, rotateX: 0, scale: 1 }, { type: "spring", stiffness: 120, damping: 14 });
        animate(lencana, { x: 0, y: 0 }, { type: "spring", stiffness: 120, damping: 14 });
      });
    });

    // paralaks: isi hero naik perlahan (menjauhi jalur angka), corak titik lebih laju
    var hero = $(".hero");
    scroll(animate($(".hero-grid"), { y: [0, -70], opacity: [1, 0.55] }, { ease: "linear" }),
      { target: hero, offset: ["start start", "end start"] });
    scroll(animate($(".hero-latar"), { y: [0, -60] }, { ease: "linear" }),
      { target: hero, offset: ["start start", "end start"] });
  }

  /* ════════ 2. Jalur angka — kira naik ════════ */
  var angka = $(".angka");
  if (angka) {
    var angkaItem = $$(".angka-item", angka);
    angkaItem.forEach(function (el) { el.style.opacity = "0"; });
    $$(".kira", angka).forEach(function (el) { el.textContent = "0"; });
    inView(angka, function () {
      if (angka.__dah) return;
      angka.__dah = true;
      animate(angkaItem, { opacity: [0, 1], y: [18, 0] },
        { duration: 0.6, ease: EASE, delay: stagger(0.08) });
      $$(".kira", angka).forEach(function (el, i) {
        var ke = parseFloat(el.dataset.ke);
        var dp = parseInt(el.dataset.perpuluhan || "0", 10);
        animate(0, ke, {
          duration: 1.6, ease: EASE, delay: 0.15 + i * 0.08,
          onUpdate: function (v) { el.textContent = v.toFixed(dp); }
        });
      });
    }, { amount: 0.5 });
  }

  /* ════════ 3. Reveal skrol — sibling masuk berperingkat ════════ */
  var giliran = new Map();   // parent -> {masa, n}
  function tundaUntuk(el) {
    var p = el.parentElement, kini = performance.now();
    var g = giliran.get(p);
    if (!g || kini - g.masa > 200) g = { masa: kini, n: 0 };
    else g.n++;
    giliran.set(p, g);
    return Math.min(g.n, 8) * 0.08;
  }

  function reveal(el) {
    if (el.__dah) return;          // inView terus memerhati — animasi sekali sahaja
    el.__dah = true;
    var tunda = tundaUntuk(el);
    var kf = { opacity: [0, 1], y: [32, 0] };
    var opt = { duration: 0.8, ease: EASE, delay: tunda };
    if (el.classList.contains("kad")) {
      kf = { opacity: [0, 1], y: [40, 0], scale: [0.94, 1] };
      opt = Object.assign({}, SPRING, { delay: tunda });
    } else if (el.tagName === "FIGURE" && el.closest(".galeri-grid")) {
      kf = { opacity: [0, 1], y: [24, 0], scale: [0.95, 1] };
      opt = { duration: 0.6, ease: EASE, delay: tunda * 0.6 };
    } else if (el.classList.contains("faq")) {
      kf = { opacity: [0, 1], x: [-16, 0] };
    }
    lepas(animate(el, kf, opt), function () { bersih(el); });

    // kesan tambahan ikut jenis
    if (el.closest(".proses-senarai")) {
      var l = $(".langkah", el);
      if (l) animate(l, { scale: [0.4, 1], rotate: [-30, 0] },
        Object.assign({}, SPRING_LOMPAT, { delay: tunda + 0.1 }));
    }
    if (el.classList.contains("banding2")) bandingMasuk(el);
    if (el.classList.contains("harga-kiri")) hargaMasuk(el);
  }

  $$(".reveal").forEach(function (el) {
    inView(el, function () { reveal(el); }, { margin: "0px 0px -60px 0px", amount: 0.1 });
  });

  /* Banding: baris masuk dari kiri, tanda ✓ "pop" */
  var barisB2 = $$(".banding2 .b2-baris:not(.b2-head)");
  barisB2.forEach(function (b) { b.style.opacity = "0"; });
  function bandingMasuk(box) {
    animate(barisB2, { opacity: [0, 1], x: [-24, 0] },
      { duration: 0.6, ease: EASE, delay: stagger(0.12, { startDelay: 0.3 }) });
    animate($$(".tanda-ok", box), { scale: [0, 1] },
      Object.assign({}, SPRING_LOMPAT, { delay: stagger(0.12, { startDelay: 0.55 }) }));
    animate($(".b2-pita", box), { y: [-40, 0], opacity: [0, 1] },
      Object.assign({}, SPRING_LOMPAT, { delay: 0.2 }));
    animate($(".b2-vs", box), { scale: [0, 1], rotate: [-90, 0] },
      Object.assign({}, SPRING_LOMPAT, { delay: 0.35 }));
  }

  /* Harga: RM10.56 kira naik */
  function hargaMasuk(box) {
    var n = $(".harga-nombor strong", box);
    if (!n) return;
    animate(0, 10.56, {
      duration: 1.4, ease: EASE, delay: 0.2,
      onUpdate: function (v) { n.textContent = v.toFixed(2); }
    });
  }

  /* ════════ 4. Galeri — animasi bila tapis ════════ */
  document.addEventListener("galeri:tapis", function (e) {
    var baru = e.detail.items.slice(0, 40);
    e.detail.items.slice(40).forEach(bersih);
    baru.forEach(function (f) { f.style.opacity = "0"; });
    lepas(animate(baru, { opacity: [0, 1], scale: [0.9, 1], y: [16, 0] },
      { duration: 0.45, ease: EASE, delay: stagger(0.025) }),
      function () { baru.forEach(bersih); });
  });

  /* ════════ 5. Proses — garis masa diisi ikut skrol ════════ */
  var isi = $(".proses-isi");
  if (isi) {
    scroll(animate(isi, { scaleY: [0, 1] }, { ease: "linear" }),
      { target: $(".proses-senarai"), offset: ["start 75%", "end 55%"] });
  }

  /* ════════ 6. Foto lawat — paralaks & putaran kecil ════════ */
  var fotoLawat = $(".lawat-foto img");
  if (fotoLawat) {
    scroll(animate(fotoLawat, { y: [40, -40], rotate: [-3, 0] }, { ease: "linear" }),
      { target: $("#lawat"), offset: ["start end", "end start"] });
  }

  /* ════════ 7. Bar kemajuan skrol + butang WA terapung ════════ */
  var bar = $(".bar-skrol");
  if (bar) scroll(animate(bar, { scaleX: [0, 1] }, { ease: "linear" }));

  var wa = $(".wa-terapung");
  var waNampak = false;
  function semakWa() {
    var patut = window.scrollY > window.innerHeight * 0.5;
    if (patut === waNampak) return;
    waNampak = patut;
    wa.classList.toggle("nampak", patut);
    animate(wa, patut ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
      patut ? SPRING_LOMPAT : { duration: 0.2 });
  }
  if (wa) {
    window.addEventListener("scroll", semakWa, { passive: true });
    semakWa();
  }

  /* ════════ 8. Maklum balas tekan (butang) ════════ */
  if (M.press) {
    M.press(".btn, .pil, .kc-nav, .btn-menu", function (el) {
      animate(el, { scale: 0.95 }, { duration: 0.12 });
      return function () {
        lepas(animate(el, { scale: 1 }, { type: "spring", stiffness: 500, damping: 18 }),
          function () { el.style.transform = ""; });   // pulangkan hover CSS
      };
    });
  }

  /* ════════ 9. FAQ — buka/tutup lancar ════════ */
  $$(".faq").forEach(function (d) {
    var s = $("summary", d);
    s.addEventListener("click", function (e) {
      var isiF = $(".faq-isi", d);
      if (!isiF) return;
      e.preventDefault();
      if (d.open) {
        lepas(animate(isiF, { height: [isiF.offsetHeight + "px", "0px"], opacity: [1, 0] },
          { duration: 0.25, ease: EASE }), function () {
          d.open = false;
          isiF.style.height = ""; isiF.style.opacity = "";
        });
      } else {
        d.open = true;
        var h = isiF.scrollHeight;
        lepas(animate(isiF, { height: ["0px", h + "px"], opacity: [0, 1] },
          { duration: 0.35, ease: EASE }), function () { isiF.style.height = ""; });
      }
    });
  });

  /* ════════ 10. Lightbox & menu mobile ════════ */
  document.addEventListener("kc:buka", function (e) {
    animate(e.detail.kotak, { opacity: [0, 1] }, { duration: 0.25 });
  });
  document.addEventListener("kc:tukar", function (e) {
    var a = e.detail.arah;
    animate(e.detail.img, { opacity: [0, 1], x: [a * 50, 0], scale: [0.94, 1] },
      { type: "spring", stiffness: 260, damping: 26 });
  });
  document.addEventListener("menu:tukar", function (e) {
    if (!e.detail.buka) return;
    animate($$("a", e.detail.el), { opacity: [0, 1], x: [-14, 0] },
      { duration: 0.35, ease: EASE, delay: stagger(0.04) });
  });
})();
