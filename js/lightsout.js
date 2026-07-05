"use strict";
/* ============ Timezone Sync (Lights Out) ============
   grid[i] = true means that timezone is lit (daytime). Pressing a cell
   flips it and its four orthogonal neighbours. Goal: everything lit.  */

const L_SIZE = 5;

/* ---------- pure logic (unit-tested in tests/games.test.js) ---------- */

function pressAt(grid, size, i){
  const r = Math.floor(i / size), c = i % size;
  const flip = j => { grid[j] = !grid[j]; };
  flip(i);
  if (r > 0) flip(i - size);
  if (r < size - 1) flip(i + size);
  if (c > 0) flip(i - 1);
  if (c < size - 1) flip(i + 1);
}

function allLit(grid){
  return grid.every(Boolean);
}

/* Start from the solved (all-day) board and "unsync" it with random presses.
   Pressing those same cells again always solves it, so every puzzle is
   solvable and `solution` is a known answer. */
function generatePuzzle(size, difficulty){
  for (let attempt = 0; attempt < 50; attempt++){
    const grid = new Array(size * size).fill(true);
    let presses = [];
    if (difficulty === "hard"){
      for (let i = 0; i < size * size; i++)
        if (Math.random() < 0.5) presses.push(i);
    } else {
      const count = difficulty === "easy" ? 5 : 9;
      const all = Array.from({ length: size * size }, (_, i) => i);
      for (let i = all.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      presses = all.slice(0, count);
    }
    presses.forEach(p => pressAt(grid, size, p));
    if (!allLit(grid)) return { grid, solution: presses };
  }
  const grid = new Array(size * size).fill(true);
  pressAt(grid, size, 0);
  return { grid, solution: [0] };
}

/* ---------- DOM app ---------- */
if (typeof document !== "undefined"){
  const board = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const diffSel = document.getElementById("diffSel");
  const newBtn = document.getElementById("newBtn");
  const restartBtn = document.getElementById("restartBtn");
  const hintBtn = document.getElementById("hintBtn");
  const banner = document.getElementById("winBanner");
  const winSub = document.getElementById("winSub");

  let grid = [], initial = [], genSolution = [];
  let solutionSet = new Set(); // press these cells (in any order) to solve from the current state
  let moves = 0, done = false;
  const cells = [];

  for (let i = 0; i < L_SIZE * L_SIZE; i++){
    const el = document.createElement("button");
    el.type = "button";
    el.className = "lcell";
    el.setAttribute("aria-label", "timezone " + (Math.floor(i / L_SIZE) + 1) + "," + (i % L_SIZE + 1));
    el.addEventListener("click", () => onPress(i));
    cells.push(el);
    board.appendChild(el);
  }

  function render(){
    for (let i = 0; i < grid.length; i++){
      cells[i].classList.toggle("lit", grid[i]);
      cells[i].classList.toggle("dark", !grid[i]);
      cells[i].textContent = grid[i] ? "☀️" : "🌙";
    }
  }

  function clearHint(){
    cells.forEach(el => el.classList.remove("hint"));
  }

  function onPress(i){
    if (done) return;
    pressAt(grid, L_SIZE, i);
    moves++;
    movesEl.textContent = moves;
    if (solutionSet.has(i)) solutionSet.delete(i); else solutionSet.add(i);
    clearHint();
    render();
    if (allLit(grid)){
      done = true;
      board.classList.add("done");
      winSub.textContent = "solved in " + moves + " moves";
      banner.classList.add("show");
      celebrate();
    }
  }

  function resetUI(){
    moves = 0;
    movesEl.textContent = "0";
    done = false;
    banner.classList.remove("show");
    board.classList.remove("done");
    clearHint();
    render();
  }

  function newGame(){
    const p = generatePuzzle(L_SIZE, diffSel.value);
    grid = p.grid.slice();
    initial = p.grid.slice();
    genSolution = p.solution.slice();
    solutionSet = new Set(genSolution);
    resetUI();
  }

  function restart(){
    grid = initial.slice();
    solutionSet = new Set(genSolution);
    resetUI();
  }

  function hint(){
    if (done) return;
    const next = solutionSet.values().next();
    if (next.done) return;
    cells[next.value].classList.add("hint");
    setTimeout(() => cells[next.value].classList.remove("hint"), 1600);
  }

  diffSel.addEventListener("change", newGame);
  newBtn.addEventListener("click", newGame);
  restartBtn.addEventListener("click", restart);
  hintBtn.addEventListener("click", hint);

  newGame();
}

if (typeof module !== "undefined" && module.exports){
  module.exports = { pressAt, allLit, generatePuzzle };
}
