"use strict";
/* ============ The Sliding Memory ============
   To use your own picture: drop it into images/ (square photos look best —
   anything else gets center-cropped) and change IMAGE_SRC below,
   e.g. "images/us.jpg".                                                */
const IMAGE_SRC = "images/placeholder.svg";

/* ---------- pure logic (unit-tested in tests/games.test.js) ----------
   tiles[pos] = which tile sits at board position pos.
   Tile size*size-1 is the blank. Solved when tiles[i] === i.          */

function createSolved(size){
  return Array.from({ length: size * size }, (_, i) => i);
}

function isSolved(tiles){
  return tiles.every((t, i) => t === i);
}

function blankPos(tiles){
  return tiles.indexOf(tiles.length - 1);
}

function neighborsOf(pos, size){
  const r = Math.floor(pos / size), c = pos % size, out = [];
  if (r > 0) out.push(pos - size);
  if (r < size - 1) out.push(pos + size);
  if (c > 0) out.push(pos - 1);
  if (c < size - 1) out.push(pos + 1);
  return out;
}

/* Slide the run of tiles between position `pos` and the blank (same row or
   column) one step toward the blank. Mutates tiles; returns how many tiles
   moved (0 = not in the blank's row/column). */
function slideTo(tiles, size, pos){
  let blank = blankPos(tiles);
  if (pos === blank) return 0;
  const br = Math.floor(blank / size), bc = blank % size;
  const pr = Math.floor(pos / size), pc = pos % size;
  let step;
  if (pr === br) step = pc > bc ? 1 : -1;
  else if (pc === bc) step = pr > br ? size : -size;
  else return 0;
  let moved = 0;
  while (blank !== pos){
    const next = blank + step;
    tiles[blank] = tiles[next];
    tiles[next] = tiles.length - 1;
    blank = next;
    moved++;
  }
  return moved;
}

/* Shuffle by random legal moves from the solved state — always solvable. */
function shuffledBoard(size, steps){
  const tiles = createSolved(size);
  steps = steps || size * size * 20;
  let prevBlank = -1;
  for (let i = 0; i < steps; i++){
    const blank = blankPos(tiles);
    const options = neighborsOf(blank, size).filter(p => p !== prevBlank);
    const pick = options[Math.floor(Math.random() * options.length)];
    prevBlank = blank;
    slideTo(tiles, size, pick);
  }
  if (isSolved(tiles)) return shuffledBoard(size, steps);
  return tiles;
}

/* Classic 15-puzzle solvability rule — kept as a safety net for the tests. */
function isSolvable(tiles, size){
  const blankTile = tiles.length - 1;
  const seq = tiles.filter(t => t !== blankTile);
  let inv = 0;
  for (let i = 0; i < seq.length; i++)
    for (let j = i + 1; j < seq.length; j++)
      if (seq[i] > seq[j]) inv++;
  if (size % 2 === 1) return inv % 2 === 0;
  const rowFromBottom = size - Math.floor(blankPos(tiles) / size);
  return (inv + rowFromBottom) % 2 === 1;
}

