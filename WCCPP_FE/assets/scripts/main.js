/* =========================================================================================
 *
 *
 *
 *  MAIN JS FILE
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 *  SUPER GLOBALS
 * ========================================================================================= */

var allBays = {};
var mapme;
var get_nearby;
var circleLayer = false;
var bowday = false;
var backEndUrl = "http://109.203.111.251/~iotbay/apps/pp/services/services.php";

/* =========================================================================================
 *  LET'S GO - ON PAGE LOAD
 * ========================================================================================= */

$(function() {
  
/* =========================================================================================
 *  LOCAL GLOBALS
 * ========================================================================================= */

 	//<!-- TODAY'S DATE & LAST YEAR'S TODAYS DATE - REBUILD USING PURE MOMENT -->//
	today  = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
		if(dd < 10){
			dd = "0"+""+dd;
		}
		if(mm < 10){
			mm = "0"+""+mm;
		}
	var defday = "2013-"+mm+"-"+dd;
	var bowday = moment().format("YYYY-MM-DD HH:mm");

	//<!-- GLOABLS NEEDED FOR GRAPHS AND AJAX -->//
	var dates 		    = [defday];
	var bay   		    = 0;
	var numb_dates      = dates.length;
	var dates_count     = 0;
	var cnt_array       = [];
	var graph           = false;
    var data_container  = new Array();

	//<!-- GLOABLS NEEDED FOR MESSENGER -->//
    var messengerResult = false;

/* =========================================================================================
 *
 *
 *
 *  ONLOAD LIBRARY IMPLEMENTATIONS
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 *  HIDE THE LOADERS IN THE FORM BUTTONS
 * ========================================================================================= */

	$('.loader').hide();

/* =========================================================================================
 *  IMPLEMENTS dateSelectBoxes - STOPS USER FORM PICKING INVALID DATES
 * ========================================================================================= */

    $().dateSelectBoxes($('#birthMonth'),$('#birthDay'),$('#birthYear'));

    $().dateSelectBoxes($('#searchMonth'),$('#searchDay'),$('#searchYear'));

/* =========================================================================================
 *  IMPLEMENTS Messenger - MESSENGER FRAMEWORK FOR USING BOOTSTRAP
 * ========================================================================================= */

	Messenger.options = {
	    extraClasses: 'messenger-fixed messenger-on-bottom',
	    theme: 'flat',
	    maxMessages: 1,
	    messageDefaults: {
	    	hideAfter: 2
	    }
	}
 
/* =========================================================================================
 *  IMPLEMENTS selectpicker - BOOTSTRAP selectpicker
 * ========================================================================================= */
    
    $('.selectpicker').selectpicker();
   
/* =========================================================================================
 *
 *
 *
 *  AJAX CALLBACKS TO BACK END SERVICES
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 *  AJAX REQUEST - GET ALL BAYS FOR MAP
 * ========================================================================================= */

	function AJAX_GetBays(){
		//<!-- INVOKES MESSENGER WITH AJAX -->//
		Messenger().run({
			action: $.ajax,
			successMessage: 'Bays loaded',
			errorMessage: 'Error fetching bays',
			progressMessage: 'Fetching bays'
		}, {
			//<!-- BACKEND LOCATION -->//
		    url      : backEndUrl,
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    jsonp    : "callback",
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    dataType : "jsonp",
		    //<!-- FRAGMENTS -->//
		    data: {
		        query: 3,
		        format: "json"
		    },
		    //<!-- CALLBACK 'success' - CREATE A GEOJSON OBJECT FOR MAPBOX -->//
		    success: function( rdata ) {
		    	//<!-- CONTAINER -->//
		    	allBays  = {  type: "FeatureCollection",
							  features: []
							};
		    	//<!-- LOOP THROUGH EACH ITEM IN THE RETURNED JSON -->//
			    $.each(rdata, function(i, item){
			        //<!-- LAT AND LONG ARE STRINGS AT THIS POINT -->//
			        lng = parseFloat(item.lng)
			        lat = parseFloat(item.lat)
			        key = parseFloat(item.key)
			        if(lng && lat){
			        	//<!-- CREATE TEMP MARKER OBJECT -->//
				        marker = { type: "Feature",
						    geometry: {
						    	type: "Point",
						    	coordinates: [lng,lat]
						    },
						    properties: {
						    	title: key,
						    	'marker-symbol': "car",
						    	'marker-color': '#f0a',
						    	spaces : item.spaces,
						    	key: key
						    }
						};
						//<!-- ADD TEMP OBJECT TO CONTAINER -->//
						allBays.features.push(marker);
			        }
			    });
			    //<!-- INITALISE THE MAP - ONLY IF WE HAVE MARKER (bays - or die?) -->//
			    Lmap.initialize();
		    },
		    //<!-- CALLBACK 'fail' - JUST LOG -->//
		    fail:function( jqxhr, textStatus, error ) {
		    	var err = textStatus + ", " + error;
		    	console.log( "Request Failed: " + err );
			}
		});
	}

/* =========================================================================================
 *  AJAX REQUEST - GET ALL TRANSACTIONS FOR A BAY ON DATE
 * ========================================================================================= */

	function AJAX_GetBayDateTrans() {
			//console.log(bay);
			//console.log(dates);
		//<!-- LOOP FOR EACH DATE IN ARRAY -->//
		$.each( dates, function( i, date ) {
			//<!-- CREATE A LABEL ARRAY FOR GRAPH -->//
			cnt_array.push(i);
			//<!-- INVOKES MESSENGER WITH AJAX -->//
			Messenger().run({
				action 		    : $.ajax,
				successMessage  : 'Transactions found for date',
				errorMessage    : 'Error getting transactions for date',
				progressMessage : 'Fetching transactions'
			}, {
				//<!-- BACKEND LOCATION -->//
			    url      : backEndUrl,
			    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
			    jsonp    : "callback",
			    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
			    dataType : "jsonp",
			    //<!-- FRAGMENTS -->//
			    data     : {
			        query   : 2,
			        "vals[]": [ date, bay],
			        format  : "json"
			    },
			    //<!-- CALLBACK 'success' - PASS DATA TO GRAPHING FUNCTION  -->//
			    success : function( rdata ) {
				  	data_container[dates_count] = rdata;
				  	dates_count++;
				  	if ( dates_count == numb_dates ) {
				  		console.log(data_container[0][0]);
				  		if(data_container[0][0] != null){
				  			make_graph();
				  		}else{
							Messenger().post({
								message: "No transactions found for this date",
								type: "error"
							});
							//<!-- RESET SOME GLOBALS FOR NEXT TIME -->//
							dates_count    = 0;
							cnt_array      = [0];
							data_container = new Array();
				  		}
				  	}
			    },
			    //<!-- CALLBACK 'fail' - JUST LOG -->//
			    fail:function( jqxhr, textStatus, error ) {
			    	var err = textStatus + ", " + error;
			    	console.log( "Request Failed: " + err );
				}
			});
		});
	}


/* =========================================================================================
 *  AJAX REQUEST - GET ALL TRANSACTIONS FOR A BAY ON DATE
 * ========================================================================================= */

	function AJAX_GetBayInfo(){
		//<!-- RETURNED VALUE -->//
		messengerResult = false;
		//<!-- INVOKES MESSENGER WITH AJAX -->//
		Messenger().run({
			action			: $.ajax,
			successMessage  : 'Bay info found',
			errorMessage	: 'Error getting bay info - sorry',
			progressMessage : 'Fetching bay info'
		}, {
			//<!-- BACKEND LOCATION -->//
		    url		 : backEndUrl,
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    jsonp    : "callback",
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    dataType : "jsonp",
		    //<!-- FRAGMENTS -->//
		    data : {
		        query    : 'gbi',
		        'vals[]' : [bay],
		        format   : "json"
		    },
		    //<!-- CALLBACK 'success' - PRINT BAY INFO IN MIDDLE BLOCK  -->//
		    success: function( rdata ) {
		    	print_bay_data(rdata);
		    },
		    //<!-- CALLBACK 'fail' - JUST LOG -->//
		    fail:function( jqxhr, textStatus, error ) {
		    	var err = textStatus + ", " + error;
		    	console.log( "Request Failed: " + err );
			}
		});
	}

/* =========================================================================================
 *  AJAX REQUEST - PREDICT FOR DATE
 * ========================================================================================= */

	function AJAX_PredictForDate(predictDate, infoDest, bayid){
		//<!-- DEFAULTS FROM GLOBALS -->//
		if(!bayid){
			bayid = bay;
		}
		if(!infoDest){
			infoDest = 'popup';
		}//<!-- NICEFY DATES MARKUP -->//
		var date_nice = moment(predictDate).format("DD/MM/YY");
		var time_nice = moment(predictDate).format("HH:mm");
		//<!-- INVOKES MESSENGER WITH AJAX -->//
		Messenger().run({
			action: $.ajax,
			successMessage  : 'Bay occupancy calculated',
			errorMessage    : 'Error getting bay occupancy - sorry',
			progressMessage : 'Calculating bay occupancy'
		}, {
			//<!-- BACKEND LOCATION -->//
		    url      : backEndUrl,
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    jsonp    : "callback",
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    dataType : "jsonp",
		    //<!-- FRAGMENTS -->//
		    data: {
		        query    : 'gbcbbdt-holt2',
		        'vals[]' : [bayid, predictDate],
		        format   : "json"
		    },
		    //<!-- CALLBACK 'success' -->//
		    success: function( rdata ) {
			  	//console.log(rdata);
			  	if(rdata[0] == undefined){
  					Messenger().post({
		  				message: "You do not need a ticket at this time",
				  		type: "error"
					});
					close_mdb();
			  	}else{
			  		if(infoDest == 'mdb'){
			  			//<!-- MARKUP MIDDLE BLOCK -->//
						var mkp = '<h4>Now</h4>';
					  	mkp += "<div>This bay has <strong>"+rdata[1]+"</strong> spaces.</div>";
					  	if(rdata[0] == 1){
							mkp += "<div>We predict <strong>1</strong> space will be occupied.</div>";
					  	}else{
					  		mkp += "<div>We predict <strong>"+rdata[0]+"</strong> spaces will be occupied.</div>";
					  	}					  	//<!-- MARKUP TO DIV, OPEN PANEL, LOAD INFO VIA Ajax -->//
				  		$('#bayPredict').html(mkp);
				  		open_bay_info_panel();
				  		AJAX_GetBayInfo();
				  	}else if(infoDest == 'popup'){
				  		//<!-- LOOP THROUGH ALL MARKERS AND MATCH IDS -->//
						Lmap.markers.eachLayer(function(marker) {
					        if (marker.feature.properties.key == bayid) {
					        	//<!-- MARKUP FOR POPUP DATA DIV -->//
								var mkp = "<div>This bay has <strong>"+rdata[1]+"</strong> spaces.</div>";
							  	if(rdata[0] == 1){
									mkp += "<div>We predict <strong>1</strong> space will be occupied at <strong>"+time_nice+"</strong> on <strong>"+date_nice+"</strong></div>";
							  	}else{
							  		mkp += "<div>We predict <strong>"+rdata[0]+"</strong> spaces will be occupied at <strong>"+time_nice+"</strong> on <strong>"+date_nice+"</strong></div>";
							  	}							  	//<!-- OPEN POPUP, HIDE BUTTONS, SHOW DATA DIV -->//
					            marker.openPopup();
					            $("#datagroup_"+bayid).html(mkp);
					            $("#btngroup_"+bayid).hide();
					            $("#datagroup_"+bayid).fadeIn();
					        }
					    });
				  	}
			  	}
		    },
		    //<!-- CALLBACK 'fail' - JUST LOG -->//
		    fail:function( jqxhr, textStatus, error ) {
		    	var err = textStatus + ", " + error;
		    	console.log( "Request Failed: " + err );
			}
		});
	}


/* =========================================================================================
 *  AJAX REQUEST - GET ALL TRANSACTIONS FOR A BAY ON DATE
 * ========================================================================================= */

	function AJAX_GetBaysInCircle(lat, lng){
		//<!-- RETURNED VALUE -->//
		messengerResult = false;
		//<!-- INVOKES MESSENGER WITH AJAX -->//
		Messenger().run({
			action			: $.ajax,
			successMessage  : 'Bay info found',
			errorMessage	: 'Error getting bay info - sorry',
			progressMessage : 'Fetching bay info'
		}, {
			//<!-- BACKEND LOCATION -->//
		    url		 : backEndUrl,
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    jsonp    : "callback",
		    //<!-- IGNORE BUT NEEDED FOR JSONP -->//
		    dataType : "jsonp",
		    //<!-- FRAGMENTS -->//
		    data : {
		        query    : 'GetBaysInCircle',
		        'vals[]' : [lat, lng],
		        format   : "json"
		    },
		    //<!-- CALLBACK 'success' - PRINT BAY INFO IN MIDDLE BLOCK  -->//
		    success: function( rdata ) {
				//<!-- LOOP THROUGH EACH ITEM IN THE RETURNED JSON -->//
		    	$.each(rdata, function(i, item){
			        //lng = parseFloat(item.lng);
			        //lat = parseFloat(item.lat);
			        //<!-- WE JUST NEED LKEY REALLY -->//
			        if(bayid = parseFloat(item.key)){
			        	//<!-- PREDICT FOR EACH BAY - THESE WILL BE PARALLELE CALLS IF MULTIPLE -->//
					    AJAX_PredictForDate(bowday, 'popup', bayid);
			        }
			    });
		    },
		    //<!-- CALLBACK 'fail' - JUST LOG -->//
		    fail:function( jqxhr, textStatus, error ) {
		    	var err = textStatus + ", " + error;
		    	console.log( "Request Failed: " + err );
			}
		});
	}


/* =========================================================================================
 *
 *
 *
 *  FOLLOW ON FUNCTION FROM AJAX CALLS
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 *  MIDDLE BLOCK MARKUP - PRINT BAY INFO
 * ========================================================================================= */

	function print_bay_data( bdata ){
		if( bdata ){
			var mkp = '';
			$.each(bdata, function( i, e ){
				if(e == ''){
					e = 'None given';
				}
				i = "<label>"+i+"</label>";
				mkp += i+" : "+e+"<br>";
			});
			$('#bayInfo').html(mkp);
			open_bay_info_panel();
		}else{
			Messenger().post({
  				message: "Bay data empty",
		  		type: "error"
			});
			close_mdb();
		}
	}

/* =========================================================================================
 *  MAIN BLOCK MARKUP - CREATE A MORRIS GRAPH FROM DATA
 * ========================================================================================= */

	function make_graph(){
		//<!-- CREATE A MASTER ARRAY PLACEHOLDER -->//
        var combined = new Array();
        //<!-- LOOP THROUGH EACH DATASET IN THE GLOABL CONTAINER -->//
		$.each(data_container, function( i, rdata ) {
            $.each(rdata, function( e, value ) {
            	//<!-- CREATE TEMP OBJECT FOR THE VALS WE NEED -->//
				var o = {};
				o[i] = value.count;
				o['time'] = value.time;
				//<!-- PUSH THE TEMP OBJ INTO THE MASTER ARRAY -->//
				combined.push(o);
			});
		});
		//<!-- REMOVE ANY PREVIOUS CHART MARKUP (DOES THIS NEED dom.remove AS WELL) -->//
		$('#myChart').html('');
		//<!-- ATTEMPT TO EMPTY GLOABL OBJECT AS WELL -->//
		graph = null;
		//<!-- IMPLEMENTS morris.js - CREATE A NEW GRAPH -->//
		graph = Morris.Line({
			element: 'myChart',
			data: combined,
			xkey: 'time',
			ykeys: cnt_array,
			labels: dates,
			hideHover: 'always'
		});
		//<!-- IMPLEMENTS messenger.js - SUCCESS MESSGE -->//
		Messenger().post({
			message: "Data loaded",
	  		type: "success"
		});
		//<!-- BRING IN THE CHART AND ADD A CLOSE TO PANEL -->//
		$('#myChart').addClass('show');
		$('#myChart').append('<div id="closeChart"><i class="fa fa-chevron-circle-right"></i></div>');
		//<!-- RESET SOME GLOBALS FOR NEXT TIME -->//
		dates_count    = 0;
		cnt_array      = [0];
		data_container = new Array();
	}

/* =========================================================================================
 *  GLOABAL FUNCTION - CALLED FROM FORM if USING LAT/LNG or l.control.geosearch.js LINE 193
 * ========================================================================================= */

	get_nearby = function (lat, lng){
		//<!-- CLOSE MIDDLE BLOCK -->//
		close_mdb();
		//<!-- REMOVE PREVIOUS CIRCLE IF ANY -->//
		removeCircle();
		//<!-- CREATE A NEW LAYER FOR THE CIRCLE - ONLY LAYERS CAN BE REMOVED NOT FEATURES -->//
		circleLayer = L.mapbox.featureLayer().addTo(Lmap.map);
		//<!-- CREATE A CIRCLE WITH 100M RADIUS, ADD TO LAYER -->//
		var circle = L.circle([lat, lng], 93).addTo(circleLayer);
		//<!-- GO TO CIRCLE -->//
		Lmap.map.setView([lat,lng], 18);
		//<!-- NOW GET ALL THE BAYS IN THAT CIRCLE -->//
		AJAX_GetBaysInCircle(lat, lng);
	}

/* =========================================================================================
 *
 *
 *
 *  UI - CLICKS AND JESTURES
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 *  FORM BUTTON SUBMIT - BAY HISTORY - GET BAY HISTORICAL DATA
 * ========================================================================================= */

	$('#baysearchbutton').click(function(){
		//<!-- DO WE HAVE A BAY -->//
		if(bay){
			//<!-- GET FORM VALUES -->//
			var day   = $('#birthDay').val();
			var month = $('#birthMonth').val();
			var year  = $('#birthYear').val();
			//<!-- PRECEEDING ZEROS PLEASE -->//
			if ( day < 10 ) { day = "0" + "" + day; }
			if ( month < 10 ) { month = "0" + "" + month; }
			//<!-- MAKE A DATE STRIGN AND PLACE IN GLOABL date ARRAY -->//
			var single_date = year +"-"+ month +"-"+ day;
			dates = [single_date];
			//<!-- CALL THE AJAX CALL -->//
			AJAX_GetBayDateTrans();
			//<!-- CLOSE MIDDLE BLOCK -->//
			close_mdb();
		}else{
			Messenger().post({
  				message: "No bay selected",
		  		type: "error"
			});
		}
	});

/* =========================================================================================
 *  FORM BUTTON SUBMIT - DEV -> create circle
 * ========================================================================================= */

	$('#timesearchbutton').click(function(){
		//<!-- GET LOCATION INPUTS -->//
		var lat   = $('#searchLat').val();
		var lng   = $('#searchLng').val();
		var pstcd = $('#searchPostcode').val();
		var bayid = $('#searchBay').val();
		//<!-- GET TIME INPUTS -->//
		var s_day = $('#searchDay').val();
		var s_mon = $('#searchMonth').val();
		var s_hor = $('#searchHour').val();
		var s_min = $('#searchMin').val();
		//<!-- CONSTRUCT DATE -->//
		var defday = "2014-"+s_mon+"-"+s_day+" "+s_hor+":"+s_min;
		//<!-- MAKE IT GLOBAL TOO -->//
		bowday= defday;
		//<!-- IF USING POSTCODE - GEOLOCATE -->//
		if ( pstcd != '' ) {
			//<!-- EXTERNAL FUNCTION - IN l.control.geosearch.js -->//
			if(mapSearch){
				Messenger().post({
	  				message: "Contacting Geocoding service",
			  		type: "success"
				});
				mapSearch.geosearch(pstcd);
			}else{
				Messenger().post({
	  				message: "Geocoding service not avaible",
			  		type: "error"
				});
			}
		//<!-- IF USING LAT LNG - USE DATABASE GEOMETRY -->//
		} else if( (lat != '') && (lng != '') ){	
			get_nearby(lat, lng);
		//<!-- IF USING POSTCODE - GEOLOCATE -->//
		} else if( bayid != '' ){
			if( lat_lng = get_bay_coords(bayid) ){
				get_nearby(lat_lng.lat, lat_lng.lng);
			}
		} else {
			Messenger().post({
  				message: "Please enter some details",
		  		type: "error"
			});
		}

	});


/* =========================================================================================
 *  MAP BUTTON CLICK - A CATCH-ALL
 * ========================================================================================= */

	$('#map').on('click', function(e){
		removeCircle();
	});


/* =========================================================================================
 *  MAKER BUTTON CLICK - PREDICT FOR NOW
 * ========================================================================================= */

	$('#map').on('click', '#bay_now', function(e){
		if($(this).parent().data('bid')){
			bay = $(this).parent().data('bid');
			AJAX_PredictForDate(bowday, 'popup', bay);
		}
	});

/* =========================================================================================
 *  MAKER BUTTON CLICK - PREDICT FOR GIVEN DATE - IS THIS STILL NEEDED ?
 * ========================================================================================= */

	$('#map').on('click', '#bay_date', function(e){
		if($(this).parent().data('bid')){
			bay = $(this).parent().data('bid');

			//<!-- CLEAR OTHER SEARCH INPUTS -->//
			$('#searchLng').val('');
			$('#searchLat').val('');
			$('#searchPostcode').val('');
            
			//<!-- MAKE BAY INPUT BAY ID FROM MARKER -->//
			$('#searchBay').val(bay);

			open_bay_dates_panel();
		}
	});

/* =========================================================================================
 *  MAKER BUTTON CLICK - GET BAY INFO
 * ========================================================================================= */

	$('#map').on('click', '#bay_info', function(e){
		if($(this).parent().data('bid')){
			bay = $(this).parent().data('bid');
			AJAX_GetBayInfo();
		}
	});

/* =========================================================================================
 *  MAKER BUTTON CLICK - ROUTE TO HERE - NOT IMPLMENTED YET - NEEDS geolocate me
 * ========================================================================================= */

	$('#map').on('click', '#bay_route', function(e){
		alert('Route');
	});

/* =========================================================================================
 *  MAKER BUTTON CLICK - HISTORY SEARCH
 * ========================================================================================= */

	$('#map').on('click', '#bay_search', function(e){
		if($(this).parent().data('bid')){
			bay = $(this).parent().data('bid');
			open_bay_search_panel();
		}
	});

/* =========================================================================================
 *  MENU BLOCK CLICK - OPENS MIDDLE BLOCK - USES TABS TO GO TO CORRECT AREA
 * ========================================================================================= */

	$('#menublock').click(function(){
		open_mdb();
	});

/* =========================================================================================
 *  MENU BLOCK CLICK - CLOSES MIDDLE BLOCK
 * ========================================================================================= */

	$('#closeMDB').click(function(){
		close_mdb();
	});
	
/* =========================================================================================
 *  CHART CLOSE BUTTON CLICK - CLOSE CHART
 * ========================================================================================= */

	$('#myChart').on('click', '#closeChart', function(e){
		close_chrt();
	});

/* =========================================================================================
 *
 *
 *
 *  HELPERS
 *
 *
 *
 * ========================================================================================= */

/* =========================================================================================
 * OPEN PANEL - DATES
 * ========================================================================================= */

	function open_bay_dates_panel(){
		$('#menutabs a#t_a').tab('show');
		open_mdb();
	}

/* =========================================================================================
 * OPEN PANEL - HISTORY
 * ========================================================================================= */

	function open_bay_search_panel(){
		$('#searchform').show();
		$('#d .placeholder').hide();
		$('#menutabs a#t_d').tab('show');
		open_mdb();
	}

/* =========================================================================================
 * OPEN PANEL - INFO
 * ========================================================================================= */

	function open_bay_info_panel(){
		$('#b .placeholder').hide();
		$('#menutabs a#t_b').tab('show');
		open_mdb();
	}

/* =========================================================================================
 * MAPS - REMOVE CIRCLE LAYER
 * ========================================================================================= */

	function removeCircle () {
		if(circleLayer){
			circleLayer.clearLayers();
			circleLayer = false;
		}
	}

/* =========================================================================================
 * MAPS - GOTO MARKER ID
 * ========================================================================================= */

	function get_bay_coords(bayid) {
		var lat_lng = {};
		//<!-- LOOP THROUGH ALL MARKERS AND MATCH IDS -->//
		Lmap.markers.eachLayer(function(marker) {
	        if (marker.feature.properties.key == bayid) {
	        	//<!-- GET THE LAN LNG -->//
	        	lat_lng.lat = marker.feature.geometry.coordinates[1];
	        	lat_lng.lng = marker.feature.geometry.coordinates[0];
	        }
	    });
	    return lat_lng;
	}

/* =========================================================================================
 *
 *
 *
 *  SHORTCUTS
 *
 *
 *
 * ========================================================================================= */

	function open_mdb(){
		$('#middleblock').addClass('open');
	}

	function close_mdb(){
		$('#middleblock').removeClass('open');
	}

	function show_chrt(){
		$('#myChart').addClass('show');
	}

	function close_chrt(){
		$('#myChart').removeClass('show');
	}

/* =========================================================================================
 *
 *
 *
 *  FUNCTIONS CALLED ON PAGE LOAD
 *
 *
 *
 * ========================================================================================= */

	AJAX_GetBays();

/* =========================================================================================
 *
 *
 *
 *  DEBUG
 *
 *
 *
 * ========================================================================================= */

	console.log('L0aD3d');

});