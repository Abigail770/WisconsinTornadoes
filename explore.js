function getColor(d) {
  return d == 5 ? '#800026' :
      d == 4  ? '#BD0026' :
      d == 3  ? '#E31A1C' :
      d == 2  ? '#FC4E2A' :
      d == 1   ? '#FD8D3C' :
      d == 0   ? '#FEB24C' :
                  '#FEB24C';
}

function getStyle(feature) {
  return {
      color: getColor(feature.properties.mag),
      weight: 4,
  };
}

var promises = [];
var files = ["wi_tornadoes.json", "tornadoes_by_county.geojson", "1950_hex.geojson", "1960_hex.geojson", "1970_hex.geojson", "1980_hex.geojson", "1990_hex.geojson", "2000_hex.geojson", "2010_hex.geojson", "wi_tornadoes_co.geojson"];
var legend = "";

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
      zoomControl: false,
    }).setView([44.5, -86.8], 7);

    // Add Leaflet zoom home control
    var zoomHome = L.Control.zoomHome();
    zoomHome.addTo(map);

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
      var pathsWithCo = data[9];
      var decades = [hex1950, hex1960, hex1970, hex1980, hex1990, hex2000, hex2010];

      setStateChart(paths);

      var countyStyle = {
        fillColor: '#000080',
        weight: 1,
        opacity: 0.7,
        color: 'white',
        fillOpacity: 0.3};

      // setStateChart(decades);
      var tornadoPaths = L.geoJson(paths, {style: getStyle});

      // Invisible layer with buffer to make popups more user friendly
      var invisPaths = L.geoJson(paths, {
        onEachFeature: function (feature, layer) {
          $(layer).click(function(){
            invisPaths.setStyle({opacity: 0, weight: 10});
            highlightPath(layer);
          });
          layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'</p><p> Date : '+feature.properties.date+'</p>');
        },
        style: {opacity: 0, weight: 10}
      });

      var countyLayer = L.geoJson(counties, {
        onEachFeature: function (feature, layer) {
          $(layer).click(function(){
            countyLayer.setStyle(countyStyle);
            countyLayer.bringToBack();
            highlightFeature(layer);
            $('#name').html("");
            $('#name').append(feature.properties.COUNTY_NAM);

            $('#num_tornadoes').html("");
            $('#num_tornadoes').append(feature.properties.Join_Count);

            $('#fat').html("");
            $('#fat').append(feature.properties.fat);

            $('#inj').html("");
            $('#inj').append(feature.properties.inj);
            // var intersect = spatialJoin(feature.geometry);
            // console.log(intersect);
            var yearList = getTornadoData(feature.properties.COUNTY_NAM, feature.geometry);
            setCountyChart(feature.properties.COUNTY_NAM, yearList);
          })
        },
        style: countyStyle
      })

      loadPaths();
      loadCounties();
      populateCountyDropdown();
      populateDecadeDropdown();
      populateMonthDropdown();

      $('.tornado_paths_check').change(function(){
        loadPaths();
      });
      $('.county_bounds_check').change(function(){
        loadCounties();
      });

      $('#clear').click(function(){
        $("#dropdowns > select").each(function() { 
          this.selectedIndex = 0
        });

        map.eachLayer(function (layer) {
          map.removeLayer(layer);
        });

        basemap.addTo(map);

        if ($('#tornado_paths_check').prop('checked')){
          tornadoPaths.addTo(map);
          if (legend == undefined){
            addLegend();
          }
          invisPaths.addTo(map);
        }

        if ($('#county_bounds_check').prop('checked')){
          countyLayer.addTo(map);
          countyLayer.bringToBack();
        }

      })

      function populateCountyDropdown(){
        var countyFeat = counties.features
        countyFeat.forEach(function(feature){
          option = document.createElement("option")
          option.setAttribute("value", feature.properties.COUNTY_NAM)
          option.textContent = feature.properties.COUNTY_NAM
          document.getElementById("countyDrop").appendChild(option);
        });
      }

      function populateDecadeDropdown(){
        var pathFeat = paths.features
        var pathList = [];
        pathFeat.forEach(function(feature){
          var date = feature.properties.date;
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
            pathList.push(decade);
        });

        let uniquedecades = [...new Set(pathList)];
        uniquedecades.forEach(function(feature){
          option = document.createElement("option")
          option.setAttribute("value", feature)
          option.textContent = feature
          document.getElementById("decadeDrop").appendChild(option);
        });
      }

      function populateMonthDropdown(){
        var monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        monthLabels.forEach(function(feature){
          option = document.createElement("option")
          option.setAttribute("value", feature)
          option.textContent = feature
          document.getElementById("monthDrop").appendChild(option);
        });
      }

      var newpaths;
      var newinvispaths;
      // when select option from downdown menu, change bounding box of map to geometry of the selected feature
      document.getElementById('countyDrop').addEventListener("change", function (e) {
        var input = e.currentTarget.selectedOptions[0].attributes[0].value;
        if (map.hasLayer(monthPaths)){
          map.removeLayer(monthPaths)
          map.removeLayer(invismonthPaths)
        }

        if (map.hasLayer(newpaths)){
          map.removeLayer(newpaths)
          map.removeLayer(newinvispaths)
        }

        if (map.hasLayer(decadePaths)){
          map.removeLayer(decadePaths)
          map.removeLayer(invisDecadePaths)
        }

        if (map.hasLayer(invisPaths)){
          map.removeLayer(tornadoPaths);
          map.removeLayer(invisPaths);
        }
        var lines = [];

        turf.featureEach(counties, function (currentFeatures, featureIndex) {
          if (currentFeatures.properties.COUNTY_NAM == input){
            for (var i = 0; i < paths.features.length; i++){
              var line = paths.features[i].geometry;
        
              if (turf.booleanIntersects(line, currentFeatures.geometry)){
                lines.push(paths.features[i]);
              }
            }
          }
        });

        // Create layer for county paths
        newpaths = L.geoJson(lines, {
          style: getStyle
        }).addTo(map);

        // Invisible buffer layer
        newinvispaths = L.geoJson(lines, {
          onEachFeature: function (feature, layer) {
            $(layer).click(function(){
              newinvispaths.setStyle({opacity: 0, weight: 10});
              highlightPath(layer);
            });
            layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'</p><p> Date : '+feature.properties.date+'</p>');
          },
          style: {opacity: 0, weight: 10}
        }).addTo(map);

        // map.fitBounds(newpaths.getBounds());
      });

      var decadePaths;
      var invisDecadePaths;
      // when select option from downdown menu, change bounding box of map to geometry of the selected feature
      document.getElementById('decadeDrop').addEventListener("change", function (e) {
        
        var input = e.currentTarget.selectedOptions[0].attributes[0].value;
        if (map.hasLayer(monthPaths)){
          map.removeLayer(monthPaths)
          map.removeLayer(invismonthPaths)
        }

        if (map.hasLayer(newpaths)){
          map.removeLayer(newpaths)
          map.removeLayer(newinvispaths)
        }

        if (map.hasLayer(decadePaths)){
          map.removeLayer(decadePaths)
          map.removeLayer(invisDecadePaths)
        }

        if (map.hasLayer(invisPaths)){
          map.removeLayer(tornadoPaths);
          map.removeLayer(invisPaths);
        }
        var lines = [];
        console.log(input)
        turf.featureEach(pathsWithCo, function (currentFeatures, featureIndex) {
          if (currentFeatures.properties.decade == input){
              lines.push(currentFeatures)
          }
        });

        // Create layer for decade paths
        decadePaths = L.geoJson(lines, {
          style: getStyle
        }).addTo(map);

        // Invisible buffer layer
        invisDecadePaths = L.geoJson(lines, {
          onEachFeature: function (feature, layer) {
            $(layer).click(function(){
              invisDecadePaths.setStyle({opacity: 0, weight: 10});
              highlightPath(layer);
            });
            layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'</p><p> Date : '+feature.properties.date+'</p>');
          },
          style: {opacity: 0, weight: 10}
        }).addTo(map);
    
      });

      var monthPaths;
      var invismonthPaths;
      // when select option from downdown menu, change bounding box of map to geometry of the selected feature
      document.getElementById('monthDrop').addEventListener("change", function (e) {
        var input = e.currentTarget.selectedOptions[0].attributes[0].value;

        if (map.hasLayer(newpaths)){
          map.removeLayer(newpaths)
          map.removeLayer(newinvispaths)
        }

        if (map.hasLayer(monthPaths)){
          map.removeLayer(monthPaths)
          map.removeLayer(invismonthPaths)
        }

        if (map.hasLayer(invisPaths)){
          map.removeLayer(tornadoPaths);
          map.removeLayer(invisPaths);
        }

        if (map.hasLayer(decadePaths)){
          map.removeLayer(decadePaths)
          map.removeLayer(invisDecadePaths)
        }

        var lines = [];
        turf.featureEach(pathsWithCo, function (currentFeatures, featureIndex) {
          var feature = currentFeatures.properties.mo;
          var selection;
          if (feature == 1){
            selection = "January";
          }else if (feature == 3){
            selection = "March";
          }else if (feature == 4){
            selection = "April";
          }else if (feature == 5){
            selection = "May";
          }else if (feature == 6){
            selection = "June";
          }else if (feature == 7){
            selection = "July";
          }else if (feature == 8){
            selection = "August";
          }else if (feature == 9){
            selection = "September";
          }else if (feature == 10){
            selection = "October";
          }else if (feature == 11){
            selection = "November";
          }else if (feature == 12){
            selection = "December";
          }
          if (selection == input){
              lines.push(currentFeatures)
          }
        });
        
        // Create layer for decade paths
        monthPaths = L.geoJson(lines, {
          style: getStyle
        }).addTo(map);

        // Invisible buffer layer
        invismonthPaths = L.geoJson(lines, {
          onEachFeature: function (feature, layer) {
            $(layer).click(function(){
              invismonthPaths.setStyle({opacity: 0, weight: 10});
              highlightPath(layer);
            });
            layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'</p><p> Date : '+feature.properties.date+'</p>');
          },
          style: {opacity: 0, weight: 10}
        }).addTo(map);
    
      });

      function loadPaths(){
        if ($('#tornado_paths_check').prop('checked')){
          tornadoPaths.addTo(map);
          addLegend();

          // Add invisible layer with buffer to make popups more user friendly
          invisPaths.addTo(map);
        }else{
          if (legend != ""){
            legend.remove();
          }
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

      // function spatialJoin(countyGeom){
      //   var joined = paths.features.filter(function (feature) {
      //     return turf.booleanIntersects(feature, countyGeom);
      //   });
      //   return joined;
      // }
      
      function addLegend(){
        legend = L.control({position: 'bottomleft'});

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend')
            var grades = [];
            grades = [0, 1, 2, 3, 4, 5];
            // generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                    grades[i] + ' EF <br>';
            }
            // var labels = [];

            return div;
        };

        legend.addTo(map);
    }

      function getTornadoData(countyName, countyGeom){
        var pathList = [];
        for (var i = 0; i < pathsWithCo.features.length; i++){
          var name = pathsWithCo.features[i].properties.COUNTY_NAM;
          var decade = pathsWithCo.features[i].properties.decade;
          if (name == countyName){
            pathList.push(decade)
          }
        }
        counts = {};
        pathList.forEach(function(num) { 
          counts[num] = (counts[num] || 0) + 1; 
        });
        return counts;

      //   var years = [];
      //   for (var i = 0; i < paths.features.length; i++){
      //     var line = paths.features[i].geometry;
      //     var date = paths.features[i].properties.date
      //     if (turf.booleanIntersects(line, countyGeom)){
      //       var year = date.split("-")[0];
      //       var decade;
      //       if (year.startsWith("19")){
      //         if (year[2] == "5"){
      //           decade = 1950;
      //         }
      //         if (year[2] == "6"){
      //           decade = 1960;
      //         }
      //         if (year[2] == "7"){
      //           decade = 1970;
      //         }
      //         if (year[2] == "8"){
      //           decade = 1980;
      //         }
      //         if (year[2] == "9"){
      //           decade = 1990;
      //         }
      //       }
      //       else if (year.startsWith("20")){
      //         if (year[2] == "0"){
      //           decade = 2000;
      //         }
      //         if (year[2] == "1"){
      //           decade = 2010;
      //         }
      //       }
      //       years.push(decade);
      //     }
      //   }
      //   counts = {};
      //   years.forEach(function(num) { 
      //     counts[num] = (counts[num] || 0) + 1; 
      //   });
      //   return counts;
       }

    }
}


