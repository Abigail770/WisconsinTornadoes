function getColor(d) {
  return d == 5 ? '#800026' :
      d == 4  ? '#BD0026' :
      d == 3  ? '#E31A1C' :
      d == 2  ? '#FC4E2A' :
      d == 1   ? '#FD8D3C' :
      d == 0   ? '#FEB24C' :
                  '#FFEDA0';
}

function getStyle(feature) {
  return {
      color: getColor(feature.properties.mag),
      weight: 4,
  };
}

var promises = [];
var files = ["wi_tornadoes.json", "tornadoes_by_county.geojson", "1950_hex.geojson", "1960_hex.geojson", "1970_hex.geojson", "1980_hex.geojson", "1990_hex.geojson", "2000_hex.geojson", "2010_hex.geojson"];


window.onload = loadFiles()
window.onload = setMap()

// Load csv and geojson files
function loadFiles(){
    files.forEach(function(url) {
        if (url.includes("csv")){
            promises.push(d3.csv(url))
        }
        else{
            promises.push(d3.json(url))
        }
    });
}
function setMap(data){
    var map = L.map('map',{
      maxZoom: 18,
    }).setView([44.5, -86.8], 7);

    // Set map top == navbar height so the navbar will not hide the top of it
    $('#map').css('top', $('#navbar').outerHeight());
    $('#map').css('left', "20%");
    $('#map').css('right', "20%");
    // $('#map').css('bottom', $('#lowerbar').outerHeight());
    $('#sidebar').css('top', $('#navbar').outerHeight());
    $('#lowerbar').css('top', $('#navbar').outerHeight());

    var basemap = L.esri.basemapLayer('DarkGray').addTo(map);

    // Call read function when files are loaded
    Promise.all(promises).then(ready);
    function ready(data){

      var paths = data[0];
      var counties = data[1];
      var hex1950 = data[2];
      var hex1960 = data[3];
      var hex1970 = data[4];
      var hex1980 = data[5];
      var hex1990 = data[6];
      var hex2000 = data[7];
      var hex2010 = data[8];
      console.log(paths);
      var decades = [hex1950, hex1960, hex1970, hex1980, hex1990, hex2000, hex2010];

      var countyStyle = {
        fillColor: 'blue',
        opacity: 0.7,
        color: 'black',
        fillOpacity: 0.3};

      // setStateChart(decades);
      var tornadoPaths = L.geoJson(paths, {style: getStyle});

      // Invisible layer with buffer to make popups more user friendly
      var invisPaths = L.geoJson(paths, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'</p><p> Date : '+feature.properties.date+'</p>');
        },
        style: {opacity: 0, weight: 10}
      });

      var countyLayer = L.geoJson(counties, {
        onEachFeature: function (feature, layer) {
          $(layer).click(function(){
            countyLayer.setStyle(countyStyle);
            highlightFeature(layer);
            $('#name').html("");
            $('#name').append(feature.properties.COUNTY_NAM);

            $('#num_tornadoes').html("");
            $('#num_tornadoes').append(feature.properties.Join_Count);

            $('#fat').html("");
            $('#fat').append(feature.properties.fat);

            $('#inj').html("");
            $('#inj').append(feature.properties.inj);
            var yearList = getTornadoData(feature.properties.COUNTY_NAM, feature.geometry);
            setCountyChart(feature.properties.COUNTY_NAM, yearList);
          })
        },
        style: countyStyle
      })

      loadPaths();
      loadCounties();

      $('.tornado_paths_check').change(function(){
        loadPaths();
      });
      $('.county_bounds_check').change(function(){
        loadCounties();
      });

      function loadPaths(){
        if ($('#tornado_paths_check').prop('checked')){
          tornadoPaths.addTo(map);

          // Add invisible layer with buffer to make popups more user friendly
          invisPaths.addTo(map);
        }else{
          if (map.hasLayer(invisPaths)){
            map.removeLayer(tornadoPaths);
            map.removeLayer(invisPaths);
          }
        }
      }

      function loadCounties(){
        if ($('#county_bounds_check').prop('checked')){
          countyLayer.addTo(map);
          countyLayer.bringToBack();
        }
        else{
          if (map.hasLayer(countyLayer)){
            map.removeLayer(countyLayer);
          }
        }
      }
      function getTornadoData(countyName, countyGeom){
        var years = [];
        for (var i = 0; i < paths.features.length; i++){
          var line = paths.features[i].geometry;
          var date = paths.features[i].properties.date
          if (turf.booleanIntersects(line, countyGeom)){
            var year = date.split("-")[0];
            var decade;
            if (year.startsWith("19")){
              if (year[2] == "5"){
                decade = 1950;
              }
              if (year[2] == "6"){
                decade = 1960;
              }
              if (year[2] == "7"){
                decade = 1970;
              }
              if (year[2] == "8"){
                decade = 1980;
              }
              if (year[2] == "9"){
                decade = 1990;
              }
            }
            else if (year.startsWith("20")){
              if (year[2] == "0"){
                decade = 2000;
              }
              if (year[2] == "1"){
                decade = 2010;
              }
            }
            years.push(decade);
          }
        }
        counts = {};
        years.forEach(function(num) { 
          counts[num] = (counts[num] || 0) + 1; 
        });
        console.log(counts)
        return counts;
      }

    }
}

