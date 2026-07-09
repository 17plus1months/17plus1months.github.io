"use strict";
/* Logic tests for the three puzzles. Run with:  node tests/games.test.js
   These exercise the pure puzzle-generation functions and prove every
   generated puzzle is actually solvable. */

const path = require("path");
const sliding = require(path.join(__dirname, "..", "js", "sliding.js"));
const lights = require(path.join(__dirname, "..", "js", "lightsout.js"));
const pipes = require(path.join(__dirname, "..", "js", "pipes.js"));
const horse = require(path.join(__dirname, "..", "js", "horse.js"));
const mines = require(path.join(__dirname, "..", "js", "minesweeper.js"));

let checks = 0, fails = 0;
function assert(cond, msg){
  checks++;
  if (!cond){
    fails++;
    console.error("FAIL:", msg);
  }
}

/* ---------- sliding puzzle ---------- */
for (const size of [3, 4, 5]){
  for (let k = 0; k < 60; k++){
    const t = sliding.shuffledBoard(size);
    assert(!sliding.isSolved(t), "shuffled " + size + "x" + size + " board is not solved");
    assert(sliding.isSolvable(t, size), "shuffled " + size + "x" + size + " board is solvable");
  }
  const bad = sliding.createSolved(size);
  [bad[0], bad[1]] = [bad[1], bad[0]];
  assert(!sliding.isSolvable(bad, size), "swapping two tiles makes " + size + "x" + size + " unsolvable");
}

// segment slide: on a solved 4x4 (blank at 15), clicking position 12 slides 3 tiles
{
  const t = sliding.createSolved(4);
  assert(sliding.slideTo(t, 4, 12) === 3, "row slide moves 3 tiles");
  assert(t[12] === 15 && t[13] === 12 && t[14] === 13 && t[15] === 14, "row slide shifts the run correctly");
  assert(sliding.slideTo(t, 4, 5) === 0, "cell outside blank's row/column does not move");
  const before = t.slice();
  assert(sliding.slideTo(t, 4, 12) === 0 && t.join() === before.join(), "clicking the blank itself is a no-op");
}

/* ---------- lights out ---------- */
for (const diff of ["easy", "medium", "hard"]){
  for (let k = 0; k < 80; k++){
    const p = lights.generatePuzzle(5, diff);
    assert(!lights.allLit(p.grid), "lights " + diff + " puzzle starts scrambled");
    const g = p.grid.slice();
    p.solution.forEach(i => lights.pressAt(g, 5, i));
    assert(lights.allLit(g), "lights " + diff + " stored solution solves the puzzle");
  }
}

/* ---------- pipes ---------- */
function popcount(m){
  let c = 0;
  while (m){ c += m & 1; m >>= 1; }
  return c;
}
for (let m = 0; m < 16; m++)
  assert(pipes.rotCW(m, 4) === m, "four quarter-turns return mask " + m + " to itself");
for (const n of [5, 7, 9, 11, 20]){
  const src = Math.floor(n * n / 2);
  for (let k = 0; k < 40; k++){
    const base = pipes.buildSolution(n);
    assert(base.every(m => m > 0), "every pipe cell has a connection (n=" + n + ")");
    const bits = base.reduce((s, m) => s + popcount(m), 0);
    assert(bits === 2 * (n * n - 1), "solution uses exactly spanning-tree stubs (n=" + n + ")");
    assert(pipes.flood(base, n, src).size === n * n, "solution floods the whole grid (n=" + n + ")");
    const s = pipes.scramble(base);
    const un = s.masks.map((m, i) => pipes.rotCW(m, (4 - s.turns[i]) % 4));
    assert(un.join() === base.join(), "scramble turns are invertible (n=" + n + ")");
    assert(pipes.flood(s.masks, n, src).size < n * n, "scrambled board starts unsolved (n=" + n + ")");
  }
}

