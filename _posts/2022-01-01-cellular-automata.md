---
layout: site
title: Cellular Automata
date: 2022-01-02 15:32:41 -0500
permalink: /automata/
scripts:
  - automata
stylesheets:
  - automata
image: automata.png
---
<div style='position: relative; text-align: center;'>
  <div id='start' style='display: none; position: absolute; top: 40%; width: 200px; left: 50%; margin-left: -100px'>
    <button class='button-primary' onclick='start(); return false;'>Start</button>
    <p>(warning: strobe effect)</p>
  </div>
  <svg id='grid' viewBox='0 0 100 100'></svg>
</div>

##### Voting-based Conway's Life Variant

Cells are represented by some state (A, B, C, etc.).

On each tick, each cell takes the state of the largest non-majority of its neighbors. In the event of a tie, a cell keeps its current state.

Patches of two states stabilize towards clusters of maze-like patterns, while patches of three or more states exhibit chaotic behavior. (Although there are three possible states in the randomly-generated seeds, all states are represented as either light or dark to better illustrate the behavior around cluster borders.)

Shading is smoothed over an eight generation window. Original unsmoothed version [here](/automata?l=1).