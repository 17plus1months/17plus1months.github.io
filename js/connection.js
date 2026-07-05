"use strict";
/* ============ Connection Grid ============
   Draw one unbroken line from the top-left (🏠) to the bottom-right (🌟)
   through open cells. Blockers can't be used. The line may not branch,
   loop, or leave stray pieces.                                        */

/* ---------- pure logic (unit-tested in tests/games.test.js) ---------- */

/* Random "induced" simple path from corner to corner: no cell of the path
   ever touches the path anywhere except its predecessor/successor. That
   guarantees the generated path itself satisfies checkWin. */
function randomPath(n){
  const target = n * n - 1;
  for (let attempt = 0; attempt < 8; attempt++){
    const visited = new Array(n * n).fill(false);
    const path = [];
    const budget = { calls: 0 };
    if (dfsPath(0, -1, n, target, visited, path, budget)) return path;
  }
  // pathological fallback: top row then right column (always an induced path)
  const path = [];
  for (let c = 0; c < n; c++) path.push(c);
  for (let r = 1; r < n; r++) path.push(r * n + (n - 1));
  return path;
}

function dfsPath(cell, from, n, target, visited, path, budget){
  if (++budget.calls > 30000) return false;
  visited[cell] = true;
  path.push(cell);
  if (cell === target) return true;
  const r = Math.floor(cell / n), c = cell % n;
  const nbrs = [];
  if (r > 0) nbrs.push(cell - n);
  if (r < n - 1) nbrs.push(cell + n);
  if (c > 0) nbrs.push(cell - 1);
  if (c < n - 1) nbrs.push(cell + 1);
  for (let i = nbrs.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [nbrs[i], nbrs[j]] = [nbrs[j], nbrs[i]];
  }
  for (const nb of nbrs){
    if (visited[nb]) continue;
    if (pathTouchCount(nb, n, visited) !== 1) continue; // would touch the path somewhere else
    if (dfsPath(nb, cell, n, target, visited, path, budget)) return true;
  }
  visited[cell] = false;
  path.pop();
  return false;
}

function pathTouchCount(cell, n, visited){
  const r = Math.floor(cell / n), c = cell % n;
  let count = 0;
  if (r > 0 && visited[cell - n]) count++;
  if (r < n - 1 && visited[cell + n]) count++;
  if (c > 0 && visited[cell - 1]) count++;
  if (c < n - 1 && visited[cell + 1]) count++;
  return count;
}

/* Carve a guaranteed path first, then sprinkle blockers on the other cells. */
function generatePuzzle(n, density){
  const path = randomPath(n);
  const onPath = new Array(n * n).fill(false);
  path.forEach(c => { onPath[c] = true; });
  const blocked = new Array(n * n).fill(false);
  for (let i = 0; i < n * n; i++)
    if (!onPath[i] && Math.random() < density) blocked[i] = true;
  return { blocked, path };
}

/* sel[i] = cell i is part of the drawn line. Win = one simple path from
   start to end: both endpoints have exactly one selected neighbour, every
   other selected cell exactly two, and everything is one connected piece. */