/* ---------- enclose the horse ---------- */
{
  const R = 11, C = 11;
  const center = 5 * C + 5;
  for (let i = 0; i < R * C; i++)
    for (const nb of horse.hexNeighbors(i, R, C))
      assert(horse.hexNeighbors(nb, R, C).includes(i), "hex adjacency is symmetric at " + i);

  const empty = new Array(R * C).fill(false);
  assert(horse.escapeDistances(empty, R, C)[center] === 5, "center is 5 steps from the edge");

  for (let k = 0; k < 60; k++){
    const b = empty.slice();
    for (let j = 0; j < 15; j++) b[Math.floor(Math.random() * R * C)] = true;
    if (b[center]) continue;
    const mv = horse.chooseHorseMove(b, center, R, C);
    const freeNbrs = horse.hexNeighbors(center, R, C).filter(x => !b[x]);
    if (mv === -1){
      assert(freeNbrs.length === 0, "-1 only when fully surrounded");
      continue;
    }
    assert(!b[mv] && horse.hexNeighbors(center, R, C).includes(mv), "horse moves to a free neighbour");
    const d = horse.escapeDistances(b, R, C);
    const best = Math.min(...freeNbrs.map(x => d[x]));
    assert(d[mv] === best, "horse takes a best step toward the edge");
  }

  const ring = empty.slice();
  horse.hexNeighbors(center, R, C).forEach(i => { ring[i] = true; });
  assert(horse.chooseHorseMove(ring, center, R, C) === -1, "enclosed horse cannot move");
}

/* ---------- minesweeper ---------- */
{
  // neighbour counts: corner=3, edge=5, interior=8 (10x10)
  const R = 10, C = 10;
  assert(mines.msNeighbors(0, R, C).length === 3, "corner has 3 neighbours");
  assert(mines.msNeighbors(5, R, C).length === 5, "top edge has 5 neighbours");
  assert(mines.msNeighbors(44, R, C).length === 8, "interior has 8 neighbours");
  for (let i = 0; i < R * C; i++)
    for (const nb of mines.msNeighbors(i, R, C))
      assert(mines.msNeighbors(nb, R, C).includes(i), "minesweeper adjacency is symmetric at " + i);

  for (const [rows, cols, count] of [[9, 9, 13], [16, 16, 41], [24, 24, 92]]){
    for (let k = 0; k < 40; k++){
      const safe = Math.floor(Math.random() * rows * cols);
      const grid = mines.placeMines(rows, cols, count, safe);
      assert(grid.filter(Boolean).length === count, "placed exactly " + count + " mines (" + rows + "x" + cols + ")");
      assert(!grid[safe], "first-clicked cell is never a mine");
      for (const nb of mines.msNeighbors(safe, rows, cols))
        assert(!grid[nb], "first click's neighbours are never mines");

      // counts must equal the true adjacent-mine tally for every cell
      const counts = mines.computeCounts(grid, rows, cols);
      for (let i = 0; i < rows * cols; i++){
        const actual = mines.msNeighbors(i, rows, cols).filter(n => grid[n]).length;
        assert(counts[i] === actual, "count matches adjacency at cell " + i);
      }

      // revealing every non-mine cell wins; a mine is never auto-revealed
      const revealed = new Array(rows * cols).fill(false);
      let touchedMine = false;
      revealed[safe] = true; // seed, then flood from the guaranteed-open first click
      mines.revealFrom(safe, grid, counts, revealed, rows, cols);
      for (let i = 0; i < rows * cols; i++)
        if (!grid[i] && !revealed[i])
          mines.revealFrom(i, grid, counts, revealed, rows, cols);
      for (let i = 0; i < rows * cols; i++) if (grid[i] && revealed[i]) touchedMine = true;
      assert(!touchedMine, "flood never reveals a mine (" + rows + "x" + cols + ")");
      assert(mines.isWin(grid, revealed), "revealing all safe cells is a win (" + rows + "x" + cols + ")");
    }
  }

  // a first click on an all-clear opening floods a connected region of zeros
  {
    const rows = 8, cols = 8;
    const grid = mines.placeMines(rows, cols, 10, 0);
    const counts = mines.computeCounts(grid, rows, cols);
    const revealed = new Array(rows * cols).fill(false);
    const opened = mines.revealFrom(0, grid, counts, revealed, rows, cols);
    assert(opened.length >= 1 && opened.every(i => !grid[i]), "opening reveals only safe cells");
    assert(mines.revealFrom(0, grid, counts, revealed, rows, cols).length === 0, "re-revealing an open cell does nothing");
  }

  // revealing straight onto a mine returns nothing (caller handles the loss)
  {
    const grid = new Array(9).fill(false);
    grid[4] = true;
    const counts = mines.computeCounts(grid, 3, 3);
    const revealed = new Array(9).fill(false);
    assert(mines.revealFrom(4, grid, counts, revealed, 3, 3).length === 0, "revealFrom on a mine reveals nothing");
    assert(!mines.isWin(grid, revealed), "board with hidden safe cells is not won");
  }
}

console.log(checks + " checks, " + fails + " failures");
process.exit(fails ? 1 : 0);
