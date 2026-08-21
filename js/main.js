/* Medal Lanyard Malaysia — interaksi ringkas, tiada dependency. */
(function () {
  "use strict";

  /* ── Reveal semasa skrol ── */
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

  /* ── Penapis galeri + "Tunjuk semua" ──
     92 gambar semuanya dalam DOM (loading="lazy" jaga kelajuan), tapi
     paparan "Semua" mula dengan 24 dahulu supaya pelawat tak lemas skrol.
     Pilih kategori = terus tunjuk SEMUA gambar kategori itu. */
  var HAD_AWAL = 24;
  var pils = document.querySelectorAll(".pil");
  var items = document.querySelectorAll("#galeriGrid figure");
  var btnLagi = document.getElementById("btnLagi");
  var tunjukSemua = false;
  var katKini = "semua";

  function susunGaleri() {
    var nampak = 0;
    items.forEach(function (fig) {
      var padan = katKini === "semua" || fig.dataset.kat === katKini;
      if (padan && katKini === "semua" && !tunjukSemua && nampak >= HAD_AWAL) {
        padan = false;
      }
      if (padan) nampak++;
      fig.classList.toggle("sorok", !padan);
      if (padan) fig.classList.add("in"); // dah ditapis = terus nampak
    });
    if (btnLagi) {
      btnLagi.parentElement.style.display =
        (katKini === "semua" && !tunjukSemua) ? "" : "none";
    }
  }

  pils.forEach(function (pil) {
    pil.addEventListener("click", function () {
      pils.forEach(function (p) { p.classList.remove("aktif"); });
      pil.classList.add("aktif");
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

  /* ── Lightbox ── */
  var kotak = document.getElementById("kotakCahaya");
  var kcImg = document.getElementById("kcImg");
  var kcKap = document.getElementById("kcKapsyen");
  function tutup() {
    kotak.hidden = true;
    document.body.style.overflow = "";
  }
  items.forEach(function (fig) {
    fig.addEventListener("click", function () {
      var img = fig.querySelector("img");
      var kap = fig.querySelector("figcaption");
      kcImg.src = img.src;
      kcImg.alt = img.alt;
      kcKap.textContent = kap ? kap.textContent : "";
      kotak.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });
  kotak.addEventListener("click", function (e) {
    if (e.target === kotak || e.target.classList.contains("kc-tutup")) tutup();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !kotak.hidden) tutup();
  });
})();