/* ---------- DOM app ---------- */
if (typeof document !== "undefined"){
  const board = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timeEl = document.getElementById("time");
  const sizeSel = document.getElementById("sizeSel");
  const newBtn = document.getElementById("newBtn");
  const numsChk = document.getElementById("numsChk");
  const banner = document.getElementById("winBanner");
  const winSub = document.getElementById("winSub");
  const previewImg = document.getElementById("previewImg");

  let size = 4;
  let tiles = createSolved(size);
  let tileEls = [];
  let moves = 0, seconds = 0, timer = null, done = false;
  let imageURL = null;

  const setTime = () => { timeEl.textContent = formatTime(seconds); };
  const startTimer = () => { if (!timer) timer = setInterval(() => { seconds++; setTime(); }, 1000); };
  const stopTimer = () => { clearInterval(timer); timer = null; };

  function buildTiles(){
    board.innerHTML = "";
    board.style.setProperty("--n", size);
    tileEls = [];
    const blankTile = size * size - 1;
    for (let t = 0; t < size * size; t++){
      const el = document.createElement("button");
      el.type = "button";
      el.className = "tile";
      const hr = Math.floor(t / size), hc = t % size;
      el.style.backgroundImage = 'url("' + imageURL + '")';
      el.style.backgroundSize = size * 100 + "% " + size * 100 + "%";
      el.style.backgroundPosition = (hc * 100) / (size - 1) + "% " + (hr * 100) / (size - 1) + "%";
      el.setAttribute("aria-label", "tile " + (t + 1));
      if (t === blankTile) el.style.visibility = "hidden";
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = t + 1;
      el.appendChild(num);
      el.addEventListener("click", () => onTileClick(t));
      tileEls[t] = el;
      board.appendChild(el);
    }
    layout();
  }

  function layout(){
    for (let pos = 0; pos < tiles.length; pos++){
      const r = Math.floor(pos / size), c = pos % size;
      tileEls[tiles[pos]].style.transform = "translate(" + c * 100 + "%, " + r * 100 + "%)";
    }
  }

  function onTileClick(t){
    if (done) return;
    const n = slideTo(tiles, size, tiles.indexOf(t));
    if (!n) return;
    moves += n;
    movesEl.textContent = moves;
    startTimer();
    layout();
    checkWin();
  }

  function onKey(e){
    if (done || e.target.closest("select,input")) return;
    const blank = blankPos(tiles);
    const br = Math.floor(blank / size), bc = blank % size;
    let target = -1;
    if (e.key === "ArrowUp" && br < size - 1) target = blank + size;
    else if (e.key === "ArrowDown" && br > 0) target = blank - size;
    else if (e.key === "ArrowLeft" && bc < size - 1) target = blank + 1;
    else if (e.key === "ArrowRight" && bc > 0) target = blank - 1;
    if (target < 0) return;
    e.preventDefault();
    onTileClick(tiles[target]);
  }

  function checkWin(){
    if (!isSolved(tiles)) return;
    done = true;
    stopTimer();
    tileEls[size * size - 1].style.visibility = "visible"; // complete the picture
    board.classList.add("done");
    winSub.textContent = moves + " moves · " + formatTime(seconds);
    banner.classList.add("show");
    celebrate();
  }

  function newGame(){
    size = parseInt(sizeSel.value, 10);
    tiles = shuffledBoard(size);
    moves = 0; movesEl.textContent = "0";
    seconds = 0; setTime(); stopTimer();
    done = false;
    banner.classList.remove("show");
    board.classList.remove("done");
    buildTiles();
  }

  /* Center-crop the source image to a square via canvas so any photo works. */
  function prepareImage(onReady){
    const img = new Image();
    img.onload = () => {
      try {
        const s = Math.min(img.naturalWidth, img.naturalHeight) || 800;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 900;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 900, 900);
        imageURL = canvas.toDataURL("image/jpeg", 0.92);
      } catch (err) {
        imageURL = IMAGE_SRC; // canvas blocked (e.g. file://) — use the image as-is
      }
      previewImg.src = imageURL;
      onReady();
    };
    img.onerror = () => {
      imageURL = fallbackImage();
      previewImg.src = imageURL;
      onReady();
    };
    img.src = IMAGE_SRC;
  }

  /* If the image is missing entirely, draw a gradient so the game still works. */
  function fallbackImage(){
    const c = document.createElement("canvas");
    c.width = c.height = 900;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 900, 900);
    g.addColorStop(0, "#7c6cf0");
    g.addColorStop(0.5, "#e8618c");
    g.addColorStop(1, "#f0a132");
    x.fillStyle = g;
    x.fillRect(0, 0, 900, 900);
    x.fillStyle = "rgba(255,255,255,.25)";
    for (let i = 0; i < 12; i++){
      x.beginPath();
      x.arc(Math.random() * 900, Math.random() * 900, 30 + Math.random() * 90, 0, Math.PI * 2);
      x.fill();
    }
    return c.toDataURL();
  }

  sizeSel.addEventListener("change", newGame);
  newBtn.addEventListener("click", newGame);
  numsChk.addEventListener("change", () => board.classList.toggle("hide-nums", !numsChk.checked));
  document.addEventListener("keydown", onKey);

  prepareImage(newGame);
}

if (typeof module !== "undefined" && module.exports){
  module.exports = { createSolved, isSolved, blankPos, neighborsOf, slideTo, shuffledBoard, isSolvable };
}
