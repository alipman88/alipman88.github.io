Number.prototype.mod = function(n) { return ((this % n) + n) % n; }

const [a, b] = Math.random() > 0.50 ? ['#272822', '#f8f8f2'] : ['#f8f8f2', '#272822'];

const colors = Math.random() > 0.33 ? {
  0: a,
  1: a,
  2: b,
} : {
  0: a,
  1: a,
  2: b,
  3: b,
};

const neighbors = [
  [-1, -1],
  [-1,  0],
  [-1,  1],
  [ 0, -1],
  [ 0,  1],
  [ 1, -1],
  [ 1,  0],
  [ 1,  1],
];

const cCount = Object.keys(colors).length;
const svg = d3.select('#grid');
const w = 100;
const h = 100;

// randomize grid
let grid = Array(h).fill().map(x => Array(w).fill().map(x => Math.floor(cCount * Math.random())));

// layout
svg
  .selectAll('g')
  .data(grid)
  .enter()
  .append('g')
  .attr('transform', (d, r) => `translate(0, ${r})`)
  .selectAll('rect')
  .data(d => d)
  .enter()
  .append('rect')
  .attr('transform', (d, c) => `translate(${c}, 0)`)
  .attr('width', 1)
  .attr('height', 1)
  .style('fill', '#f8f8f2');

const draw = function() {
  svg
    .selectAll('g')
    .data(grid)
    .selectAll('rect')
    .data(d => d)
    .style('fill', d => colors[d]);
}

// next value for cell
const cTick = function(r, c) {
  const val = grid[r][c];
  let res = {};

  for (n of neighbors) {
    let v = grid[(r + n[0]).mod(h)][(c + n[1]).mod(w)];
    if (!res[v]) res[v] = 0;
    res[v]++;
  }

  let max = 0;
  let nval = val;

  for (let key in res) {
    if (res[key] > max && res[key] < 5) { nval = key; max = res[key]; } else
    if (res[key] === max)               { nval = val; }
  }

  return nval;
}

// next iteration of grid
const tick = function() {
  const t = Date.now();
  draw();

  let nextGrid = Array(h).fill().map(x => Array(w).fill(0));

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      nextGrid[r][c] = cTick(r, c);
    }
  }

  grid = nextGrid;

  const f = Date.now() - t;
  console.log(f)
  setTimeout(tick, 100 - f);
}

const startScreen = d3.select('#start')

const start = function() {
  startScreen.style('display', 'none');
  tick();
}

startScreen.style('display', 'block');
