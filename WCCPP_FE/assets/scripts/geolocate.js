/* =========================================================================================
 *
 *
 *
 *  Geolocation in phone with fallbacks
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 *  Geolocate object
 * ========================================================================================= */

var geolocationApp = {
    //<!-- Local globals -->//
	_watchID:null,
    
    //<!-- Initaliser -->//
	run:function() {
		var that = this;
        
        //<!-- Add click function to locate marker -->//
		$("#findME").on("click", function() {
			that._handleRefresh.apply(that, arguments);
		});
	},
    
    //<!-- Perform Geolocation function -->//
	_handleRefresh:function() {
		var options = {
			enableHighAccuracy: true
		},
		that = this;
		navigator.geolocation.getCurrentPosition(function() {
			that._onSuccess.apply(that, arguments);
		}, function() {
			that._onError.apply(that, arguments);
		}, options);
	},
  
    //<!-- Geolocate- Success -->//
	_onSuccess:function(position) {
		//<!-- Get lat lng -->//
        var thislat = position.coords.latitude;
		var thislng = position.coords.longitude;
        
        //<!-- Set the map view -->//
        Lmap.map.setView([thislat, thislng], 18);
        
        //<!-- Set form for lat lng -->//
        $('#searchLat').val(thislat);
		$('#searchLng').val(thislng);
		$('#searchPostcode').val('');
		$('#searchBay').val('');
        
        //<!-- Displa message -->//
        Messenger().post({
            message:  "Found you at " + thislat + " by " + thislng,
            type: "success"
        });
	},
    
    //<!-- Geolocate - error -->//
	_onError:function(error) {
        Messenger().post({
            message:  error.message+ " - " + error.code,
            type: "error"
        });
	},
}