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
var files = ["wi_tornadoes.json", "tornadoes_by_county.geojson", "join_1950.json", "join_1960.json", "join_1970.json", "join_1980.json", "join_1990.json", "join_2000.json", "join_2010.json", "wi_tornadoes_co.geojson"];
var legend = "";
var filterInfo = "";
var mobileContent = "";
var map;
var mediaQuery = window.matchMedia( "(max-width: 1068px)" );
var numMobile = 0;

var monthFilter = false;
var decadeFilter = false;
var countyFilter = false;

window.onload = loadFiles()
window.onload = setMap()
$(window).resize(function(){location.reload();});
// $(window).resize(setMap);

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

function setMap(){
    if (map){
      map.off();
      map.remove();
    }

    if (mediaQuery.matches){
      map = L.map('map',{
        maxZoom: 18,
        zoom: 6,
        center: [43.7, -89.6],
        zoomControl: false,
      });
    }else{
      map = L.map('map',{
        maxZoom: 18,
        zoom: 7,
        center: [44.5, -86.8],
        zoomControl: false,
      });
    }

    // Add Leaflet zoom home control
    var zoomHome = L.Control.zoomHome();
    zoomHome.addTo(map);

    // Set map top == navbar height so the navbar will not hide the top of it
    $('#map').css('top', $('#navbar').outerHeight());

    // $('#map').css('left', "20%");
    // $('#map').css('right', "20%");
    // // $('#map').css('bottom', $('#lowerbar').outerHeight());
    // $('#sidebar').css('top', $('#navbar').outerHeight());
    // $('#lowerbar').css('top', $('#navbar').outerHeight());
    // // Set map top == navbar height so the navbar will not hide the top of it
    // $('#map').css('top', $('#navbar').outerHeight());

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

      $("#county-graph").html("Select a county to populate the graph");

      if ($("#mobile-button")){
        $("#mobile-button").remove();
      }
      if (mediaQuery.matches) {
        $('#map').css('left', "0");
        $('#map').css('right', "0");
        mobileContent = L.control({position: 'bottomright'});
        mobileContent.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'mobile-button');
          this._div.innerHTML = '<button id="mobile-graphs" type="button" class="btn btn-primary" data-toggle="button" aria-pressed="false" autocomplete="off"><i class="fas fa-filter"></i></button>';
          L.DomEvent
              .addListener(this._div, 'click', L.DomEvent.stopPropagation)
              .addListener(this._div, 'click', L.DomEvent.preventDefault)
              .addListener(this._div, 'click', function () { getMobileContent(); });
          return this._div;
        };
        mobileContent.addTo(map);
        // $('#sidebar').css('top', $('#navbar').outerHeight() + $('#dropdowns-mobile').height())
      }
      else{
        setStateChart(paths);
        $('#mobile-content').css('display', 'none');
        $('#map').css('left', "20%");
        $('#map').css('right', "20%");
        $('#sidebar').css('top', $('#navbar').outerHeight());
        $('#lowerbar').css('top', $('#navbar').outerHeight());
        if (mobileContent != ""){
          mobileContent.remove();
        }
      }
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
          layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'<br> Date : '+feature.properties.date+'<br> Fatalities: '+feature.properties.fat+'<br> Injuries: '+feature.properties.inj+'</p>');
        },
        style: {opacity: 0, weight: 10}
      });

      var countyLayer = L.geoJson(counties, {
        onEachFeature: function (feature, layer) {
          $(layer).click(function(){
            $("#county-info-text").css("display", "none");
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
            var yearList = getTornadoData(feature.properties.COUNTY_NAM);
            setCountyChart(feature.properties.COUNTY_NAM, yearList);
          })
        },
        style: countyStyle
      })

      function getMobileContent(){
        numMobile ++;
        $("#mobile-content").css('display', 'block');
        $('#mobile-content').css('top', $('#navbar').outerHeight());
        if (numMobile == 1){
          populateCountyDropdown(true);
          populateDecadeDropdown(true);
          populateMonthDropdown(true);
        }
        $('#mobile-content').append($('#sidebar'));
        $('#sidebar').css('display', 'block');
        $('#sidebar').css('top', $('#dropdowns-mobile').outerHeight());
      }

      loadPaths();
      loadCounties();
      populateCountyDropdown(false);
      populateDecadeDropdown(false);
      populateMonthDropdown(false);
      // populateSevDropdown();

      document.querySelector('.tornado_paths_check').addEventListener('change', function(){
        loadPaths();

        if (map.hasLayer(countyLayer)){
          countyLayer.setStyle(countyStyle);
          countyLayer.bringToBack();
        }
      });
      $('.county_bounds_check').change(function(){
        loadCounties();
      });

      function clearFilters(){
        $('#name').html("");
        $('#num_tornadoes').html("");
        $('#fat').html("");
        $('#inj').html("");
        $('#county-info-text').css('display', 'block');

        $("#dropdowns > select").each(function() { 
          this.selectedIndex = 0
        });

        $("#dropdowns-mobile > select").each(function() { 
          this.selectedIndex = 0
        });

        //Filter info
        if (filterInfo != ""){
          filterInfo.remove();
        }

        decadeFilter = false;
        monthFilter = false;
        countyFilter = false;

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
      }
      $("#clear-mobile").click(clearFilters)
      $('#clear').click(clearFilters)

      function populateCountyDropdown(isMobile){
        var countyFeat = counties.features
        var countyList = [];
        countyFeat.forEach(function(feature){
          countyList.push(feature.properties.COUNTY_NAM);
        });
        countyList.sort();
        countyList.forEach(function(feature){
          option = document.createElement("option")
          option.setAttribute("value", feature)
          option.textContent = feature
          if (isMobile){
            document.getElementById("countyMobileDrop").appendChild(option);
          }else{
            document.getElementById("countyDrop").appendChild(option);
          }
        });
      }

      function populateDecadeDropdown(isMobile){
        var pathList = [];
        for (var i = 0; i < pathsWithCo.features.length; i++){
          var decade = pathsWithCo.features[i].properties.decade;
            pathList.push(decade)
        }

        let uniquedecades = [...new Set(pathList)];
        uniquedecades.forEach(function(feature){
          option = document.createElement("option")
          option.setAttribute("value", feature)
          option.textContent = feature
          if (isMobile){
            document.getElementById("decadeMobileDrop").appendChild(option);
          }else{
            document.getElementById("decadeDrop").appendChild(option);
          }
        });
      }

      function populateMonthDropdown(isMobile){
        var monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        monthLabels.forEach(function(feature){
          option = document.createElement("option")
          option.setAttribute("value", feature)
          option.textContent = feature
          if (isMobile){
            document.getElementById("monthMobileDrop").appendChild(option);
          }else{
            document.getElementById("monthDrop").appendChild(option);
          }
        });
      }

      // function populateSevDropdown(){
      //   var sevLabels = [0, 1, 2, 3, 4, 5];

      //   sevLabels.forEach(function(feature){
      //     option = document.createElement("option")
      //     option.setAttribute("value", feature)
      //     option.textContent = feature
      //     document.getElementById("severityDrop").appendChild(option);
      //   });
      // }

      var fatalityList = [];
      var injList = [];
      var fatalityCount = 0;
      var injCount = 0;

      var decadeLines = [];
      var monthLines = [];
      var countyLines = [];

      var newpaths;
      var newinvispaths;
      var countyInput;
      var decadeInput;
      var monthInput;

      function countyDrop(e){
        $("#county-info-text").css("display", "none");
        fatalityCount = 0;
        injcount = 0;
        countyFilter = true;
        countyLines=[];
        countyInput = e.currentTarget.selectedOptions[0].attributes[0].value;

        var yearList = getTornadoData(countyInput);
        setCountyChart(countyInput, yearList);

        $('#name').html("");
        $('#name').append(countyInput);

        if (map.hasLayer(countyLayer)){
          countyLayer.setStyle(countyStyle);
          countyLayer.bringToBack();
        }

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

        turf.featureEach(counties, function (currentFeatures, featureIndex) {
          if (currentFeatures.properties.COUNTY_NAM == countyInput){
            if (monthFilter == true && decadeFilter == true){
              for (var i = 0; i < pathsWithCo.features.length; i++){
                var line = pathsWithCo.features[i].geometry;
                if (pathsWithCo.features[i].properties.mo == monthInput && pathsWithCo.features[i].properties.decade == decadeInput){
                  if (turf.booleanIntersects(line, currentFeatures.geometry)){
                    countyLines.push(pathsWithCo.features[i]);
                    fatalityCount += pathsWithCo.features[i].properties.fat;
                    injCount += pathsWithCo.features[i].properties.inj;
                  }
                }
              }
            }
            else if (monthFilter == true && decadeFilter == false){
              for (var i = 0; i < pathsWithCo.features.length; i++){
                var line = pathsWithCo.features[i].geometry;
                if (pathsWithCo.features[i].properties.mo == monthInput){
                  if (turf.booleanIntersects(line, currentFeatures.geometry)){
                    countyLines.push(pathsWithCo.features[i]);
                    fatalityCount += pathsWithCo.features[i].properties.fat;
                    injCount += pathsWithCo.features[i].properties.inj;
                  }
                }
              }
            }
            else if (decadeFilter == true && monthFilter == false){
                for (var i = 0; i < pathsWithCo.features.length; i++){
                  var line = pathsWithCo.features[i].geometry;
                  if (pathsWithCo.features[i].properties.decade == decadeInput){
                    if (turf.booleanIntersects(line, currentFeatures.geometry)){
                      countyLines.push(pathsWithCo.features[i]);
                      fatalityCount += pathsWithCo.features[i].properties.fat;
                      injCount += pathsWithCo.features[i].properties.inj;
                    }
                  }
                }
            }
            else{
              $('#fat').html("");
              $('#fat').append(currentFeatures.properties.fat);

              $('#inj').html("");
              $('#inj').append(currentFeatures.properties.inj);
              for (var i = 0; i < paths.features.length; i++){
                var line = paths.features[i].geometry;
          
                if (turf.booleanIntersects(line, currentFeatures.geometry)){
                  countyLines.push(paths.features[i]);
                }
              }
            }
          }
        });

        //Filter info control
        if (filterInfo != ""){
          filterInfo.remove();
        }

        filterInfo = L.control({position: 'topright'});
        filterInfo.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'filterInfo');
          if (countyLines.length == 0){
            this._div.innerHTML = "No paths returned from filter";
          }else{
            this._div.innerHTML = countyLines.length + " paths returned from filter";
          }
          return this._div;
        };
        filterInfo.addTo(map);

        $('#num_tornadoes').html("");
        $('#num_tornadoes').append(countyLines.length);

        $('#fat').html("");
        $('#fat').append(fatalityCount);

        $('#inj').html("");
        $('#inj').append(injCount);

        // Create layer for county paths
        newpaths = L.geoJson(countyLines, {
          style: getStyle
        }).addTo(map);

        // Invisible buffer layer
        newinvispaths = L.geoJson(countyLines, {
          onEachFeature: function (feature, layer) {
            $(layer).click(function(){
              newinvispaths.setStyle({opacity: 0, weight: 10});
              highlightPath(layer);
            });
            layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'<br> Date : '+feature.properties.date+'<br> Fatalities: '+feature.properties.fat+'<br> Injuries: '+feature.properties.inj+'</p>');
          },
          style: {opacity: 0, weight: 10}
        }).addTo(map);
      }
      // when select option from downdown menu, change bounding box of map to geometry of the selected feature
      document.getElementById('countyDrop').addEventListener("change", function(e){
        countyDrop(e)
      });

      document.getElementById('countyMobileDrop').addEventListener("change", function(e){
        countyDrop(e)
      });

      var decadePaths;
      var invisDecadePaths;

      function decadeDrop(e){
        $("#county-info-text").css("display", "none");
        fatalityCount = 0;
        injCount = 0;
        decadeFilter = true;
        decadeLines = [];
        decadeInput = e.currentTarget.selectedOptions[0].attributes[0].value;

        if (countyFilter == true){
          $('#name').html("");
          $('#name').append(countyInput);
        }else{
          $('#name').html("");
          $('#name').append("No county selected");
        }

        if (map.hasLayer(countyLayer)){
          countyLayer.setStyle(countyStyle);
          countyLayer.bringToBack();
        }

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

        turf.featureEach(pathsWithCo, function (currentFeatures, featureIndex) {
          if (monthFilter == true && countyFilter == true){
              if (currentFeatures.properties.mo == monthInput && currentFeatures.properties.decade == decadeInput && currentFeatures.properties.COUNTY_NAM == countyInput){
                decadeLines.push(currentFeatures);
                fatalityCount += currentFeatures.properties.fat;
                injCount += currentFeatures.properties.inj;
              }
          }
          else if (monthFilter == true && countyFilter == false){
            if (currentFeatures.properties.decade == decadeInput && currentFeatures.properties.mo == monthInput){
              decadeLines.push(currentFeatures);
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
            }
          }
          else if (countyFilter == true && monthFilter == false){
            if (currentFeatures.properties.decade == decadeInput && currentFeatures.properties.COUNTY_NAM == countyInput){
              decadeLines.push(currentFeatures);
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
            }
          }
          else{
            if (currentFeatures.properties.decade == decadeInput){
              decadeLines.push(currentFeatures);
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
            }
          }
        });

        if (filterInfo != ""){
          filterInfo.remove();
        }
        //Filter info control
        filterInfo = L.control({position: 'topright'});
        filterInfo.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'filterInfo');
          if (decadeLines.length == 0){
            this._div.innerHTML = "No paths returned from filter";
          }else{
            this._div.innerHTML = decadeLines.length + " paths returned from filter";
          }
          return this._div;
        };
        filterInfo.addTo(map);

        $('#num_tornadoes').html("");
        $('#num_tornadoes').append(decadeLines.length);

        // fatalityList.forEach(function(line){
        //   fatalityCount += line;
        // });
        // injList.forEach(function(line){
        //   injCount += line;
        // });

        $('#fat').html("");
        $('#fat').append(fatalityCount);

        $('#inj').html("");
        $('#inj').append(injCount);

        // Create layer for decade paths
        decadePaths = L.geoJson(decadeLines, {
          style: getStyle
        }).addTo(map);

        // Invisible buffer layer
        invisDecadePaths = L.geoJson(decadeLines, {
          onEachFeature: function (feature, layer) {
            $(layer).click(function(){
              invisDecadePaths.setStyle({opacity: 0, weight: 10});
              highlightPath(layer);
            });
            layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'<br> Date : '+feature.properties.date+'<br> Fatalities: '+feature.properties.fat+'<br> Injuries: '+feature.properties.inj+'</p>');
          },
          style: {opacity: 0, weight: 10}
        }).addTo(map);
      }
      // when select option from downdown menu, change bounding box of map to geometry of the selected feature
      document.getElementById('decadeDrop').addEventListener("change", function (e) {
        decadeDrop(e);
      });

      document.getElementById('decadeMobileDrop').addEventListener("change", function (e) {
        decadeDrop(e);
      });

      var monthPaths;
      var invismonthPaths;

      function monthDrop(e){
        $("#county-info-text").css("display", "none");
        fatalityCount = 0;
        injCount = 0;
        monthFilter = true;
        monthLines = [];
        monthInput = e.currentTarget.selectedOptions[0].attributes[0].value;

        if (countyFilter == true){
          $('#name').html("");
          $('#name').append(countyInput);
        }else{
          $('#name').html("");
          $('#name').append("No county selected");
        }

        if (map.hasLayer(countyLayer)){
          countyLayer.setStyle(countyStyle);
          countyLayer.bringToBack();
        }

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

        turf.featureEach(pathsWithCo, function (currentFeatures, featureIndex) {
          var feature = currentFeatures.properties.mo;
          if (monthInput == "January"){
            monthInput = 1;
          }else if (monthInput == "February"){
            monthInput = 2;
          }else if (monthInput == "March"){
            monthInput = 3;
          }else if (monthInput == "April"){
            monthInput = 4;
          }else if (monthInput == "May"){
            monthInput = 5;
          }else if (monthInput == "June"){
            monthInput = 6;
          }else if (monthInput == "July"){
            monthInput = 7;
          }else if (monthInput == "August"){
            monthInput = 8;
          }else if (monthInput == "September"){
            monthInput = 9;
          }else if (monthInput == "October"){
            monthInput = 10;
          }else if (monthInput == "November"){
            monthInput = 11;
          }else if (monthInput == "December"){
            monthInput = 12;
          }
          if (decadeFilter == true && countyFilter == true){
            if (feature == monthInput && currentFeatures.properties.decade == decadeInput && currentFeatures.properties.COUNTY_NAM == countyInput){
              monthLines.push(currentFeatures)
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
            }
          }
          else if (decadeFilter == true && countyFilter == false){
            if (feature == monthInput && currentFeatures.properties.decade == decadeInput){
              monthLines.push(currentFeatures);
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
            }
          }
          else if (countyFilter == true && decadeFilter == false){
            if (feature == monthInput && currentFeatures.properties.COUNTY_NAM == countyInput){
              monthLines.push(currentFeatures);
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
            }
          }
          else{
            if (feature == monthInput){
              monthLines.push(currentFeatures);
              fatalityCount += currentFeatures.properties.fat;
              injCount += currentFeatures.properties.inj;
          }
          }
        });

        //Filter info control
        if (filterInfo != ""){
          filterInfo.remove();
        }

        filterInfo = L.control({position: 'topright'});
        filterInfo.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'filterInfo');
          if (monthLines.length == 0){
            this._div.innerHTML = "No paths returned from filter";
          }else{
            this._div.innerHTML = monthLines.length + " paths returned from filter";
          }
          return this._div;
        };
        filterInfo.addTo(map);

        // Create layer for month paths
        monthPaths = L.geoJson(monthLines, {
          style: getStyle
        }).addTo(map);

        $('#num_tornadoes').html("");
        $('#num_tornadoes').append(monthLines.length);

        $('#fat').html("");
        $('#fat').append(fatalityCount);

        $('#inj').html("");
        $('#inj').append(injCount);

        // Invisible buffer layer
        invismonthPaths = L.geoJson(monthLines, {
          onEachFeature: function (feature, layer) {
            $(layer).click(function(){
              invismonthPaths.setStyle({opacity: 0, weight: 10});
              highlightPath(layer);
            });
            layer.bindPopup('<p> Magnitude: '+feature.properties.mag+'<br> Date : '+feature.properties.date+'<br> Fatalities: '+feature.properties.fat+'<br> Injuries: '+feature.properties.inj+'</p>');
          },
          style: {opacity: 0, weight: 10}
        }).addTo(map);
      }
      // when select option from downdown menu, change bounding box of map to geometry of the selected feature
      document.getElementById('monthDrop').addEventListener("change", function (e) {
        monthDrop(e)
      });

      document.getElementById('monthMobileDrop').addEventListener("change", function (e) {
        monthDrop(e)
      });

      function loadPaths(){
        if ($('#tornado_paths_check').prop('checked')){
          clearFilters();
          tornadoPaths.addTo(map);
          addLegend();

          // Add invisible layer with buffer to make popups more user friendly
          invisPaths.addTo(map);
          invisPaths.setStyle({opacity: 0, weight: 10});
        }else{
          if (legend != ""){
            legend.remove();
          }
          if (map.hasLayer(invisPaths)){
            map.removeLayer(tornadoPaths);
            map.removeLayer(invisPaths);
          }
          else if (map.hasLayer(newpaths)){
            console.log("has layer")
            map.removeLayer(newpaths)
            map.removeLayer(newinvispaths)
          }
          else if (map.hasLayer(monthPaths)){
            map.removeLayer(monthPaths)
            map.removeLayer(invismonthPaths)
          }
          else if (map.hasLayer(decadePaths)){
            map.removeLayer(decadePaths)
            map.removeLayer(invisDecadePaths)
          }
  
        }
      }

      function loadCounties(){
        if ($('#county_bounds_check').prop('checked')){
          countyLayer.addTo(map);
          countyLayer.setStyle(countyStyle)
          countyLayer.bringToBack();
        }
        else{
          if (map.hasLayer(countyLayer)){
            map.removeLayer(countyLayer);
          }
        }
      }
      
      function addLegend(){
        legend = L.control({position: 'bottomleft'});

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend')
            div.innerHTML += '<h3>Legend <br>(F-Scale, EF scale after January 2007)<br></h3>'
            var grades = [];
            grades = [0, 1, 2, 3, 4, 5];
            // generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                    grades[i] + '<br>';
            }
            // var labels = [];

            return div;
        };

        legend.addTo(map);
    }

      function getTornadoData(countyName){
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
  var svgWidth = $("#county-graph").width(),
      svgHeight = $("#county-graph").height()* 0.8;
  /////////////Create D3 County graph/////////////////
  var decades = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"]
  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 45, left: 40},
  width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

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
  .call(d3.axisBottom(x))
  .selectAll("text")  
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

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
    .text("Decade")

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
  $("#state-graph").html("Wisconsin Tornado Count 1950-2018")

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

  var svgWidth = $("#state-graph").width(),
      svgHeight = $("#state-graph").height()* 0.7;

  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 45, left: 45},
  width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

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
  .call(d3.axisBottom(x))
  .selectAll("text")  
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

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

$("#back").click(function(){
  $("#mobile-content").css('display', 'none');
});