function highlightFeature(feature){
  feature.setStyle({
    weight: 6,
    // color: '#666',
    dashArray: '',
    // fillOpacity: 0.7
  });
}


function highlightPath(feature){
  feature.setStyle({
    weight: 6,
    opacity: 0.7,
    color: '#FFF',
  });
  feature.bringToFront();
}

function setCountyChart(countyName, yearList){
  $("#county-graph").html(countyName);
  /////////////Create D3 County graph/////////////////
  var decades = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"]
  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 40, left: 40},
  width = 280 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

  var finalList = [];

  for (var [key, value] of Object.entries(yearList)) {
    finalList.push({"decade": key, "count": value})
  }

  finalList.forEach(function(d) {
    d.decade = d.decade;
    d.count = +d.count;
  });

  var maxCount = d3.max(finalList, function(d) { return d.count; })

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

  // Add x axis label
  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width/2)
    .attr("y", height + margin.bottom)
    .text("Decade");

  // Add y axis label
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -margin.left)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Number of Tornadoes");
}

//function to create coordinated bar chart
function setStateChart(paths){

  var decade1 = 0;
  var decade2 = 0;
  var decade3 = 0;
  var decade4 = 0;
  var decade5 = 0;
  var decade6 = 0;
  var decade7 = 0;

  turf.propEach(paths, function (currentProperties, featureIndex) {
    var year = currentProperties.yr.toString();
    if (year[1] == "9"){
      if (year[2] == "5"){
        decade1 ++
      }
      if (year[2] == "6"){
        decade2++
      }
      if (year[2] == "7"){
        decade3++;
      }
      if (year[2] == "8"){
        decade4++;
      }
      if (year[2] == "9"){
        decade5++;
      }
    }
    else {
      if (year[2] == "0"){
        decade6++;
      }
      if (year[2] == "1"){
        decade7++;
      }
    }
  });

  var decadeList = [{"decade": 1950, "count": decade1}, {"decade": 1960, "count": decade2}, {"decade": 1970, "count": decade3}, {"decade": 1980, "count": decade4}, {"decade": 1990, "count": decade5}, {"decade": 2000, "count": decade6}, {"decade": 2010, "count": decade7}];

  var decades = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"]

  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 40, left: 45},
  width = 280 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

  var maxCount = d3.max(decadeList, function(d) { return d.count; })

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
  var svg = d3.select("#state-graph").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")");

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
  .data(decadeList)
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
  .call(d3.axisLeft(y))
  // .ticks(maxCount)
  // .tickFormat(d3.format("d")));

  // Add x axis label
  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width/2)
    .attr("y", height + margin.bottom)
    .text("Decade");

  // Add y axis label
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -margin.left)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Number of Tornadoes");
};
