let lenis;
if (Webflow.env("editor") === undefined) {
  lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.7,
    gestureOrientation: "vertical",
    normalizeWheel: false,
    smoothTouch: false,
  });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
$("[data-lenis-start]").on("click", function () {
  lenis.start();
});
$("[data-lenis-stop]").on("click", function () {
  lenis.stop();
});
$("[data-lenis-toggle]").on("click", function () {
  $(this).toggleClass("stop-scroll");
  if ($(this).hasClass("stop-scroll")) {
    lenis.stop();
  } else {
    lenis.start();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // 🔹 Elements
  const selectEl = document.getElementById("country-select");
  const dialInput = document.getElementById("country-dial-code");
  const emblaNode = document.querySelector(".embla__viewport");

  if (!selectEl || !dialInput || !emblaNode) return;

  let countries = [];

  // 1️⃣ Fetch country list
  try {
    const res = await fetch("https://cdn.jsdelivr.net/gh/mjdalyy/aiagencybuilders@main/country-data.json");
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    countries = data.countries;
  } catch (err) {
    console.error("Failed to load country-data.json:", err);
    return;
  }

  // 2️⃣ Populate dropdown
  countries.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.iso;
    opt.textContent = `${c.flag} ${c.name} (${c.code})`;
    selectEl.appendChild(opt);
  });

  // 3️⃣ Initialize Choices.js
  const choices = new Choices(selectEl, {
    searchEnabled: true,
    itemSelectText: "",
    placeholderValue: "Search your country…",
    shouldSort: false,
  });

  const updateDialCode = iso => {
    const country = countries.find(c => c.iso === iso);
    dialInput.value = country ? country.code : "";
  };

  selectEl.addEventListener("change", e => updateDialCode(e.target.value));

  // 4️⃣ Geo detection
  async function detectAndSelect() {
    try {
      const r = await fetch("https://ipapi.co/country/");
      if (!r.ok) throw new Error("ipapi status " + r.status);
      const iso = (await r.text()).trim();
      if (countries.some(c => c.iso === iso)) {
        choices.setChoiceByValue(iso);
        updateDialCode(iso);
        return;
      }
      throw new Error("ISO not in list");
    } catch (e) {
      console.warn("ipapi failed:", e);
      window.geoCallback = data => {
        const iso2 = data.geoplugin_countryCode;
        if (countries.some(c => c.iso === iso2)) {
          choices.setChoiceByValue(iso2);
          updateDialCode(iso2);
        }
      };
      const script = document.createElement("script");
      script.src = "https://www.geoplugin.net/json.gp?jsoncallback=geoCallback";
      document.body.appendChild(script);
    }
  }

  detectAndSelect();

  // 5️⃣ Prevent scroll on dropdown open
  selectEl.addEventListener('showDropdown', () => {
    document.body.style.overflow = 'hidden';
  });
  selectEl.addEventListener('hideDropdown', () => {
    document.body.style.overflow = '';
  });

  // 6️⃣ Embla Carousel
  const embla = EmblaCarousel(emblaNode, {
    loop: true,
    align: "center",
  });

  const slides = embla.slideNodes();

  const updateSelected = () => {
    const selectedIndex = embla.selectedScrollSnap();
    slides.forEach((slide, idx) => {
      slide.classList.toggle("is-selected", idx === selectedIndex);
    });
  };

  embla.on("select", updateSelected);
  updateSelected();

  document.querySelector(".embla__next")?.addEventListener("click", () => embla.scrollNext());
  document.querySelector(".embla__prev")?.addEventListener("click", () => embla.scrollPrev());
});
