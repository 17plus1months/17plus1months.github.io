"use strict";
/* Logic tests for the three puzzles. Run with:  node tests/games.test.js
   These exercise the pure puzzle-generation functions and prove every
   generated puzzle is actually solvable. */

const path = require("path");
const sliding = require(path.join(__dirname, "..", "js", "sliding.js"));
const lights = require(path.join(__dirname, "..", "js", "lightsout.js"));
const conn = require(path.join(__dirname, "..", "js", "connection.js"));

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

/* ---------- connection grid ---------- */
for (const cfg of [{ n: 6, d: 0.40 }, { n: 8, d: 0.55 }, { n: 10, d: 0.68 }]){
  for (let k = 0; k < 80; k++){
    const p = conn.generatePuzzle(cfg.n, cfg.d);
    const last = p.path[p.path.length - 1];
    assert(p.path[0] === 0 && last === cfg.n * cfg.n - 1, "path runs corner to corner (n=" + cfg.n + ")");
    assert(p.path.every(c => !p.blocked[c]), "no blockers on the guaranteed path (n=" + cfg.n + ")");
    const sel = new Array(cfg.n * cfg.n).fill(false);
    p.path.forEach(c => { sel[c] = true; });
    assert(conn.checkWin(sel, cfg.n), "guaranteed path passes the win check (n=" + cfg.n + ")");
    sel[p.path[1]] = false; // snip the line near the start
    assert(!conn.checkWin(sel, cfg.n), "broken path fails the win check (n=" + cfg.n + ")");
  }
}

console.log(checks + " checks, " + fails + " failures");
process.exit(fails ? 1 : 0);
