"use strict";
/* ============ Pipes ============
   Each cell's pipe is a bitmask of openings: 1=N, 2=E, 4=S, 8=W.
   The solution is a random spanning tree over the grid, so every puzzle is
   solvable — and once every cell is wet the layout is automatically the
   tree again, which means no leaks are possible.                        */

/* ---------- pure logic (unit-tested in tests/games.test.js) ---------- */

function rotCW(mask, k){
  k = ((k === undefined ? 1 : k) % 4 + 4) % 4;
  for (let i = 0; i < k; i++) mask = ((mask << 1) | (mask >>> 3)) & 15;
  return mask;
}

/* Random spanning tree via frontier-based (random Prim's) growth. */
function buildSolution(n){
  const masks = new Array(n * n).fill(0);
  const inTree = new Array(n * n).fill(false);
  const frontier = [];
  const start = Math.floor(n * n / 2);

  const bitToward = (a, b) => (b === a - n ? 1 : b === a + 1 ? 2 : b === a + n ? 4 : 8);
  const nbrs = i => {
    const r = Math.floor(i / n), c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  };
  const addFrontier = i => nbrs(i).forEach(j => { if (!inTree[j]) frontier.push([i, j]); });

  inTree[start] = true;
  addFrontier(start);
  while (frontier.length){
    const k = Math.floor(Math.random() * frontier.length);
    const edge = frontier[k];
    frontier[k] = frontier[frontier.length - 1];
    frontier.pop();
    const a = edge[0], b = edge[1];
    if (inTree[b]) continue;
    masks[a] |= bitToward(a, b);
    masks[b] |= bitToward(b, a);
    inTree[b] = true;
    addFrontier(b);
  }
  return masks;
}

/* Which cells receive water: BFS over matching openings from the source. */
function flood(masks, n, src){
  const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  const wet = new Set([src]);
  const q = [src];
  while (q.length){
    const cur = q.pop();
    const r = Math.floor(cur / n), c = cur % n;
    const steps = [
      [1, r > 0, cur - n],
      [2, c < n - 1, cur + 1],
      [4, r < n - 1, cur + n],
      [8, c > 0, cur - 1],
    ];
    for (const [bit, ok, nb] of steps){
      if (!ok || !(masks[cur] & bit)) continue;
      if (!(masks[nb] & OPP[bit]) || wet.has(nb)) continue;
      wet.add(nb);
      q.push(nb);
    }
  }
  return wet;
}

/* Rotate every piece randomly; keep trying until the board isn't solved. */
function scramble(base){
  const n2 = base.length;
  const n = Math.round(Math.sqrt(n2));
  const src = Math.floor(n2 / 2);
  for (let attempt = 0; attempt < 20; attempt++){
    const turns = base.map(() => Math.floor(Math.random() * 4));
    const masks = base.map((m, i) => rotCW(m, turns[i]));
    if (flood(masks, n, src).size < n2) return { masks, turns };
  }
  // last resort: turning one corner piece always breaks the network
  const turns = base.map(() => 0);
  turns[0] = 1;
  return { masks: base.map((m, i) => rotCW(m, turns[i])), turns };
}

/* ---------- DOM app ---------- */
if (typeof document !== "undefined"){
  const board = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timeEl = document.getElementById("time");
  const sizeSel = document.getElementById("sizeSel");
  const newBtn = document.getElementById("newBtn");
  const banner = document.getElementById("winBanner");
  const winSub = document.getElementById("winSub");

  let n = 7, srcIdx = 0;
  let masks = [], rotAcc = [], locked = [];
  let cellEls = [];
  let moves = 0, seconds = 0, timer = null, done = false;

  const setTime = () => { timeEl.textContent = formatTime(seconds); };
  const startTimer = () => { if (!timer) timer = setInterval(() => { seconds++; setTime(); }, 1000); };
  const stopTimer = () => { clearInterval(timer); timer = null; };

  function cellSVG(mask, isSource){
    const ends = { 1: [50, 0], 2: [100, 50], 4: [50, 100], 8: [0, 50] };
    let s = '<svg viewBox="0 0 100 100" aria-hidden="true">';
    for (const b of [1, 2, 4, 8])
      if (mask & b) s += '<line x1="50" y1="50" x2="' + ends[b][0] + '" y2="' + ends[b][1] + '"/>';
    const isEnd = mask === 1 || mask === 2 || mask === 4 || mask === 8;
    s += '<circle class="dot" cx="50" cy="50" r="' + (isEnd ? 17 : 13) + '"/>';
    if (isSource) s += '<circle class="src-ring" cx="50" cy="50" r="27"/>';
    return s + "</svg>";
  }

  function build(){
    board.innerHTML = "";
    board.style.setProperty("--n", n);
    cellEls = [];
    for (let i = 0; i < n * n; i++){
      const el = document.createElement("button");
      el.type = "button";
      el.className = "pcell";
      el.innerHTML = cellSVG(masks[i], i === srcIdx);
      el.setAttribute("aria-label", "pipe " + (Math.floor(i / n) + 1) + "," + (i % n + 1));
      el.addEventListener("click", () => rotate(i));
      el.addEventListener("contextmenu", e => { e.preventDefault(); toggleLock(i); });
      cellEls.push(el);
      board.appendChild(el);
    }
    repaint();
  }

  function rotate(i){
    if (done || locked[i]) return;
    masks[i] = rotCW(masks[i], 1);
    rotAcc[i]++;
    cellEls[i].querySelector("svg").style.transform = "rotate(" + rotAcc[i] * 90 + "deg)";
    moves++;
    movesEl.textContent = moves;
    startTimer();
    repaint();
  }

  function toggleLock(i){
    if (done) return;
    locked[i] = !locked[i];
    cellEls[i].classList.toggle("locked", locked[i]);
  }

  function repaint(){
    const wet = flood(masks, n, srcIdx);
    for (let i = 0; i < n * n; i++) cellEls[i].classList.toggle("wet", wet.has(i));
    if (wet.size === n * n && !done){
      done = true;
      stopTimer();
      board.classList.add("done");
      winSub.textContent = moves + " moves · " + formatTime(seconds);
      banner.classList.add("show");
      celebrate();
    }
  }

  function newGame(){
    n = parseInt(sizeSel.value, 10);
    srcIdx = Math.floor(n * n / 2);
    const s = scramble(buildSolution(n));
    masks = s.masks;
    rotAcc = new Array(n * n).fill(0);
    locked = new Array(n * n).fill(false);
    moves = 0; movesEl.textContent = "0";
    seconds = 0; setTime(); stopTimer();
    done = false;
    banner.classList.remove("show");
    board.classList.remove("done");
    build();
  }

  sizeSel.addEventListener("change", newGame);
  newBtn.addEventListener("click", newGame);

  newGame();
}

if (typeof module !== "undefined" && module.exports){
  module.exports = { rotCW, buildSolution, flood, scramble };
}
