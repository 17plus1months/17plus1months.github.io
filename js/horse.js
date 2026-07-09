"use strict";
/* ============ Enclose the Horse ============
   Hex meadow ("odd-r" offset layout: odd rows shifted right). Each turn the
   player blocks one cell, then the horse takes one step along a shortest
   route to an open edge cell. Horse on the edge = escaped. Horse with no
   free neighbours = enclosed.                                          */

const H_ROWS = 11, H_COLS = 11;

/* ---------- pure logic (unit-tested in tests/games.test.js) ---------- */

function hexNeighbors(i, rows, cols){
  const r = Math.floor(i / cols), c = i % cols;
  const shifts = (r % 2 === 0)
    ? [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
    : [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]];
  const out = [];
  for (const [dr, dc] of shifts){
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
  }
  return out;
}

function isEdge(i, rows, cols){
  const r = Math.floor(i / cols), c = i % cols;
  return r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
}

/* Steps for each free cell to reach an open edge cell (BFS from the rim). */
function escapeDistances(blocked, rows, cols){
  const dist = new Array(rows * cols).fill(Infinity);
  const q = [];
  for (let i = 0; i < rows * cols; i++){
    if (isEdge(i, rows, cols) && !blocked[i]){
      dist[i] = 0;
      q.push(i);
    }
  }
  let head = 0;
  while (head < q.length){
    const cur = q[head++];
    for (const nb of hexNeighbors(cur, rows, cols)){
      if (!blocked[nb] && dist[nb] === Infinity){
        dist[nb] = dist[cur] + 1;
        q.push(nb);
      }
    }
  }
  return dist;
}

/* The horse's next cell: a best step toward the nearest open edge (random
   among ties), a random wander if fully cut off, or -1 if it can't move. */
function chooseHorseMove(blocked, horse, rows, cols){
  const free = hexNeighbors(horse, rows, cols).filter(i => !blocked[i]);
  if (!free.length) return -1;
  const dist = escapeDistances(blocked, rows, cols);
  let best = Infinity;
  for (const i of free) if (dist[i] < best) best = dist[i];
  const pool = best === Infinity ? free : free.filter(i => dist[i] === best);
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- DOM app ---------- */
if (typeof document !== "undefined"){
  const board = document.getElementById("board");
  const fencesEl = document.getElementById("fences");
  const diffSel = document.getElementById("diffSel");
  const newBtn = document.getElementById("newBtn");
  const banner = document.getElementById("winBanner");
  const bannerBig = document.getElementById("bannerBig");
  const bannerSub = document.getElementById("bannerSub");

  const PREBLOCKED = { easy: 12, medium: 9, hard: 6 };
  const CENTER = Math.floor(H_ROWS / 2) * H_COLS + Math.floor(H_COLS / 2);

  let blocked = [], horse = CENTER, fences = 0, done = false;
  const cells = [];

  for (let r = 0; r < H_ROWS; r++){
    const row = document.createElement("div");
    row.className = "hrow" + (r % 2 === 1 ? " odd" : "");
    for (let c = 0; c < H_COLS; c++){
      const i = r * H_COLS + c;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "hcell";
      el.setAttribute("aria-label", "meadow cell " + (r + 1) + "," + (c + 1));
      el.addEventListener("click", () => onCell(i));
      cells.push(el);
      row.appendChild(el);
    }
    board.appendChild(row);
  }

  function render(){
    for (let i = 0; i < cells.length; i++){
      cells[i].classList.toggle("blocked", blocked[i]);
      cells[i].classList.toggle("horse", i === horse);
      cells[i].textContent = i === horse ? "🐴" : "";
    }
  }

  function onCell(i){
    if (done || blocked[i] || i === horse) return;
    blocked[i] = true;
    fences++;
    fencesEl.textContent = fences;

    const mv = chooseHorseMove(blocked, horse, H_ROWS, H_COLS);
    if (mv === -1){
      render();
      end(true);
      return;
    }
    horse = mv;
    render();
    if (isEdge(horse, H_ROWS, H_COLS)) end(false);
  }

  function end(win){
    done = true;
    board.classList.add("done");
    banner.classList.toggle("lose", !win);
    bannerBig.textContent = win ? "Horse enclosed! 🎉" : "The horse escaped! 🐴💨";
    bannerSub.textContent = win
      ? "penned in with " + fences + " fence posts"
      : "it found a gap in the fence — try again!";
    banner.classList.add("show");
    if (win) celebrate();
  }

  function newGame(){
    blocked = new Array(H_ROWS * H_COLS).fill(false);
    horse = CENTER;
    fences = 0;
    fencesEl.textContent = "0";
    done = false;
    banner.classList.remove("show", "lose");
    board.classList.remove("done");
    const count = PREBLOCKED[diffSel.value] || 9;
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 500){
      const i = Math.floor(Math.random() * H_ROWS * H_COLS);
      if (i !== horse && !blocked[i]){
        blocked[i] = true;
        placed++;
      }
    }
    render();
  }

  diffSel.addEventListener("change", newGame);
  newBtn.addEventListener("click", newGame);

  newGame();
}

if (typeof module !== "undefined" && module.exports){
  module.exports = { hexNeighbors, isEdge, escapeDistances, chooseHorseMove };
}
