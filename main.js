// $.ajax({
//     dataType: "text",
//     url: "wi_hex_points_table.csv",
//     success: function(data) {
//         setMap(data);
//     }
//     })
var promises = [];
var files = ["join_1950.json", "join_1960.json", "join_1970.json", "join_1980.json", "join_1990.json", "join_2000.json", "join_2010.json", "january.json", "february.json", "march.json", "april.json", "may.json", "june.json", "july.json", "august.json", "september.json", "october.json", "november.json", "december.json"];

window.onload = loadFiles()
window.onload = setMap()
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
function setMap(data){
    var map = L.map('map',{
        zoomControl: false,
        scrollWheelZoom: false,
        maxZoom: 18,
        dragging: false,
    }).setView([44.7, -88.5], 7);
    
    // Set map top == navbar height so the navbar will not hide the top of it
    $('#map').css('top', $('#navbar').outerHeight());
    $('#map').css('left', "25%");
    $('#map').css('border-right', 'black 10px solid');
    $('#sidebar-viz').css('top', $('#navbar').outerHeight());
    // $('.btn-group').css('top', $('#navbar').outerHeight());
    $('#date-label').css('top', $('#navbar').outerHeight());
    $('#date-label').css('left', $('#sidebar').width() + 20 + ($('#map').width() * 0.3));
    
    var basemap = L.esri.basemapLayer('DarkGray').addTo(map);
    
    // set center coordinates
    var centerlat = 34.05;
    var centerlon = -118.25;
    
    //parameters for hex grid
    var extent = [-93.988114, 42.191983, -86.705415, 47.080621];
    var cellWidth = 20;

    // Call read function when files are loaded
    Promise.all(promises).then(ready);
    function ready(data){

        animate()

        function animate(){

            // for (i = 0; i < 50; i++){
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

                var layers = [hex1950, hex1960, hex1970, hex1980, hex1990, hex2000, hex2010];
                var labels = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"];

                var monthLayers = [january, february, march, april, may, june, july, august, september, october, november, december];
                var monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                var slider = document.getElementById("myRange"); // Display the default slider value

                // Update the current slider value (each time you drag the slider handle)
                slider.oninput = function() {
                    changeMap(this.value);
                }

                function getColor(d) {
                    return d == 5 ? '#E31A1C' :
                        d == 4  ? '#FC4E2A' :
                        d == 3  ? '#FD8D3C' :
                        d == 2  ? '#FEB24C' :
                        d == 1   ? '#FED976' :
                        d == 0   ? '#FFEDA0' :
                                    '#FFEDA0';
                }

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

                var i = 0;
                var j = 0;
                var animation;
                var stop = false;
                var stopClicked = false;
                var variable = "severity";
                var layerInUse = "";
                var legend = "";
                var selection = "decade";

/////////////// BEGIN ANIMATION////////////////
                // Add initial hexbin map
                var initMap = L.geoJson(layers[i], {style: {
                    fillColor: '#484848',
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 1,
                    interactive: false}
                }).addTo(map);

                // var initMap = L.geoJson(layers[6], {style: sevStyle}).addTo(map);
                // $("#date-label").html("Tornado Severity 2010-2018");

                $("#decades").click(function(){
                    stopAnimation();
                    stop=true;
                    stopClicked=true;
                    selection="decade";
                    document.getElementById("myRange").min = "-1";
                    document.getElementById("myRange").max = "6";
                });

                $("#months").click(function(){
                    stopAnimation();
                    stop=true;
                    stopClicked=true;
                    selection="month";
                    document.getElementById("myRange").min = "-1";
                    document.getElementById("myRange").max = "11";
                });

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
                    // stop == true;
                });

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
                    // stop == true;
                });

                $("#stop").click(function() {
                    stop = true;
                    stopClicked = true;
                });

                $("#back").click(function() {
                    pauseAnimation();
                    stop = true;
                    stopClicked = true;
                    i -= 1;
                    j -= 1;
                    slider.value --;
                    if (selection == "decade"){
                        if (!(i < 0) && !(j < 0)){
                            if (variable == "severity"){
                                layerInUse = L.geoJson(layers[i], {style: sevStyle}).addTo(map);
                                $("#date-label").html("Tornado Severity by Decade: " + labels[i] + "s");
                            }
                            else{
                                layerInUse = L.geoJson(layers[i], {style: countStyle}).addTo(map);
                                $("#date-label").html("Number of Tornadoes by Decade: " + labels[i]  + "s");
                            }
                        }else{
                            i = 0;
                            j = 0;
                        }
                    }else if (selection == "month"){
                        if (!(i < 0) && !(j < 0)){
                            if (variable == "severity"){
                                layerInUse = L.geoJson(monthLayers[i], {style: sevStyle}).addTo(map);
                                $("#date-label").html("Tornado Severity by Month: " + monthLabels[i]);
                            }
                            else{
                                layerInUse = L.geoJson(monthLayers[i], {style: countStyle}).addTo(map);
                                $("#date-label").html("Number of Tornadoes by Month: " + monthLabels[i]);
                            }
                        }else{
                            i = 0;
                            j = 0;
                        }
                    }
                });

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

                function changeMap(value){
                    $("#date-label").html("");
                    if (value == -1){
                        console.log(value)
                        if (map.hasLayer(sliderlayer)){
                            map.removeLayer(sliderlayer);
                        }
                        initMap.addTo(map);
                        // console.log($("#date-label").html());
                    }
                    if (map.hasLayer(sliderlayer)){
                        map.removeLayer(sliderlayer);
                    }
                    if (selection == "decade"){
                        if (variable == "severity"){
                            $("#date-label").html("Tornado Severity by Decade: " + labels[value] + "s");
                        }
                        else if (variable == "count"){
                            $("#date-label").html("Number of Tornadoes by Decade: " + labels[value]);
                        }
                        sliderlayer = L.geoJson(layers[value], {style: countStyle}).addTo(map);
                    }else if (selection == "month"){
                        if (variable == "severity"){
                            $("#date-label").html("Tornado Severity by Month: " + monthLabels[value] + "s");
                        }
                        else if (variable == "count"){
                            $("#date-label").html("Number of Tornadoes by Month: " + monthLabels[value]);
                        }
                        sliderlayer = L.geoJson(monthLayers[value], {style: countStyle}).addTo(map);
                    }
                }

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

                function sevAnimate(){
                    if (map.hasLayer(initMap)){
                        map.removeLayer(initMap);
                    }
                    variable = "severity";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setTimeout(function(){
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
                                sevAnimate();
                            }
                            else{
                                i = 0;
                                sevAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            slider.value = -1;
                            stop = true;
                            if (legend != ""){
                                legend.remove();
                            }
                            map.removeLayer(layerInUse);
                            initMap.addTo(map);
                            $("#date-label").html("");
                            return;
                        }
                    }, 1000)
                }

                function stopAnimation(){
                    clearTimeout(animation)
                    i = 0;
                    j = 0;
                    map.eachLayer(function (layer) {
                        if (layer == basemap){
                            console.log("stopped animation");
                        }
                        else{
                            map.removeLayer(layer);
                        }
                    });
                    stop = false;
                    initMap.addTo(map);
                    $("#date-label").html("");
                }

                function pauseAnimation(){
                    clearTimeout(animation);
                }

                function countAnimate(){
                    if (map.hasLayer(initMap)){
                        map.removeLayer(initMap);
                    }
                    variable = "count";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setTimeout(function(){
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
                                countAnimate()
                            }
                            else{
                                i = 0;
                                countAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            stop = true;
                            slider.value = -1;
                            if (legend != ""){
                                legend.remove();
                            }
                            map.removeLayer(layerInUse);
                            initMap.addTo(map);
                            $("#date-label").html("");
                            return;
                        }
                    }, 1000)
                }

                //// MONTH ANIMATION /////////

                function sevMonthAnimate(){
                    if (map.hasLayer(initMap)){
                        map.removeLayer(initMap);
                    }
                    variable = "severity";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setTimeout(function(){
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
                                sevMonthAnimate();
                            }
                            else{
                                i = 0;
                                sevMonthAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            stop = true;
                            slider.value = -1;
                            if (legend != ""){
                                legend.remove();
                            }
                            map.removeLayer(layerInUse);
                            initMap.addTo(map);
                            $("#date-label").html("");
                            return;
                        }
                    }, 1000)
                }

                function stopMonthAnimation(){
                    clearTimeout(animation)
                    i = 0;
                    j = 0;
                    map.eachLayer(function (layer) {
                        if (layer == basemap){
                            console.log(basemap);
                        }
                        else{
                            map.removeLayer(layer);
                        }
                    });
                    stop = false;
                    initMap.addTo(map);
                    $("#date-label").html("");
                }

                function countMonthAnimate(){
                    if (map.hasLayer(initMap)){
                        map.removeLayer(initMap);
                    }
                    variable = "count";
                    if (stop == true){
                        if (stopClicked == true){
                            pauseAnimation();
                            return;
                        }else{
                            return;
                        }
                    }
                    animation = setTimeout(function(){
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
                                countMonthAnimate()
                            }
                            else{
                                i = 0;
                                countMonthAnimate();
                            }
                        }
                        else{
                            j=0;
                            i=0;
                            stop = true;
                            slider.value = -1;
                            if (legend != ""){
                                legend.remove();
                            }
                            map.removeLayer(layerInUse);
                            initMap.addTo(map);
                            $("#date-label").html("");
                            return;
                        }
                    }, 1000)
                }
        }
    }
}