function checkWin(sel, n){
  const start = 0, end = n * n - 1;
  if (!sel[start] || !sel[end]) return false;
  let total = 0;
  for (let i = 0; i < n * n; i++){
    if (!sel[i]) continue;
    total++;
    const d = selDegree(sel, n, i);
    if (i === start || i === end){
      if (d !== 1) return false;
    } else if (d !== 2){
      return false;
    }
  }
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length){
    const cur = queue.pop();
    const r = Math.floor(cur / n), c = cur % n;
    const nbrs = [];
    if (r > 0) nbrs.push(cur - n);
    if (r < n - 1) nbrs.push(cur + n);
    if (c > 0) nbrs.push(cur - 1);
    if (c < n - 1) nbrs.push(cur + 1);
    for (const nb of nbrs){
      if (sel[nb] && !seen.has(nb)){
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return seen.size === total && seen.has(end);
}

function selDegree(sel, n, i){
  const r = Math.floor(i / n), c = i % n;
  let d = 0;
  if (r > 0 && sel[i - n]) d++;
  if (r < n - 1 && sel[i + n]) d++;
  if (c > 0 && sel[i - 1]) d++;
  if (c < n - 1 && sel[i + 1]) d++;
  return d;
}

/* ---------- DOM app ---------- */
if (typeof document !== "undefined"){
  const DIFFICULTY = {
    easy:   { n: 6,  density: 0.40 },
    medium: { n: 8,  density: 0.55 },
    hard:   { n: 10, density: 0.68 },
  };

  const board = document.getElementById("board");
  const pathLenEl = document.getElementById("pathLen");
  const statusEl = document.getElementById("status");
  const diffSel = document.getElementById("diffSel");
  const newBtn = document.getElementById("newBtn");
  const clearBtn = document.getElementById("clearBtn");
  const banner = document.getElementById("winBanner");
  const winSub = document.getElementById("winSub");

  const wire = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  wire.id = "wire";
  wire.setAttribute("preserveAspectRatio", "none");

  let n = 8, blocked = [], sel = [];
  let cells = [];
  let done = false, painting = false, paintMode = true;

  const startIdx = () => 0;
  const endIdx = () => n * n - 1;

  function build(){
    board.innerHTML = "";
    board.style.setProperty("--n", n);
    cells = [];
    for (let i = 0; i < n * n; i++){
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ccell";
      el.dataset.i = i;
      if (blocked[i]){
        el.classList.add("blocked");
        el.setAttribute("aria-disabled", "true");
      }
      if (i === startIdx()) el.textContent = "🏠";
      if (i === endIdx()) el.textContent = "🌟";
      el.setAttribute("aria-label", "cell " + (Math.floor(i / n) + 1) + "," + (i % n + 1));
      cells.push(el);
      board.appendChild(el);
    }
    board.appendChild(wire); // on top, pointer-events:none
    update();
  }

  function setCell(i, val){
    if (done || blocked[i]) return;
    if (i === startIdx() || i === endIdx()) val = true; // endpoints are permanent
    if (sel[i] === val) return;
    sel[i] = val;
    update();
  }

  function cellFromEvent(e){
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el && el.closest ? el.closest(".ccell") : null;
    return cell && board.contains(cell) ? Number(cell.dataset.i) : -1;
  }

  function onPointerDown(e){
    if (done) return;
    const i = cellFromEvent(e);
    if (i < 0 || blocked[i]) return;
    e.preventDefault();
    painting = true;
    paintMode = !sel[i];
    if (i === startIdx() || i === endIdx()) paintMode = true;
    if (board.setPointerCapture) board.setPointerCapture(e.pointerId);
    setCell(i, paintMode);
  }

  function onPointerMove(e){
    if (!painting || done) return;
    const i = cellFromEvent(e);
    if (i >= 0) setCell(i, paintMode);
  }

  function stopPainting(){ painting = false; }

  function connectedFrom(start){
    const seen = new Set(sel[start] ? [start] : []);
    const queue = [...seen];
    while (queue.length){
      const cur = queue.pop();
      const r = Math.floor(cur / n), c = cur % n;
      const nbrs = [];
      if (r > 0) nbrs.push(cur - n);
      if (r < n - 1) nbrs.push(cur + n);
      if (c > 0) nbrs.push(cur - 1);
      if (c < n - 1) nbrs.push(cur + 1);
      for (const nb of nbrs){
        if (sel[nb] && !seen.has(nb)){
          seen.add(nb);
          queue.push(nb);
        }
      }
    }
    return seen;
  }

  function update(){
    const conn = connectedFrom(startIdx());
    let count = 0, bad = 0, orphan = 0;
    for (let i = 0; i < n * n; i++){
      const isSel = !!sel[i];
      if (isSel) count++;
      const isBad = isSel && selDegree(sel, n, i) > 2;
      const isOrphan = isSel && !conn.has(i);
      cells[i].classList.toggle("sel", isSel);
      cells[i].classList.toggle("bad", isBad);
      cells[i].classList.toggle("orphan", isOrphan);
      if (isBad) bad++;
      if (isOrphan) orphan++;
    }
    pathLenEl.textContent = count;

    const won = !done && checkWin(sel, n);
    if (won){
      done = true;
      board.classList.add("done");
      winSub.textContent = "a perfect " + count + "-cell route";
      banner.classList.add("show");
      celebrate();
    }

    if (done) statusEl.textContent = "Connected! 🎉";
    else if (bad) statusEl.textContent = "The line is branching — trim the red bits";
    else if (orphan) statusEl.textContent = "Link every piece back to 🏠";
    else if (count === 2) statusEl.textContent = "Draw a line from 🏠 to 🌟";
    else if (conn.has(endIdx())) statusEl.textContent = "So close — make it one clean line";
    else statusEl.textContent = "Keep drawing…";

    redrawWire(conn);
  }

  function redrawWire(conn){
    const bRect = board.getBoundingClientRect();
    if (!bRect.width) return;
    wire.setAttribute("viewBox", "0 0 " + bRect.width + " " + bRect.height);
    const centers = [];
    for (let i = 0; i < n * n; i++){
      const r = cells[i].getBoundingClientRect();
      centers[i] = [r.left - bRect.left + r.width / 2, r.top - bRect.top + r.height / 2];
    }
    const strokeW = (cells[0].getBoundingClientRect().width * 0.3).toFixed(1);
    let html = "";
    for (let i = 0; i < n * n; i++){
      if (!sel[i]) continue;
      const r = Math.floor(i / n), c = i % n;
      for (const j of [c < n - 1 ? i + 1 : -1, r < n - 1 ? i + n : -1]){
        if (j < 0 || !sel[j]) continue;
        const color = done ? "#35c26b" : (conn.has(i) && conn.has(j) ? "#3fa7d6" : "#a9b2c6");
        html += '<line x1="' + centers[i][0] + '" y1="' + centers[i][1] +
                '" x2="' + centers[j][0] + '" y2="' + centers[j][1] +
                '" stroke="' + color + '" stroke-width="' + strokeW +
                '" stroke-linecap="round" opacity="0.75"/>';
      }
    }
    wire.innerHTML = html;
  }

  function freshSelection(){
    sel = new Array(n * n).fill(false);
    sel[startIdx()] = true;
    sel[endIdx()] = true;
  }

  function newGame(){
    const cfg = DIFFICULTY[diffSel.value] || DIFFICULTY.medium;
    n = cfg.n;
    blocked = generatePuzzle(n, cfg.density).blocked;
    freshSelection();
    done = false;
    banner.classList.remove("show");
    board.classList.remove("done");
    build();
  }

  function clearPath(){
    freshSelection();
    done = false;
    banner.classList.remove("show");
    board.classList.remove("done");
    update();
  }

  board.addEventListener("pointerdown", onPointerDown);
  board.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", stopPainting);
  window.addEventListener("pointercancel", stopPainting);
  window.addEventListener("resize", () => { if (cells.length) update(); });
  diffSel.addEventListener("change", newGame);
  newBtn.addEventListener("click", newGame);
  clearBtn.addEventListener("click", clearPath);

  newGame();
}

if (typeof module !== "undefined" && module.exports){
  module.exports = { randomPath, generatePuzzle, checkWin, selDegree };
}
