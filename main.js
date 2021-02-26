// $.ajax({
//     dataType: "text",
//     url: "wi_hex_points_table.csv",
//     success: function(data) {
//         setMap(data);
//     }
//     })
var promises = [];
var files = ["1950_hex.geojson", "1960_hex.geojson", "1970_hex.geojson", "1980_hex.geojson", "1990_hex.geojson", "2000_hex.geojson", "2010_hex.geojson"];


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
    }).setView([44.7, -88.5], 7);
    
    // Set map top == navbar height so the navbar will not hide the top of it
    $('#map').css('top', $('#navbar').outerHeight());
    $('#map').css('left', "20%");
    $('#sidebar').css('top', $('#navbar').outerHeight());
    // $('.btn-group').css('top', $('#navbar').outerHeight());
    $('#date-label').css('top', $('#navbar').outerHeight());
    
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

                var layers = [hex1950, hex1960, hex1970, hex1980, hex1990, hex2000, hex2010];
                var labels = ["1950", "1960", "1970", "1980", "1990", "2000", "2010"]

                function getColor(d) {
                    return d == 5 ? '#800026' :
                        d == 4  ? '#BD0026' :
                        d == 3  ? '#E31A1C' :
                        d == 2  ? '#FC4E2A' :
                        d == 1   ? '#FD8D3C' :
                        d == 0   ? '#FEB24C' :
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
                                    '#fffff';
                }

                function sevStyle(feature) {
                    return {
                        fillColor: getColor(feature.properties["mag"]),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    };
                }

                function countStyle(feature) {
                    return {
                        fillColor: getCountColor(feature.properties["Join_Count"]),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    };
                }

                var i = 0;
                var animation;
                var stop = false;
                
////////////////INTERACTIVE HEXBINS///////////////////////
                // coordArray = [];

                // hex1950.features.forEach(function(feature){
                //     coordinates = feature.geometry.coordinates
                //     coordinates.forEach(function(coord){
                //         coord.forEach(function(element){
                //             coordArray.push(element)
                //         })
                //     })
                // })

                // function getDomain(){
                //     domainArray = [];
                //     hex1950.features.forEach(function(feature){
                //         domainArray.push(feature.properties["Join_Count"])
                //     })
                //     console.log(domainArray)
                //     return domainArray
                // }

                // var options = {}
                // // Create the hexbin layer and set all of the accessor functions
                // var hexLayer = L.hexbinLayer(options).addTo(map);

                // var colorScale = d3.scaleLinear().range(['#800026','#BD0026','#E31A1C','#FC4E2A','#FD8D3C','#FEB24C','#FFEDA0']).domain([0,4]);
                // hexLayer.colorScale(colorScale);
                
                // hexLayer.data(coordArray);

/////////////// BEGIN ANIMATION////////////////

                countAnimate();

                $("#sev").click(function(){
                    stopAnimation();
                    animate();
                    stop == true;
                });

                $("#count").click(function() {
                    stopAnimation()
                    countAnimate()
                    stop == true;
                });

                function animate(){
                    console.log(stop)
                    if (stop == true){
                        return;
                    }
                    animation = setTimeout(function(){
                        console.log(i)
                        L.geoJson(layers[i], {style: sevStyle}).addTo(map);
                        $("#date-label").html("Tornado Severity by Decade: " + labels[i] + "s");
                        i++;
                        if (i <= (layers.length - 1)){
                            animate()
                        }
                        else{
                            i = 0;
                            animate();
                        }
                    }, 1000)
                }

                function stopAnimation(){
                    clearTimeout(animation)
                    i = 0;
                    map.eachLayer(function (layer) {
                        if (layer == basemap){
                            console.log(basemap);
                        }
                        else{
                            map.removeLayer(layer);
                        }
                    });
                    stop == false;
                }

                function countAnimate(){
                    if (stop == true){
                        return;
                    }
                    animation = setTimeout(function(){
                        L.geoJson(layers[i], {style: countStyle}).addTo(map);
                        $("#date-label").html("Number of Tornadoes by Decade: " + labels[i]  + "s");
                        i++;
                        if (i <= (layers.length - 1)){
                            countAnimate()
                        }
                        else{
                            i = 0;
                            countAnimate();
                        }
                    }, 1000)
                }
        }
    }
}

