Number.prototype.mod = function(n) { return ((this % n) + n) % n; }

const states = {
  0: 0,
  1: Math.random() < 0.50 ? 0 : 1,
  2: 1,
};

const dark= [39, 40, 34];
const lite = [248, 248, 242];

const cCount = Object.keys(states).length;
const svg = d3.select('#grid');
const w = 100;
const h = 100;

const url = new URL(document.location.href);
const l = Number(url.searchParams.get('l')) || 12;

// randomize grid
let grid = Array(h).fill().map(_ => Array(w).fill().map(_ => Array(l-1).fill(states[1]).concat(Math.floor(cCount * Math.random()))));

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
    .style('fill', (d) => {
      const pct = 1.0 * d.map((a) => states[a]).reduce((a, b) => a + b) / l;
      const alt = 1.0 - pct;
      const rgb = [0,1,2].map((p) => dark[p] * pct + lite[p] * alt)
      return d3.rgb(...rgb);
    });
}

// next value for cell
const cTick = function(r, c) {
  const val = grid[r][c][l-1];
  let res = {};

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) { continue; }
      let v = grid[(r + i).mod(h)][(c + j).mod(w)][l-1];
      if (!res[v]) res[v] = 0;
      res[v]++;
    }
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

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      grid[r][c].push(Number(cTick(r, c)));
    }
  }

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      grid[r][c].shift();
    }
  }

  const f = Date.now() - t;
  setTimeout(tick, 75 - f);
}

const startScreen = d3.select('#start')

const start = function() {
  startScreen.style('display', 'none');
  document.cookie = "strobeWarning=1; expires=Fri, 31 Dec 9999 23:59:59 UTC; path=/";
  tick();
}

// start
if (document.cookie.indexOf('strobeWarning') > -1 || l > 1) {
  tick();
} else {
  startScreen.style('display', 'block');
}
