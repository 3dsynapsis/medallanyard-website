/* Medal Lanyard Malaysia — interaksi asas (tanpa dependency).
   Animasi Motion ada di gerak.js; fail ini mesti berfungsi walaupun
   pustaka Motion gagal dimuat atau pengguna matikan animasi. */
(function () {
  "use strict";

  var root = document.documentElement;
  // Motion dimuat (defer) SEBELUM fail ini. Tiada Motion = tiada kelas
  // "gerak", jadi CSS tak sorok apa-apa dan reveal biasa di bawah ambil alih.
  if (!window.Motion) root.classList.remove("gerak");
  var GERAK = root.classList.contains("gerak");

  /* ── Reveal semasa skrol (hanya bila TIADA Motion) ── */
  if (!GERAK) {
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("in"); });
    }
  }

  /* ── Jalur event: gandakan senarai supaya marquee bersambung ── */
  var trek = document.querySelector(".jalur-trek");
  if (trek) {
    var salin = trek.querySelector(".jalur-isi").cloneNode(true);
    salin.setAttribute("aria-hidden", "true");
    trek.appendChild(salin);
  }

  /* ── Topbar mengecil + menu mobile + pautan nav aktif ── */
  var topbar = document.getElementById("topbar");
  function semakTopbar() { topbar.classList.toggle("kecil", window.scrollY > 40); }
  window.addEventListener("scroll", semakTopbar, { passive: true });
  semakTopbar();

  var btnMenu = document.getElementById("btnMenu");
  var menu = document.getElementById("menuMobil");
  function setMenu(buka) {
    menu.hidden = !buka;
    btnMenu.setAttribute("aria-expanded", String(buka));
    btnMenu.setAttribute("aria-label", buka ? "Tutup menu" : "Buka menu");
    btnMenu.querySelector("use").setAttribute("href", buka ? "#i-x" : "#i-menu");
    document.dispatchEvent(new CustomEvent("menu:tukar", { detail: { buka: buka, el: menu } }));
  }
  btnMenu.addEventListener("click", function () { setMenu(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) { setMenu(false); btnMenu.focus(); }
  });

  var navPautan = document.querySelectorAll(".nav-utama a");
  if ("IntersectionObserver" in window) {
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navPautan.forEach(function (a) {
          a.classList.toggle("aktif", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { ioNav.observe(s); });
  }

  /* ── Penapis galeri + "Tunjuk semua" ──
     Semua gambar ada dalam DOM (loading="lazy" jaga kelajuan), tapi
     paparan "Semua" mula dengan 24 dahulu supaya pelawat tak lemas skrol.
     Pilih kategori = terus tunjuk SEMUA gambar kategori itu. */
  // Mobile guna grid petak 2 lajur (gerak.css) — 12 dahulu = 6 baris.
  var HAD_AWAL = window.matchMedia("(max-width: 560px)").matches ? 12 : 24;
  var pils = document.querySelectorAll(".pil");
  var items = Array.prototype.slice.call(document.querySelectorAll("#galeriGrid figure"));
  var btnLagi = document.getElementById("btnLagi");
  var tunjukSemua = false;
  var katKini = "semua";
  var mulaSusun = true;

  function nampakSekarang() {
    return items.filter(function (f) { return !f.classList.contains("sorok"); });
  }

  function susunGaleri() {
    var nampak = 0;
    var baru = [];
    items.forEach(function (fig) {
      var dulu = !fig.classList.contains("sorok");
      var padan = katKini === "semua" || fig.dataset.kat === katKini;
      if (padan && katKini === "semua" && !tunjukSemua && nampak >= HAD_AWAL) {
        padan = false;
      }
      if (padan) nampak++;
      fig.classList.toggle("sorok", !padan);
      if (padan && !mulaSusun) baru.push(fig);
      if (padan && !GERAK && !mulaSusun) fig.classList.add("in");
    });
    if (btnLagi) {
      btnLagi.parentElement.style.display =
        (katKini === "semua" && !tunjukSemua) ? "" : "none";
    }
    if (!mulaSusun) {
      document.dispatchEvent(new CustomEvent("galeri:tapis", { detail: { items: baru } }));
    }
    mulaSusun = false;
  }

  pils.forEach(function (pil) {
    pil.addEventListener("click", function () {
      pils.forEach(function (p) {
        p.classList.remove("aktif");
        p.setAttribute("aria-pressed", "false");
      });
      pil.classList.add("aktif");
      pil.setAttribute("aria-pressed", "true");
      katKini = pil.dataset.kat;
      susunGaleri();
    });
  });
  if (btnLagi) {
    btnLagi.addEventListener("click", function () {
      tunjukSemua = true;
      susunGaleri();
    });
  }
  susunGaleri();

  /* ── Lightbox: klik / Enter buka, ← → tukar, Esc tutup, leret di mobile ── */
  var kotak = document.getElementById("kotakCahaya");
  var kcImg = document.getElementById("kcImg");
  var kcKap = document.getElementById("kcKapsyen");
  var kcKira = document.getElementById("kcKira");
  var senaraiKc = [];
  var indeksKc = 0;
  var fokusAsal = null;

  function papar(i, arah) {
    indeksKc = (i + senaraiKc.length) % senaraiKc.length;
    var fig = senaraiKc[indeksKc];
    var img = fig.querySelector("img");
    var kap = fig.querySelector("figcaption");
    kcImg.src = img.src;
    kcImg.alt = img.alt;
    kcKap.textContent = kap ? kap.textContent : "";
    kcKira.textContent = (indeksKc + 1) + " / " + senaraiKc.length;
    document.dispatchEvent(new CustomEvent("kc:tukar", { detail: { img: kcImg, arah: arah || 0 } }));
  }

  function buka(fig) {
    senaraiKc = nampakSekarang();
    fokusAsal = fig;
    kotak.hidden = false;
    document.body.style.overflow = "hidden";
    papar(senaraiKc.indexOf(fig), 0);
    document.dispatchEvent(new CustomEvent("kc:buka", { detail: { kotak: kotak } }));
    kotak.querySelector(".kc-tutup").focus();
  }

  function tutup() {
    kotak.hidden = true;
    document.body.style.overflow = "";
    if (fokusAsal) fokusAsal.focus();
  }

  items.forEach(function (fig) {
    fig.setAttribute("tabindex", "0");
    fig.setAttribute("role", "button");
    var kap = fig.querySelector("figcaption");
    fig.setAttribute("aria-label", "Besarkan gambar: " + (kap ? kap.textContent : "medal"));
    fig.addEventListener("click", function () { buka(fig); });
    fig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); buka(fig); }
    });
  });
  kotak.addEventListener("click", function (e) {
    if (e.target === kotak || e.target.closest(".kc-tutup")) tutup();
    else if (e.target.closest(".kc-kiri")) papar(indeksKc - 1, -1);
    else if (e.target.closest(".kc-kanan")) papar(indeksKc + 1, 1);
  });
  document.addEventListener("keydown", function (e) {
    if (kotak.hidden) return;
    if (e.key === "Escape") tutup();
    else if (e.key === "ArrowLeft") papar(indeksKc - 1, -1);
    else if (e.key === "ArrowRight") papar(indeksKc + 1, 1);
    else if (e.key === "Tab") {
      // perangkap fokus dalam dialog
      var btn = kotak.querySelectorAll("button");
      var awal = btn[0], akhir = btn[btn.length - 1];
      if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
      else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
    }
  });
  var xMula = null;
  kcImg.addEventListener("touchstart", function (e) { xMula = e.touches[0].clientX; }, { passive: true });
  kcImg.addEventListener("touchend", function (e) {
    if (xMula === null) return;
    var dx = e.changedTouches[0].clientX - xMula;
    if (Math.abs(dx) > 50) papar(indeksKc + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    xMula = null;
  });

  /* ── FAQ: bungkus jawapan supaya boleh dianimasi ── */
  document.querySelectorAll(".faq").forEach(function (d) {
    var isi = document.createElement("div");
    isi.className = "faq-isi";
    while (d.children.length > 1) isi.appendChild(d.children[1]);
    d.appendChild(isi);
  });
})();
