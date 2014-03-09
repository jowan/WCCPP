/* =========================================================================================
 *  Leaflet / Mapbox Maps, with some custom radness
 * ========================================================================================= */
var highlightmarker = false;
var mapSearch = false;
var routerLayer = false;

var Lmap = {
    //<!-- LOCAL GLOBALS -->//
    map: '',
    markers: '',
    geoJsonLayer: '',
    founduser: false,
    initLon: -0.1378682,
    initLat: 51.5087173,
    scale: 11,
    
    //<!-- CONSTRUCTOR -->//
    initialize: function() {
        //this.bindEvents();
        Lmap.buildMap();
    },
    
    //<!-- BIND ANDY EVENTS LOCALLY HERE -->//
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    //<!-- IMPLEMENTS ONDEVICEREADY -->//
    onDeviceReady: function() {
        Lmap.buildMap();
    },
    
    //<!-- BUILD MAP FUNCTION -->//
    buildMap: function(){
        //<!-- Get out data from our file, into an object here -->//
        var geoJsonData = allBays;
        
        //<!-- Create the map object into our global -->//
        //Lmap.map = L.mapbox.map('map', 'examples.h186knp8')
        //Lmap.map = L.mapbox.map('map', 'eveningscode.map-jy3mprc0')
        Lmap.map = L.mapbox.map('map', 'eveningscode.map-exqe556o')
        	.setView([Lmap.initLat, Lmap.initLon], Lmap.scale);
        
        //<!-- Add each feature to a cluster, then add the layer -->//
        Lmap.markers = L.markerClusterGroup({
            disableClusteringAtZoom: 17
        }).addTo(Lmap.map);
        
        //<!-- Add each feature to our layer, then add the layer -->//
        L.geoJson(geoJsonData, {
            pointToLayer: L.mapbox.marker.style,
            style: function(feature) { return feature.properties; }
        }).addTo(Lmap.markers);

        //<!-- Add geocoder to map -->//
        mapSearch = new L.Control.GeoSearch({
            provider : new L.GeoSearch.Provider.OpenStreetMap(),
            showMarker : false,
            snapTo : false,
            getNearby : true
        }).addTo(Lmap.map);

        /*
        routerLayer = L.Routing.control({
            waypoints: [
                L.latLng(57.74, 11.94),
                L.latLng(57.6792, 11.949)
            ]
        }).addTo(Lmap.map);
        */

        //<!-- Add some phone location listeners -->//
        Lmap.map.on('locationfound', Lmap.onLocationFound);
        Lmap.map.on('locationerror', Lmap.onLocationError);

        Lmap.markers.eachLayer(function(layer) {

            // here you call `bindPopup` with a string of HTML you create - the feature
            // properties declared above are available under `layer.feature.properties`

            var bid = layer.feature.properties.title;

            var mkp  = "<div id='btngroup_"+bid+"' class='btn-group-vertical popup_buttons' data-bid='"+bid+"'>";
                mkp += "<button id='bay_now' class='btn btn-info btn-sm'>Predict for now</button>";
                mkp += "<button id='bay_date' class='btn btn-info btn-sm'>Predict for time</button>";
                mkp += "<button id='bay_info' class='btn btn-info btn-sm'>Get bay information</button>";
                //mkp += "<button id='bay_route' class='btn btn-info btn-sm'>Route to bay from here</button>";
                mkp += "<button id='bay_search' class='btn btn-info btn-sm'>View historical data</button>";
                mkp += "</div>";
                mkp += "<div id='datagroup_"+bid+"' class='popup_data'>";
                mkp += "</div>";

            layer.bindPopup(mkp);
        });

        //<!-- Make maker info appear on click in info area -->//
        
        console.log('building map');
    },
    
    //<!-- PROGRESS UPDATE / MAP LOADED CALLBACK -->//
    updateProgressBar: function(processed, total, elapsed, layersArray) {
        if (processed == total) {
            if(processed > 0){
                $('#screener').addClass('fadeOut');
                $('#bulb_count').text(processed);
                setTimeout(function() {
                    $('#screener').addClass('hidden');
                    //console.log('visible');
                }, 500);
            }
        }
    },
    
    //<!--  -->//
    relocateLdn: function(){
        Lmap.map.setView([Lmap.initLat, Lmap.initLon], Lmap.scale);
    },
    
    //<!-- CLICK CALLBACK - CHECK LOCATION -->//
    checkLocation: function(){
        Lmap.map.locate({setView : true});
    },
    
    //<!--  -->//
    onLocationError: function (e) {
        navigator.notification.alert(
            'Please enable location settings',
            Lmap.alertDismissed,
            'Unable to locate',
            'OK'
        );
    },
    //<!--  -->//
    alertDismissed: function(){
        // PASS
    },
    
    //<!--  -->//
    onLocationFound: function (e) {
        // alert(e.message);
        if(!Lmap.founduser){
            var radius = e.accuracy / 2;
            L.marker(e.latlng).addTo(Lmap.map)
              .bindPopup("You are within " + radius + " meters from this point").openPopup
            L.circle(e.latlng, radius).addTo(Lmap.map);
            Lmap.founduser = true;
        }
    }
    
};

