  function initialize() {

    window.socket.on('flight', function(flightdata) {

    });
   
    var flightPlan = [{ "lat": 60.1975501, "lng": 11.1004153 }, {"lat": 28.4311577, "lng": -81.308083} ];
    var flightPath = new google.maps.Polyline({
      path: flightPlan,
      geodesic: true,
      strokeColor: '#0000FF',
      strokeOpacity: 0.15,
      strokeWeight: 4
    });
    var flightPathSoFar = new google.maps.Polyline({
      path: [ flightPlan[0], flightPlan[0] ],
      geodesic: true,
      strokeColor: '#0000FF',
      strokeOpacity: 0.85,
      strokeWeight: 4
    });    
    zoomToObject(flightPath);
    flightPath.setMap(map);
    flightPathSoFar.setMap(map);
    var progress = 0;
    var flightStart = new LatLon(flightPlan[0].lat, flightPlan[0].lng);
    var flightEnd = new LatLon(flightPlan[1].lat, flightPlan[1].lng);
    console.log(flightStart, flightEnd);
    var flightPosition = flightStart;

    var bearing;
    var flightInterval = setInterval(function() {
      if (progress < 1) {
        flightPosition = flightStart.intermediatePointTo(flightEnd, progress);
        bearing = flightPosition.bearingTo(flightEnd);
        planeIcon.rotation = bearing;
      } else {
        flightPosition = flightEnd;
        flightPath.setMap(null);
        var flightPathFadeInterval = setInterval(function() {
          flightPathSoFar.setOptions({
            strokeOpacity: flightPathSoFar.strokeOpacity - 0.01
          })
          if (flightPathSoFar.strokeOpacity <= 0) {
            flightPathSoFar.setMap(null);
            cancelInterval(flightPathFadeInterval);
          }
        }, 10);
        progress = 1;
        onflight = false;
      }
      if (onflight)
        window.me.setIcon(planeIcon);
      else 
        window.me.setIcon(harleyIcon);
      setMyPosition({ lat: flightPosition.lat, lng: flightPosition.lon });
      flightPathSoFar.setPath([{lat: flightStart.lat, lng: flightStart.lon}, {lat: flightPosition.lat, lng: flightPosition.lon}])
      if (progress >= 1)
        cancelInterval(flightInterval);
      else
        progress += 0.01;
    }, 500);

    onflight = true;
  }
  google.maps.event.addDomListener(window, 'load', initialize);
