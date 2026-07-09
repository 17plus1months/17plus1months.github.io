"use strict";
/* ============ Minesweeper ============
   Standard rules: reveal safe squares, avoid mines. A revealed number is
   how many of the eight neighbouring squares hold a mine. Mines are only
   placed after the first click, so that click (and its neighbours) is
   always safe. Win by revealing every non-mine square.                 */

/* ---------- pure logic (unit-tested in tests/games.test.js) ---------- */

function msNeighbors(i, rows, cols){
  const r = Math.floor(i / cols), c = i % cols, out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++){
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
    }
  return out;
}

/* Randomly place `mineCount` mines, never on the first-clicked cell or its
   neighbours. Returns a boolean array. */
function placeMines(rows, cols, mineCount, safeIdx){
  const total = rows * cols;
  const forbidden = new Set([safeIdx, ...msNeighbors(safeIdx, rows, cols)]);
  const candidates = [];
  for (let i = 0; i < total; i++) if (!forbidden.has(i)) candidates.push(i);
  mineCount = Math.min(mineCount, candidates.length);
  for (let i = 0; i < mineCount; i++){ // partial Fisher–Yates
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    const t = candidates[i]; candidates[i] = candidates[j]; candidates[j] = t;
  }
  const mines = new Array(total).fill(false);
  for (let i = 0; i < mineCount; i++) mines[candidates[i]] = true;
  return mines;
}

function computeCounts(mines, rows, cols){
  const counts = new Array(rows * cols).fill(0);
  for (let i = 0; i < mines.length; i++){
    if (!mines[i]) continue;
    for (const nb of msNeighbors(i, rows, cols)) counts[nb]++;
  }
  return counts;
}

/* Reveal from `start`; if it is a zero, flood outward to its region.
   Mutates `revealed`; returns the list of newly revealed indices.
   Never reveals a mine. */
function revealFrom(start, mines, counts, revealed, rows, cols){
  const out = [];
  if (revealed[start] || mines[start]) return out;
  const stack = [start];
  while (stack.length){
    const cur = stack.pop();
    if (revealed[cur]) continue;
    revealed[cur] = true;
    out.push(cur);
    if (counts[cur] === 0)
      for (const nb of msNeighbors(cur, rows, cols))
        if (!revealed[nb] && !mines[nb]) stack.push(nb);
  }
  return out;
}

function isWin(mines, revealed){
  for (let i = 0; i < mines.length; i++)
    if (!mines[i] && !revealed[i]) return false;
  return true;
}

