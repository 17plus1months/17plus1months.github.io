"use strict";
/* Shared helpers used by every game page. */

function randInt(n){ return Math.floor(Math.random() * n); }

function formatTime(totalSeconds){
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + ":" + String(s).padStart(2, "0");
}

const CONFETTI_COLORS = ["#e8618c", "#f0a132", "#3fa7d6", "#7c6cf0", "#35c26b", "#ffd166"];

function celebrate(){
  if (typeof document === "undefined") return;
  for (let i = 0; i < 140; i++){
    const p = document.createElement("i");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = CONFETTI_COLORS[randInt(CONFETTI_COLORS.length)];
    p.style.width = 6 + Math.random() * 8 + "px";
    p.style.height = 10 + Math.random() * 10 + "px";
    p.style.borderRadius = Math.random() < 0.4 ? "50%" : "3px";
    p.style.setProperty("--spin", (Math.random() < 0.5 ? "-" : "") + (360 + randInt(540)) + "deg");
    p.style.animationDuration = 2.6 + Math.random() * 2.2 + "s";
    p.style.animationDelay = Math.random() * 0.7 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 6000);
  }
}
