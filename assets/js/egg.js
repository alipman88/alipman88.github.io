const svg = d3.select('#egg');

// initialize layout
svg.append('polygon')
  .style('fill', '#CFD9DE')
  .style('stroke', '#333')
  .style('stroke-width', 4);
svg.selectAll('line')
  .data([[],[],[]])
  .enter()
  .append('line')
  .style('stroke', '#333')
  .style('stroke-width', 0);

function draw() {
  const L = parseFloat(document.getElementById('size').value);
  const B = L * parseFloat(document.getElementById('aspect').value);
  const w = L * parseFloat(document.getElementById('shift').value);
  const D = B * parseFloat(document.getElementById('relativeDiameter').value);

  const eggFn = x => {
    const num1 = L**2 - 4*x**2;
    const den1 = L**2 + 8*w*x + 4*w**2;
    const num2 = Math.sqrt(5.5*L**2 + 11*L*w + 4*w**2) * (Math.sqrt(3)*B*L - 2*D*Math.sqrt(L**2 + 2*w*L + 4*w**2));
    const den2 = Math.sqrt(3)*B*L * (Math.sqrt(5.5*L**2 + 11*L*w + 4*w**2) - 2*Math.sqrt(L**2 + 2*w*L + 4*w**2));
    const num3 = L * (L**2 + 8*w*x + 4*w**2);
    const den3 = 2*(L - 2*w) * x**2 + (L**2 + 8*L*w - 4*w**2)*x + 2*L*w**2 + (L**2) * w + L**3;
    return (B/2) * Math.sqrt(num1/den1) * (1 - (num2/den2) * (1 - Math.sqrt(num3/den3)));
  }

  let arr = [];

  for (let x = -L/2; x <= L/2; x += 1) {
    arr.push([x, eggFn(x)]);
  }

  const points = `${arr.map(p => `${p[0]},${p[1]}`).join(' ')} ${arr.reverse().map(p => `${p[0]},${-p[1]}`).join(' ')}`;
  const guidelines = [
    [    0,    0,   -w,    0],
    [   -w, -B/2,   -w,  B/2],
    [  L/4, -D/2,  L/4,  D/2],
  ];

  svg.select('polygon').attr('points', points);
  svg.selectAll('line').data(guidelines)
    .attr('x1', d => d[0])
    .attr('y1', d => d[1])
    .attr('x2', d => d[2])
    .attr('y2', d => d[3])
    .style('stroke', '#999')
    .style('stroke-width', document.getElementById('guidelines').checked ? 4 : 0)
}

draw();