function highlightFeature(feature){
  feature.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });
  feature.bringToFront();
}

function setCountyChart(countyName, yearList){
  $("#county-graph").html("");
  /////////////Create D3 County graph/////////////////
  var decades = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"]
  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
  width = 300 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

  finalList = [];

  for (var [key, value] of Object.entries(yearList)) {
    finalList.push({"decade": key, "count": value})
  }

  finalList.forEach(function(d) {
    d.decade = d.decade;
    d.count = +d.count;
  });

  var maxCount = d3.max(finalList, function(d) { return d.count; })
  console.log(maxCount);
  // set the ranges
  var x = d3.scaleBand()
        .range([0, width])
        .domain(decades.map(function(d) { return d; }))
        .padding(0.1);
  var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, maxCount]);

  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("#county-graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")");

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
    .data(finalList)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.decade); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.count); })
    .attr("height", function(d) { return height - y(d.count); });

  // add the x Axis
  svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
  .call(d3.axisLeft(y)
  .ticks(maxCount)
  .tickFormat(d3.format("d")));
}

//function to create coordinated bar chart
function setStateChart(decades){

    // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
  width = 300 - margin.left - margin.right,
  height = 150 - margin.top - margin.bottom;

  // set the ranges
  var x = d3.scaleBand()
        .range([0, width])
        .domain([0, 100])
        .padding(0.1);
  var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 100]);

  /////////////Create D3 State graph/////////////////
        
  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("#state-graph").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")");

  // add the x Axis
  svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
  .call(d3.axisLeft(y));
  // //chart frame dimensions
  // var chartWidth = window.innerWidth * 0.425,
  //     chartHeight = 473,
  //     leftPadding = 25,
  //     rightPadding = 2,
  //     topBottomPadding = 5,
  //     chartInnerWidth = chartWidth - leftPadding - rightPadding,
  //     chartInnerHeight = chartHeight - topBottomPadding * 2,
  //     translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  // //create a second svg element to hold the bar chart
  // var chart = d3.select("body")
  //     .append("svg")
  //     .attr("width", chartWidth)
  //     .attr("height", chartHeight)
  //     .attr("class", "chart");

  //create a rectangle for chart background fill
  // var chartBackground = chart.append("rect")
  //     .attr("class", "chartBackground")
  //     .attr("width", chartInnerWidth)
  //     .attr("height", chartInnerHeight)
  //     .attr("transform", translate);

  // //create a scale to size bars proportionally to frame and for axis
  // var yScale = d3.scaleLinear()
  //     .range([463, 0])
  //     .domain([0, 100]);
  //set bars for each decade
  var bars = svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      // .sort(function(a, b){
      //     return b[expressed]-a[expressed]
      // })
      .attr("class", function(d){
          return "bar " + d.adm1_code;
      })
      .attr("width", chartInnerWidth / counties.length - 1)
  
  // var desc = bars.append("desc")
  //     .text('{"stroke": "none", "stroke-width": "0px"}');

  // //create a text element for the chart title
  // var chartTitle = chart.append("text")
  //     .attr("x", 40)
  //     .attr("y", 40)
  //     .attr("class", "chartTitle")
  //     .text(expressed);

  // //create vertical axis generator
  // var yAxis = d3.axisLeft(yScale)
  //     .scale(yScale);

  // //place axis
  // var axis = chart.append("g")
  //     .attr("class", "axis")
  //     .attr("transform", translate)
  //     .call(yAxis);

  // //create frame for chart border
  // var chartFrame = chart.append("rect")
  //     .attr("class", "chartFrame")
  //     .attr("width", chartInnerWidth)
  //     .attr("height", chartInnerHeight)
  //     .attr("transform", translate);
  
  // //set bar positions, heights, and colors
  // updateChart(bars, csvData.length, colorScale);
};
