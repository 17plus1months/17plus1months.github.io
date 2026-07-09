"use strict";
/* ============ Gallery (slideshow) ============
   PHOTOS is the site's shared photo library: the slideshow plays through
   it in order, and The Sliding Memory picks a random entry for each
   puzzle. To add your own photos: drop image files into images/gallery/
   and add an entry here — src is the file path, title the heading,
   note the caption shown underneath.                                  */

const PHOTOS = [
  {
    src: "images/gallery/g1.svg",
    title: "Golden hour",
    note: "The kind of sunset that makes you stop mid-sentence and just watch.",
  },
  {
    src: "images/gallery/g2.svg",
    title: "City lights",
    note: "A thousand tiny windows, each one a story we made up on the walk home.",
  },
  {
    src: "images/gallery/g3.svg",
    title: "Into the pines",
    note: "Cold air, tall trees, and absolutely no idea which way the trail went.",
  },
  {
    src: "images/gallery/g4.svg",
    title: "Sunday slow",
    note: "Two cups, one blanket, nowhere to be.",
  },
  {
    src: "images/gallery/g5.svg",
    title: "First light",
    note: "Worth every single step of the 6am alarm.",
  },
  {
    src: "images/gallery/g6.svg",
    title: "Star map",
    note: "We only found one constellation, so we invented the rest.",
  },
  {
    src: "images/gallery/g7.svg",
    title: "Up and away",
    note: "Somewhere between the ground and the clouds.",
  },
  {
    src: "images/gallery/g8.svg",
    title: "Picnic weather",
    note: "The sandwiches were average. The company was not.",
  },
];

/* seconds each photo stays on screen before the slideshow moves on */
const SLIDE_SECONDS = 10;

if (typeof document !== "undefined" && document.getElementById("slideshow")){
  const root = document.getElementById("slideshow");
  const img = document.getElementById("ssImg");
  const bar = document.getElementById("ssBar");
  const titleEl = document.getElementById("ssTitle");
  const noteEl = document.getElementById("ssNote");
  const dotsWrap = document.getElementById("ssDots");
  const prevBtn = document.getElementById("ssPrev");
  const nextBtn = document.getElementById("ssNext");
  const pauseBtn = document.getElementById("ssPause");

  let cur = 0, timer = null, paused = false;

  const dots = PHOTOS.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "ss-dot";
    d.setAttribute("aria-label", "photo " + (i + 1));
    d.addEventListener("click", () => go(i, true));
    dotsWrap.appendChild(d);
    return d;
  });

  function show(){
    const p = PHOTOS[cur];
    img.classList.add("fading");
    img.onload = () => img.classList.remove("fading");
    setTimeout(() => {
      img.src = p.src;
      img.alt = p.title;
      titleEl.textContent = p.title;
      noteEl.textContent = p.note;
      setTimeout(() => img.classList.remove("fading"), 400); // safety for cached loads
    }, 180);
    dots.forEach((d, i) => d.classList.toggle("on", i === cur));
    restartBar();
    if (PHOTOS.length > 1) new Image().src = PHOTOS[(cur + 1) % PHOTOS.length].src; // preload next
  }

  /* Restart the little countdown bar. The longhands matter: an inline
     `animation:` shorthand would also pin play-state to running, which
     would break the paused state set from the stylesheet. */
  function restartBar(){
    bar.style.animation = "none";
    void bar.offsetWidth; // force reflow so the animation starts over
    bar.style.animation = "";
    bar.style.animationName = "ss-fill";
    bar.style.animationDuration = SLIDE_SECONDS + "s";
    bar.style.animationTimingFunction = "linear";
    bar.style.animationFillMode = "forwards";
  }

  function resetTimer(){
    clearInterval(timer);
    timer = null;
    if (!paused && PHOTOS.length > 1)
      timer = setInterval(() => go(cur + 1, false), SLIDE_SECONDS * 1000);
  }

  function go(i, manual){
    cur = (i + PHOTOS.length) % PHOTOS.length;
    show();
    if (manual) resetTimer(); // a manual flip earns the photo its full stay
  }

  function togglePause(){
    paused = !paused;
    root.classList.toggle("paused", paused);
    pauseBtn.textContent = paused ? "▶ Play" : "⏸ Pause";
    pauseBtn.setAttribute("aria-pressed", String(paused));
    if (paused){
      clearInterval(timer);
      timer = null;
    } else {
      restartBar();
      resetTimer();
    }
  }

  prevBtn.addEventListener("click", () => go(cur - 1, true));
  nextBtn.addEventListener("click", () => go(cur + 1, true));
  pauseBtn.addEventListener("click", togglePause);
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") go(cur - 1, true);
    else if (e.key === "ArrowRight") go(cur + 1, true);
  });

  if (PHOTOS.length < 2){
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    pauseBtn.style.display = "none";
    dotsWrap.style.display = "none";
  }

  show();
  resetTimer();
}