/* ---------- DOM app ---------- */
if (typeof document !== "undefined"){
  const MINE_DENSITY = 0.16;

  const board = document.getElementById("board");
  const mineCountEl = document.getElementById("mineCount");
  const timeEl = document.getElementById("time");
  const sizeSel = document.getElementById("sizeSel");
  const newBtn = document.getElementById("newBtn");
  const flagBtn = document.getElementById("flagBtn");
  const banner = document.getElementById("winBanner");
  const bannerBig = document.getElementById("bannerBig");
  const bannerSub = document.getElementById("bannerSub");

  let rows = 16, cols = 16, mineTotal = 0;
  let mines = [], counts = [], revealed = [], flags = [];
  let cells = [];
  let started = false, done = false, lost = false, flagMode = false;
  let seconds = 0, timer = null;
  const pressTimers = new Map();

  const setTime = () => { timeEl.textContent = formatTime(seconds); };
  const startTimer = () => { if (!timer) timer = setInterval(() => { seconds++; setTime(); }, 1000); };
  const stopTimer = () => { clearInterval(timer); timer = null; };

  function build(){
    board.innerHTML = "";
    board.style.setProperty("--n", cols);
    cells = [];
    for (let i = 0; i < rows * cols; i++){
      const el = document.createElement("button");
      el.type = "button";
      el.className = "mcell";
      el.setAttribute("aria-label", "cell " + (Math.floor(i / cols) + 1) + "," + (i % cols + 1));
      el.addEventListener("click", () => onClick(i));
      el.addEventListener("contextmenu", e => { e.preventDefault(); onFlag(i); });
      el.addEventListener("pointerdown", e => onPointerDown(e, i));
      el.addEventListener("pointerup", () => clearPress(i));
      el.addEventListener("pointerleave", () => clearPress(i));
      cells.push(el);
      board.appendChild(el);
    }
    renderCells();
  }

  function onPointerDown(e, i){
    if (e.pointerType === "mouse" || done) return; // mouse uses click / contextmenu
    clearPress(i);
    pressTimers.set(i, setTimeout(() => {
      pressTimers.set(i, "fired"); // mark so the trailing click is ignored
      onFlag(i);
    }, 420));
  }

  function clearPress(i){
    const t = pressTimers.get(i);
    if (t && t !== "fired"){ clearTimeout(t); pressTimers.delete(i); }
  }

  function onClick(i){
    if (done) return;
    if (pressTimers.get(i) === "fired"){ pressTimers.delete(i); return; } // was a long-press
    if (flagMode) { onFlag(i); return; }
    if (revealed[i]) chord(i);
    else reveal(i);
  }

  function onFlag(i){
    if (done || revealed[i]) return;
    flags[i] = !flags[i];
    renderCells();
  }

  function ensureStarted(safeIdx){
    if (started) return;
    mines = placeMines(rows, cols, mineTotal, safeIdx);
    counts = computeCounts(mines, rows, cols);
    started = true;
    startTimer();
  }

  function reveal(i){
    if (flags[i] || revealed[i]) return;
    ensureStarted(i);
    if (mines[i]){ revealed[i] = true; lose(i); return; }
    revealFrom(i, mines, counts, revealed, rows, cols);
    renderCells();
    if (isWin(mines, revealed)) win();
  }

  /* Click a satisfied number to sweep its un-flagged neighbours. */
  function chord(i){
    if (!started || counts[i] === 0) return;
    const nbrs = msNeighbors(i, rows, cols);
    if (nbrs.filter(n => flags[n]).length !== counts[i]) return;
    for (const nb of nbrs){
      if (flags[nb] || revealed[nb]) continue;
      if (mines[nb]){ revealed[nb] = true; lose(nb); return; }
      revealFrom(nb, mines, counts, revealed, rows, cols);
    }
    renderCells();
    if (isWin(mines, revealed)) win();
  }

  function renderCells(){
    let flagged = 0;
    for (let i = 0; i < rows * cols; i++){
      if (flags[i]) flagged++;
      const el = cells[i];
      el.className = "mcell";
      if (revealed[i]){
        el.classList.add("open");
        if (mines[i]){ el.classList.add("mine"); el.textContent = "💣"; }
        else if (counts[i] > 0){ el.classList.add("n" + counts[i]); el.textContent = counts[i]; }
        else el.textContent = "";
      } else if (flags[i]){
        el.classList.add("flag");
        el.textContent = lost && started && !mines[i] ? "❌" : "🚩";
      } else {
        el.textContent = "";
      }
    }
    mineCountEl.textContent = started ? (mineTotal - flagged) : mineTotal;
  }

  function lose(explodedIdx){
    done = true; lost = true;
    stopTimer();
    board.classList.add("done");
    for (let i = 0; i < rows * cols; i++) if (mines[i]) revealed[i] = true;
    renderCells();
    if (explodedIdx >= 0) cells[explodedIdx].classList.add("boom");
    banner.classList.add("lose");
    bannerBig.textContent = "Boom! 💥";
    bannerSub.textContent = "you hit a mine — tap New game to try again";
    banner.classList.add("show");
  }

  function win(){
    done = true;
    stopTimer();
    board.classList.add("done");
    for (let i = 0; i < rows * cols; i++) if (mines[i]) flags[i] = true;
    renderCells();
    banner.classList.remove("lose");
    bannerBig.textContent = "Swept clean! 🎉";
    bannerSub.textContent = mineTotal + " mines cleared in " + formatTime(seconds);
    banner.classList.add("show");
    celebrate();
  }

  function newGame(){
    rows = cols = parseInt(sizeSel.value, 10);
    mineTotal = Math.round(rows * cols * MINE_DENSITY);
    mines = [];
    counts = [];
    revealed = new Array(rows * cols).fill(false);
    flags = new Array(rows * cols).fill(false);
    started = false; done = false; lost = false;
    seconds = 0; setTime(); stopTimer();
    pressTimers.clear();
    banner.classList.remove("show", "lose");
    board.classList.remove("done");
    build();
    mineCountEl.textContent = mineTotal;
  }

  function toggleFlagMode(){
    flagMode = !flagMode;
    flagBtn.textContent = "🚩 Flag mode: " + (flagMode ? "on" : "off");
    flagBtn.classList.toggle("toggle-on", flagMode);
    flagBtn.setAttribute("aria-pressed", String(flagMode));
  }

  sizeSel.addEventListener("change", newGame);
  newBtn.addEventListener("click", newGame);
  flagBtn.addEventListener("click", toggleFlagMode);

  newGame();
}

if (typeof module !== "undefined" && module.exports){
  module.exports = { msNeighbors, placeMines, computeCounts, revealFrom, isWin };
}
