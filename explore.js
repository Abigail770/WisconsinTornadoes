// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 300 - margin.left - margin.right,
    height = 150 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y = d3.scaleLinear()
          .range([height, 0]);
          
/////////////Create D3 County graph/////////////////

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#county-graph").append("svg")
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
var files = ["wi_tornadoes.json", "tornadoes_by_county.geojson"];


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
      console.log(counties)

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
            $('#name').html("");
            $('#name').append(feature.properties.COUNTY_NAM);

            $('#num_tornadoes').html("");
            $('#num_tornadoes').append(feature.properties.Join_Count);

            $('#fat').html("");
            $('#fat').append(feature.properties.fat);

            $('#inj').html("");
            $('#inj').append(feature.properties.inj);
          })
        },
        style: {
          fillColor: 'blue',
          opacity: 0.7,
          color: 'black',
          fillOpacity: 0.3}
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

    }
}