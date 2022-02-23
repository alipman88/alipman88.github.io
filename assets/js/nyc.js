// File reader for user-provided CSVs
var reader = new FileReader();

function parseFile() {
  window.voterData = d3.csvParse(reader.result, function(d) {
    return d;
  });

  if (!window.voterData || !window.voterData[0] || !window.voterData[0].longitude || !window.voterData[0].latitude) {
    d3.select("#instructions")
      .text("Please ensure your CSV contains longitude and latitude columns.");
    setTimeout(function(){ alert("Please ensure your CSV contains longitude and latitude columns"); }, 1);
  } else {
    var fileName = document.querySelector('input[name=csv]').files[0].name;
    d3.select("#instructions")
      .text("Click start to reverse geocode New York City Council districts from voters' longitude and latitude coordinates contained in " + fileName + ".");
    d3.select("#startButton")
      .attr("style", "background-color: #FF8C00; border-color: #FF8C00;")
      .attr("onclick", "start(); return false;");
  }
}

function loadFile() {
  d3.select("#startButton")
    .attr("style", "background-color: #CCC; border-color: #CCC; cursor: default;")
    .attr("onclick", "return false;");
  var file = document.querySelector('input[name=csv]').files[0];
  d3.select("#fileName").text(file.name);
  reader.addEventListener("load", parseFile, false);
  if (file) {
    reader.readAsText(file);
  }
}

d3.csv("/data/nyc/city_councilors.csv").then(function(councilorData) {
  // build a hash of district data
  var districtHash = councilorData.reduce(function(map, obj) {
      obj.Voters = 0;
      map[obj.DistrictNumber] = obj;
      return map;
    }, {});

  d3.json("/data/nyc/city_council_districts.geo.json").then(function(districtData) {
    var districts = districtData.features;

    // Prepare SVG
    var width = 960;
    var height = 640;

    var projection = d3.geoMercator()
      .center([-73.94, 40.70])
      .scale(60000)
      .translate([(width) / 2, (height)/2]);

    var path = d3.geoPath().projection(projection);

    var svg = d3.select("#svgContainer").append("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("text")
      .attr("x", 12).attr("y", 30)
      .attr("id", "districtLabel")
      .style("font-size", "24px")
      .text("");

    svg.append("text")
      .attr("x", 12).attr("y", 54)
      .attr("id", "districtCouncilor")
      .style("font-size", "18px")
      .text("");

    svg.append("text")
      .attr("x", 12).attr("y", 78)
      .attr("id", "districtVoterCount")
      .text("");

    svg.append("text")
      .attr("x", 12).attr("y", 102)
      .attr("dy", 0)
      .attr("id", "districtNeighborhoods")
      .text("");

    svg.append("text")
      .attr("x", 690).attr("y", 24)
      .attr("id", "status1")
      .text("");

    svg.append("text")
      .attr("x", 690).attr("y", 48)
      .attr("id", "status2")
      .text("");

    var mouseover = function(d){
      // Highlight hovered district and display additional info
      d3.select(this).style('stroke', '#FF8C00');
      d3.select(this).style('stroke-width', 2);

      svg.selectAll("path").sort(function (a, b) {
        if (a.id != d.id) return -1;
        else return 1;
      });

      var voterCount = districtHash[this.id.split('_')[1]].Voters;

      d3.select("#districtLabel").text("District " + this.id.split('_')[1]);
      d3.select("#districtVoterCount").text(numberWithCommas(voterCount) + " voter" + (voterCount == 1 ? "" : "s") + " identified in this district");
      d3.select("#districtCouncilor").text(districtHash[this.id.split('_')[1]].Member + " (" + districtHash[this.id.split('_')[1]].Party + ")");
      d3.select("#districtNeighborhoods").text("Neighborhoods: " + districtHash[this.id.split('_')[1]].Neighborhoods);
      wrap("#districtNeighborhoods", 400);
    }

    var mouseout = function(d){
      // Remove highlight from hovered district and hide info
      d3.select(this).style('stroke', '#777');
      d3.select(this).style('stroke-width', 1);
      d3.select("#districtLabel").text("");
      d3.select("#districtVoterCount").text("");
      d3.select("#districtCouncilor").text("");
      d3.select("#districtNeighborhoods").text("");
    }

    var numberWithCommas = function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    var wrap = function(id, width) {
      var text = d3.select(id),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.2, // ems
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    }

    var reshadeDistrict = function(id, districtPopuplation, maxPopulation) {
      rgb = Math.round(254 * (1 - 0.75 * districtPopuplation / maxPopulation));
      shade = "rgb(" + rgb + ", " + rgb + ", " + rgb + ")";

      d3.select("#id_" + id)
        .attr("fill", shade);
    }

    // Draw New York City Council Districts
    svg.selectAll('path')
      .data(districts)
      .enter().append('path')
      .attr('id', function(d) { return "id_" + d.properties.CounDist; })
      .attr('d', path)
      .attr('fill', '#FFF')
      .attr('stroke', '#777')
      .attr('stroke-width', 1)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout)

    window.start = function() {
      // Abort existing process
      window.loader;
      clearInterval(window.loader);

      // Reset voter counts
      for (var key in districtHash) {
        districtHash[key].Voters = 0;
      }

      var geocodeVoters = function(voterData) {
        var geocodeVoter = function() {
          d3.select("#status1").text("Reverse geocoding voter " + numberWithCommas(i));
          d3.select("#status2").text("out of " + numberWithCommas(voterData.length));

          if (i < voterData.length) {
            var point = [voterData[i].longitude, voterData[i].latitude];

            // Iterate through each city council district until finding one that contains the voter's longitude & latitude coordinates
            for (var j = 0; j < districts.length; j++) {
              if ( d3.geoContains(districts[j], point) ) {
                districtHash[districts[j].properties.CounDist].Voters++;

                if (districtHash[districts[j].properties.CounDist].Voters > maxPopulation) {
                  maxPopulation = districtHash[districts[j].properties.CounDist].Voters

                  for (var k = 0; k < districts.length; k++) {
                    reshadeDistrict(districts[k].properties.CounDist, districtHash[districts[k].properties.CounDist].Voters, maxPopulation);
                  }
                } else {
                  reshadeDistrict(districts[j].properties.CounDist, districtHash[districts[j].properties.CounDist].Voters, maxPopulation);
                }
              }
            }

            i++;
          } else {
            clearInterval(loader);
            d3.select("#status1").text("Finished geocoding " + numberWithCommas(voterData.length));
            d3.select("#status2").text("voters");
          }
        }

        // Use a setInterval with a one-millisecond pause to prevent the application UI from being blocked while voters are geocoded
        var i = 0;
        window.maxPopulation = 0;
        window.loader = setInterval(geocodeVoter, 1);
      }

      if (typeof voterData === "undefined") {
        // Use sample data
        d3.csv("/data/nyc/dfa_members.csv").then(function(sampleVoterData) {
          geocodeVoters(sampleVoterData);
        });
      } else {
        geocodeVoters(voterData);
      }
    }

    d3.select("#startButton")
      .attr("style", "background-color: #FF8C00; border-color: #FF8C00;")
      .attr("onclick", "start(); return false;");
  });
});
