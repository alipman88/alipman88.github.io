---
layout: site
title: Cellular Automata
date: 2022-01-02 15:32:41 -0500
permalink: /automata/
scripts:
  - automata
stylesheets:
  - automata
---
<div style='text-align: center;'>
  <svg id='grid' viewBox='0 0 100 100'></svg>
</div>

##### Voting-based Conway's Life Variant

Cells are represented by some state (A, B, C, etc.).

On each tick, each cell takes the state of the largest non-majority of its neighbors. In the event of a tie, a cell keeps its current state.

Patches of two states stabilize towards maze-like patterns, while patches of three or more states exhibit chaotic behavior.
