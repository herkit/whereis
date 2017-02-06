var map;
  var marker;
  var trackingPath;
  var positions = [];

  function initialize() {
    google.maps.visualRefresh = true;
    var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
      (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));
    if (isMobile) {
      var viewport = document.querySelector("meta[name=viewport]");
      viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
    }
    var mapDiv = document.getElementById('googft-mapCanvas');

    map = new google.maps.Map(mapDiv, {
      center: new google.maps.LatLng(28.538336, -81.379234),
      zoom: 12,
      mapTypeId: 'OSM',
      mapTypeControl: false,
      streetViewControl: false
    });

    map.mapTypes.set("OSM", new google.maps.ImageMapType({
      getTileUrl: function(coord, zoom) {
        // "Wrap" x (logitude) at 180th meridian properly
        var tilesPerGlobe = 1 << zoom;
        var x = coord.x % tilesPerGlobe;
        if (x < 0) x = tilesPerGlobe+x;
        return "http://tile.openstreetmap.org/" + zoom + "/" + x + "/" + coord.y + ".png";
      },
      tileSize: new google.maps.Size(256, 256),
      name: "OpenStreetMap",
      maxZoom: 18
    }));
  }

  var socket = io.connect();

  socket.on('track', function(gps) {
    //console.log('track', gps);
    var latlng = { lat: gps.geo.latitude, lng: gps.geo.longitude };
    var latlon = new LatLon(gps.geo.latitude, gps.geo.longitude);

    positions.push(latlon);

    if (!marker) {
      marker = new google.maps.Marker({ 
        position: latlng, 
        animation: google.maps.Animation.DROP,
        map: map
      });
      map.setCenter(latlng);
    } else {
      marker.setPosition(latlng);
      map.setCenter(latlng);
      if (positions.length >= 2) {
        var lastTwo = positions.slice(-2);
        var d = lastTwo[0].distanceTo(lastTwo[1]);
        console.log("speed", d * 3600 / 2000, "kmh");

        var trackingPathCoordinates = positions.slice(-20).map(function(position) { return { lat: position.lat, lng: position.lon }});
        if(!trackingPath) {
          trackingPath = new google.maps.Polyline({
            path: trackingPathCoordinates,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 0.75,
            strokeWeight: 3
          });
          trackingPath.setMap(map);
        } else {
          trackingPath.setPath(trackingPathCoordinates);
        }
      }

    }
  });

  google.maps.event.addDomListener(window, 'load', initialize);

  function osmCreditClicked(map) {
    credits = document.getElementById('osmcredits');
  
    mapParam = 'map=' + map.getZoom() + '/' +
      map.getCenter().lat() + '/' + map.getCenter().lng();
  
    osmURL = 'http://www.openstreetmap.org/#' + mapParam;
    noteURL = 'http://www.openstreetmap.org/note/new#' + mapParam;
  
    small_credits = '\
      <div style="font-size:0.9em; cursor: pointer;" title="Click to expand OpenStreetMap details"> \
      <img valign="middle" src="http://wiki.openstreetmap.org/w/images/thumb/' +
      '7/79/Public-images-osm_logo.svg/24px-Public-images-osm_logo.svg.png"> \
      <span style="font-size:1.2em; color:BLACK; cursor: hand; opacity: 0.6; filter: alpha(opacity=60); text-shadow: -2px 0 #FFF, 0 2px #FFF, 2px 0 #FFF, 0 -2px #FFF;"> \
      <b>OpenStreetMap</b> base-map</span> \
      </div>';
  
    big_credits = ' \
      <div style="font-size:0.7em; background:WHITE; padding:6px;"> \
      <div style="float:left; padding:2px;"> \
      <a href="' + osmURL + '"> \
      <img src="http://wiki.openstreetmap.org/w/images/thumb/7/79/' +
      'Public-images-osm_logo.svg/64px-Public-images-osm_logo.svg.png" /></a> \
      </div> \
      Base map by <b><a href="' + osmURL + '">OpenStreetMap</a></b>, \
      a free and <a href="http://www.openstreetmap.org/copyright">open \
      licensed (OdBL)</a> map of the world created by volunteers, mapping \
      their own neighbourhoods.<br> \
      <a href="http://www.openstreetmap.org/welcome" title="Welcome to our mapping community">Contribute</a> &nbsp; \
      <a href="http://donate.openstreetmap.org" title="Donate to the OpenStreetMap Foundation">Donate</a> &nbsp; \
      <a href="' + noteURL + '" title="Add a note at this location">Report a problem</a><br> \
      <br> \
      OpenStreetMap displayed here using google maps javascript\
      </div>'
  
    if (credits.innerHTML==small_credits) {
      credits.innerHTML = big_credits;
      credits.style.fontSize = '1.2em';
    } else {
      credits.innerHTML = small_credits;
      credits.style.fontSize = '1em';
    }
  }