var map;
  var marker;
  var trackingPath;
  var positions = [];
  var locationDiv;

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

    locationDiv = document.getElementById('currentLocation');

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

    if (gps.address) {
      locationDiv.innerHTML = '<h1>' + gps.address.settlement + '</h1><span class="sub">' + gps.address.district + ", " + gps.address.state_long + ", " + gps.address.country_long + '</span>';
    }

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
        var speed = d * 3600 / 2000;

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
      <span style="font-size:0.8em; color:BLACK; cursor: hand; opacity: 0.6; filter: alpha(opacity=60); text-shadow: -2px 0 #FFF, 0 2px #FFF, 2px 0 #FFF, 0 -2px #FFF;">Powered by</span><br/> \
      <img src="img/wherever.png" style="height:24px; width: auto" /> \
      </div>';
  
    credits.innerHTML = small_credits;
    credits.style.fontSize = '1em';
  }