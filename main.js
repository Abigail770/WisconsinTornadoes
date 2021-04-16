// Global variables
var promises = [];
var files = ["data/join_1950.json", "data/join_1960.json", "data/join_1970.json", "data/join_1980.json", "data/join_1990.json", "data/join_2000.json", "data/join_2010.json", "data/january.json", "data/february.json", "data/march.json", "data/april.json", "data/may.json", "data/june.json", "data/july.json", "data/august.json", "data/september.json", "data/october.json", "data/november.json", "data/december.json"];
var map;
var initMap;

// Load files and set map when window loads
window.onload = loadFiles()
window.onload = setMap()

// $(window).resize(setMap);
$(window).resize(function(){location.reload();});

var sliderlayer;

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

// Add Leaflet map and load data
function setMap(){
    if (map){
        map.off();
        map.remove();
    }
    
    var mediaQuery = window.matchMedia( "(max-width: 1068px)" );
    if (mediaQuery.matches) {
        map = L.map('map',{
            zoomControl: false,
            scrollWheelZoom: false,
            zoom: 6,
            center: [44.4, -89.7],
            maxZoom: 18,
            dragging: false,
        });
        $('#map').css('left', "0");
        $('#map').css('right', "0");
        $('#info-text').html('Tornadoes are among the least understood storm events in terms of climate change impacts.  Over the past few decades, there has been no identifiable increase in the number of high magnitude tornadoes in the US.  However, tornado events are increasingly clustered and the number of days with tornado events is increasing.  This could be an effect of climate change. </br></br> <strong>Select a type and variable.  Then use the map controls or slider to start the animation.</strong>')
        $('#mobile-div').append($('#control-buttons'));
        $('#mobile-div').append($('#slidecontainer'));
        $('#mobile-div').css('top', $('#navbar').outerHeight());
        $('#date-label').css('top', $('#navbar').outerHeight() + $('#mobile-div').outerHeight());
        $('#control-text').html("");
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
    }
    else{
        map = L.map('map',{
            zoomControl: false,
            scrollWheelZoom: false,
            zoom: 7,
            center: [44.7, -87.5],
            maxZoom: 18,
            dragging: false,
        });
        $('#map').css('left', "30%");
        $('#sidebar-viz').css('top', $('#navbar').outerHeight());
        $('#date-label').css('top', $('#navbar').outerHeight());
        $('#date-label').css('left', $('#sidebar-viz').width() + 20 + ($('#map').width() * 0.3));
    }
    // Set map top == navbar height so the navbar will not hide the top of it
    $('#map').css('top', $('#navbar').outerHeight());

    // Set div positions so they don't overlap each other
    $('#map').css('border-right', 'black 10px solid');
    

    // Load basemap
    var basemap = L.esri.basemapLayer('DarkGray').addTo(map);

    function getMobileContent(){
        $("#mobile-content").css('display', 'block');
        $('#mobile-content').css('top', $('#navbar').outerHeight());
        $('#mobile-content').append($('#sidebar-viz'));
        $('#sidebar-viz').css('display', 'block');
    }

    // Call ready function when files are loaded
    Promise.all(promises).then(ready);
    function ready(data){

        animate()

        function animate(){

                // Set data for each geojson file to a different variable
                var hex1950 = data[0]
                var hex1960 = data[1]
                var hex1970 = data[2]
                var hex1980 = data[3]
                var hex1990 = data[4]
                var hex2000 = data[5]
                var hex2010 = data[6]
                var january = data[7]
                var february = data[8]
                var march = data[9]
                var april = data[10]
                var may = data[11]
                var june = data[12]
                var july = data[13]
                var august = data[14]
                var september = data[15]
                var october = data[16]
                var november = data[17]
                var december = data[18]

                // Create lists for data layers and data labels
                var layers = [hex1950, hex1960, hex1970, hex1980, hex1990, hex2000, hex2010];
                var labels = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"];

                var monthLayers = [january, february, march, april, may, june, july, august, september, october, november, december];
                var monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                var slider = document.getElementById("myRange"); // Display the default slider value

                // Update the current slider value (each time you drag the slider handle)
                slider.oninput = function() {
                    changeMap(this.value);
                }

                // Set colors for severities
                function getColor(d) {
                    return d == 5 ? '#E31A1C' :
                        d == 4  ? '#FC4E2A' :
                        d == 3  ? '#FD8D3C' :
                        d == 2  ? '#FEB24C' :
                        d == 1   ? '#FED976' :
                        d == 0   ? '#FFEDA0' :
                                    '#FFEDA0';
                }

                // Set colors for counts
                function getCountColor(d) {
                    return d == 7 ? '#800026' :
                        d == 6  ? '#BD0026' :
                        d == 5  ? '#E31A1C' :
                        d == 4  ? '#FC4E2A' :
                        d == 3   ? '#FD8D3C' :
                        d == 2   ? '#FEB24C' :
                        d == 1   ? '#FED976' :
                        d == 0   ?  '#FFEDA0':
                                    '#FFEDA0';
                }

                // Set color for each hexgrid according to severity (magnitude)
                function sevStyle(feature) {
                    return {
                        fillColor: getColor(feature.properties["mag"]),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 1,
                        interactive: false
                    };
                }

                // Set color for each hexgrid according to number of tornadoes
                function countStyle(feature) {
                    return {
                        fillColor: getCountColor(feature.properties["Join_Count"]),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 1,
                        interactive: false
                    };
                }

                // "Global" variables
                var i = 1;
                var j = 1;
                var animation;
                var stop = false;
                var stopClicked = false;
                var variable = "severity";
                var layerInUse = "";
                var legend = "";
                var selection = "decade";

                setInitialMap();
                initMap.addTo(map);
                addLegend("severity");
                /////////////// BEGIN ANIMATION////////////////
                // Add initial (blank) hexbin map
                // initMap = L.geoJson(layers[0], {style: {
                //     fillColor: '#FFEDA0',
                //     weight: 2,
                //     opacity: 1,
                //     color: 'white',
                //     fillOpacity: 1,
                //     interactive: false}
                // }).addTo(map);

                function setInitialMap(){
                    if (map.hasLayer(initMap)){
                        map.removeLayer(initMap);
                    }
                    if (variable == "severity" && selection == "decade"){
                        initMap = L.geoJson(layers[0], {style: sevStyle});
                        $("#date-label").html("Tornado Severity by Decade: 1950s");
                        return;
                    }
                    else if (variable == "count" && selection == "decade"){
                        initMap = L.geoJson(layers[0], {style: countStyle});
                        $("#date-label").html("Number of Tornadoes by Decade: 1950s");
                        return;
                    }
                    else if (variable == "severity" && selection == "month"){
                        initMap = L.geoJson(monthLayers[0], {style: sevStyle});
                        $("#date-label").html("Tornado Severity by Month: January");
                        return;
                    }
                    else if (variable == "count" && selection == "month"){
                        initMap = L.geoJson(monthLayers[0], {style: countStyle});
                        $("#date-label").html("Number of Tornadoes by Month: January");
                        return;
                    }
                }

                // var initMap = L.geoJson(layers[6], {style: sevStyle}).addTo(map);
                // $("#date-label").html("Tornado Severity 2010-2018");

                // Set slider range and variables on decade button click
                $("#decades").click(function(){
                    stopAnimation();
                    stop=true;
                    stopClicked=true;
                    selection="decade";
                    slider.value = 0;
                    document.getElementById("myRange").min = "0";
                    document.getElementById("myRange").max = "6";
                    if (variable == "severity"){
                        addLegend("severity");
                        $("#date-label").html("Tornado Severity by Decade: 1950s");
                    }
                    else if (variable == "count"){
                        addLegend("count");
                        $("#date-label").html("Number of Tornadoes by Decade: 1950s");
                    }
                    setInitialMap();
                    initMap.addTo(map);
                });

                // Set slider range and variables on month button click
                $("#months").click(function(){
                    stopAnimation();
                    stop=true;
                    stopClicked=true;
                    selection="month";
                    slider.value = 0;
                    document.getElementById("myRange").min = "0";
                    document.getElementById("myRange").max = "11";
                    if (variable == "severity"){
                        addLegend("severity");
                        $("#date-label").html("Tornado Severity by Month: January");
                    }
                    else if (variable == "count"){
                        addLegend("count");
                        $("#date-label").html("Number of Tornadoes by Month: January");
                    }
                    setInitialMap();
                    initMap.addTo(map);
                });

                // Reset any previous variables and add legend when severity button is clicked
                $("#sev").click(function(){
                    if (selection == "decade"){
                        stopAnimation();
                        variable = "severity";
                        // sevAnimate();
                    }else if (selection == "month"){
                        stopMonthAnimation();
                        variable = "severity";
                        // sevMonthAnimate();
                    }
                    addLegend("severity");
                    if (selection == "decade"){
                        $("#date-label").html("Tornado Severity by Decade: 1950s");
                    }
                    else if (selection == "month"){
                        $("#date-label").html("Tornado Severity by Month: January");
                    }
                    slider.value = 0;
                    setInitialMap();
                    initMap.addTo(map);
                    // stop == true;
                });

                // Reset any previous variables and add legend when county button is clicked
                $("#count").click(function() {
                    if (selection == "decade"){
                        stopAnimation();
                        variable = "count";
                        // countAnimate()
                    }else if (selection == "month"){
                        stopMonthAnimation();
                        variable = "count";
                        // countMonthAnimate();
                    }
                    addLegend("count");
                    if (selection == "decade"){
                        $("#date-label").html("Number of Tornadoes by Decade: 1950s");
                    }
                    else if (selection == "month"){
                        $("#date-label").html("Number of Tornadoes by Month: January");
                    }
                    slider.value = 0;
                    setInitialMap();
                    initMap.addTo(map);
                    // stop == true;
                });

                // Pause interval and set variables when stop button is clicked
                $("#stop").click(function() {
                    pauseAnimation();
                    stop = true;
                    stopClicked = true;
                });

                //  Start decade or month and count or severity animation when play button is clicked, add legend
                $("#play").click(function() {
                    if (selection == "decade"){
                        if (stopClicked == true){
                            stop = false;
                        }else{
                            stopAnimation();
                        }
                        if (variable == "severity"){
                            addLegend("severity");
                            sevAnimate();
                        }
                        else{
                            addLegend("count");
                            countAnimate();
                        }
                    }else if (selection == "month"){
                        if (stopClicked == true){
                            stop = false;
                        }else{
                            stopMonthAnimation();
                        }
                        if (variable == "severity"){
                            addLegend("severity");
                            sevMonthAnimate();
                        }
                        else{
                            addLegend("count");
                            countMonthAnimate();
                        }
                    }
                });

                // Update map layers and date layers when slider is changed
                function changeMap(value){
                    // if (value == -1){
                    //     if (map.hasLayer(sliderlayer)){
                    //         map.removeLayer(sliderlayer);
                    //     }
                    //     setInitialMap();
                    //     initMap.addTo(map);
                    //     $("#date-label").html("");
                    //     return;
                    // }
                    if (map.hasLayer(sliderlayer)){
                        map.removeLayer(sliderlayer);
                    }
                    if (selection == "decade"){
                        if (variable == "severity"){
                            $("#date-label").html("Tornado Severity by Decade: " + labels[value] + "s");
                            sliderlayer = L.geoJson(layers[value], {style: sevStyle}).addTo(map);
                        }
                        else if (variable == "count"){
                            $("#date-label").html("Number of Tornadoes by Decade: " + labels[value] + "s");
                            sliderlayer = L.geoJson(layers[value], {style: countStyle}).addTo(map);
                        }
                    }else if (selection == "month"){
                        if (variable == "severity"){
                            $("#date-label").html("Tornado Severity by Month: " + monthLabels[value]);
                            sliderlayer = L.geoJson(monthLayers[value], {style: sevStyle}).addTo(map);
                        }
                        else if (variable == "count"){
                            $("#date-label").html("Number of Tornadoes by Month: " + monthLabels[value]);
                            sliderlayer = L.geoJson(monthLayers[value], {style: countStyle}).addTo(map);
                        }
                    }
                    // Set up variables for animation according to current slider value
                    i = value;
                    j = value;
                }

                // Create legends for count and severity
                function addLegend(type){
                    if (legend != ""){
                        legend.remove();
                    }
                    legend = L.control({position: 'bottomleft'});

                    legend.onAdd = function (map) {

                        var div = L.DomUtil.create('div', 'info legend')
                        var grades = [];
                            if (type == "severity"){
                                grades = [0, 1, 2, 3, 4, 5];
                                div.innerHTML +='<h4>Legend (F-Scale, EF scale after January 2007)</h4>'
                                // generate a label with a colored square for each interval
                                for (var i = 0; i < grades.length; i++) {
                                    div.innerHTML +=
                                        '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                                        grades[i] + '<br>';
                                }
                            }else{
                                grades = [0, 1, 2, 3, 4, 5, 6, 7];
                                div.innerHTML +='<h4>Legend (tornadoes per ' + selection + ')<br></h4>'
                                // generate a label with a colored square for each interval
                                for (var i = 0; i < grades.length - 1; i++) {
                                    div.innerHTML +=
                                        '<i style="background:' + getCountColor(grades[i]) + '"></i> ' +
                                        grades[i] + (grades[i + 1]? '&ndash;' + grades[i + 1] + '<br>': 'No data');
                                }
                            }
                        // var labels = [];

                        return div;
                    };

                    legend.addTo(map);
                }

                // Severity animation for decades
                function sevAnimate(){
                    // if (map.hasLayer(initMap)){
                    //     map.removeLayer(initMap);
                    // }
                    variable = "severity";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setInterval(function(){
                        if (map.hasLayer(layerInUse)){
                            map.removeLayer(layerInUse);
                        }
                        layerInUse = L.geoJson(layers[i], {style: sevStyle}).addTo(map);
                        $("#date-label").html("Tornado Severity by Decade: " + labels[i] + "s");
                        slider.value = i;
                        i++;
                        j++;
                        if (j <= (layers.length)){
                            if (i <= (layers.length - 1)){
                                // sevAnimate();
                                i = i;
                            }
                            else{
                                i = 1;
                                // sevAnimate();
                            }
                        }
                        else{
                            j=1;
                            i=1;
                            slider.value = 0;
                            stop = true;
                            // if (legend != ""){
                            //     legend.remove();
                            // }
                            map.removeLayer(layerInUse);
                            setInitialMap();
                            initMap.addTo(map);
                            pauseAnimation();
                            return;
                        }
                    }, 1000)
                }

                // Function to reset map (NOT used when stop button is clicked)
                function stopAnimation(){
                    clearInterval(animation)
                    i = 1;
                    j = 1;
                    map.eachLayer(function (layer) {
                        if (layer == basemap){
                            console.log("stopped animation");
                        }
                        else{
                            map.removeLayer(layer);
                        }
                    });
                    stop = false;
                    setInitialMap();
                    initMap.addTo(map);
                    // $("#date-label").html("");
                }

                // Called when stop button is clicked
                function pauseAnimation(){
                    clearInterval(animation);
                }

                // Animation to display number of tornadoes per decade
                function countAnimate(){
                    // if (map.hasLayer(initMap)){
                    //     map.removeLayer(initMap);
                    // }
                    variable = "count";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setInterval(function(){
                        if (map.hasLayer(layerInUse)){
                            map.removeLayer(layerInUse);
                        }
                        layerInUse = L.geoJson(layers[i], {style: countStyle}).addTo(map);
                        $("#date-label").html("Number of Tornadoes by Decade: " + labels[i]  + "s");
                        slider.value = i;
                        i++;
                        j++;
                        if (j <= (layers.length)){
                            if (i <= (layers.length - 1)){
                                // countAnimate()
                                i = i;
                            }
                            else{
                                i = 1;
                                // countAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            stop = true;
                            slider.value = 0;
                            // if (legend != ""){
                            //     legend.remove();
                            // }
                            map.removeLayer(layerInUse);
                            setInitialMap();
                            initMap.addTo(map);
                            pauseAnimation();
                            return;
                        }
                    }, 1000)
                }

                //// MONTH ANIMATION /////////
                // Animation for tornado severity by month
                function sevMonthAnimate(){
                    // if (map.hasLayer(initMap)){
                    //     map.removeLayer(initMap);
                    // }
                    variable = "severity";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setInterval(function(){
                        if (map.hasLayer(layerInUse)){
                            map.removeLayer(layerInUse);
                        }
                        layerInUse = L.geoJson(monthLayers[i], {style: sevStyle}).addTo(map);
                        $("#date-label").html("Tornado Severity by Month: " + monthLabels[i]);
                        slider.value = i;
                        i++;
                        j++;
                        if (j <= (monthLayers.length)){
                            if (i <= (monthLayers.length - 1)){
                                // sevMonthAnimate();
                                i = i;
                            }
                            else{
                                i = 1;
                                // sevMonthAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            stop = true;
                            slider.value = 0;
                            // if (legend != ""){
                            //     legend.remove();
                            // }
                            map.removeLayer(layerInUse);
                            setInitialMap();
                            initMap.addTo(map);
                            pauseAnimation();
                            return;
                        }
                    }, 1000)
                }

                // Resets variables and removes layers (NOT called when stop button is clicked)
                function stopMonthAnimation(){
                    clearInterval(animation)
                    i = 1;
                    j = 1;
                    map.eachLayer(function (layer) {
                        if (layer == basemap){
                            console.log("stopped animation");
                        }
                        else{
                            map.removeLayer(layer);
                        }
                    });
                    stop = false;
                    setInitialMap();
                    initMap.addTo(map);
                }

                // Animation for number of tornadoes per month
                function countMonthAnimate(){
                    // if (map.hasLayer(initMap)){
                    //     map.removeLayer(initMap);
                    // }
                    variable = "count";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setInterval(function(){
                        if (map.hasLayer(layerInUse)){
                            map.removeLayer(layerInUse);
                        }
                        layerInUse = L.geoJson(monthLayers[i], {style: countStyle}).addTo(map);
                        $("#date-label").html("Number of Tornadoes by Month: " + monthLabels[i]);
                        slider.value = i;
                        i++;
                        j++;
                        if (j <= (monthLayers.length)){
                            if (i <= (monthLayers.length - 1)){
                                // countMonthAnimate()
                                i = i;
                            }
                            else{
                                i = 1;
                                // countMonthAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            stop = true;
                            slider.value = 0;
                            // if (legend != ""){
                            //     legend.remove();
                            // }
                            map.removeLayer(layerInUse);
                            setInitialMap();
                            initMap.addTo(map);
                            pauseAnimation();
                            return;
                        }
                    }, 1000)
                }

                $("#back").click(function(){
                    $("#mobile-content").css('display', 'none');
                  });
        }
    }
}

