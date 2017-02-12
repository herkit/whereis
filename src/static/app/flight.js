  LatLon.prototype.toLatLng = function() {
    return { lat: this.lat, lng: this.lon };
  }

  function initialize() {

    window.socket.on('flight', function(flightdata) {
      if (!whereis.tracking.flightsim)
        whereis.tracking.flightsim = {};
      whereis.tracking.flightsim.flightdata = flightdata;
      whereis.tracking.flightsim.startTime = flightdata.from.timestamp;
      whereis.tracking.flightsim.endTime = flightdata.to.timestamp;

      whereis.tracking.flightsim.flightPlan = [flightdata.from.location, flightdata.to.location];
      if (!whereis.tracking.flightsim.currentPath)
      {
        whereis.tracking.flightsim.currentPath = new google.maps.Polyline({
          path: whereis.tracking.flightsim.flightPlan,
          geodesic: true,
          strokeColor: '#0000FF',
          strokeOpacity: 0.15,
          strokeWeight: 4
        });
      } else {
        whereis.tracking.flightsim.currentPath.setPath(whereis.tracking.flightsim.flightPlan);
      }
      if (!whereis.tracking.flightsim.flightPathSoFar) {
        whereis.tracking.flightsim.flightPathSoFar = new google.maps.Polyline({
          path: [ whereis.tracking.flightsim.flightdata.from.location, whereis.tracking.flightsim.flightdata.from.location ],
          geodesic: true,
          strokeColor: '#0000FF',
          strokeOpacity: 0.85,
          strokeWeight: 4
        });
      } else {
        whereis.tracking.flightsim.flightPathSoFar.setPath([ whereis.tracking.flightsim.flightdata.from.location, whereis.tracking.flightsim.flightdata.from.location ]);
      }
      whereis.tracking.flightsim.flightPathSoFar.setMap(whereis.map);
      whereis.tracking.flightsim.currentPath.setMap(whereis.map);

      zoomToObject(whereis.tracking.flightsim.currentPath);
      
      whereis.tracking.flightsim.flightTime = flightdata.to.timestamp - flightdata.from.timestamp;

      var currentTime = Date.now() / 1000;
      if (currentTime > flightdata.from.timestamp) {
        whereis.tracking.mode = "flight";

        whereis.tracking.flightsim.startLatLon = new LatLon(whereis.tracking.flightsim.flightdata.from.location.lat, whereis.tracking.flightsim.flightdata.from.location.lng);
        whereis.tracking.flightsim.endLatLon = new LatLon(whereis.tracking.flightsim.flightdata.to.location.lat, whereis.tracking.flightsim.flightdata.to.location.lng);
        whereis.tracking.flightsim.currentLatLon = new LatLon(whereis.tracking.flightsim.flightdata.from.location.lat, whereis.tracking.flightsim.flightdata.from.location.lng);

        whereis.tracking.flightsim.interval = setInterval(function() {
          currentTime = Date.now() / 1000;
          var progress = (currentTime - whereis.tracking.flightsim.startTime) / whereis.tracking.flightsim.flightTime;
          if (currentTime < whereis.tracking.flightsim.endTime) {
            whereis.tracking.flightsim.currentLatLon = whereis.tracking.flightsim.startLatLon.intermediatePointTo(whereis.tracking.flightsim.endLatLon, progress);
            var bearing = whereis.tracking.flightsim.currentLatLon.bearingTo(whereis.tracking.flightsim.endLatLon);
            whereis.icons.plane.rotation = bearing;
          } else {
            whereis.tracking.flightsim.currentLatLon = whereis.tracking.flightsim.endLatLon;

            whereis.tracking.flightsim.currentPath.setMap(null);
            var flightPathFadeInterval = setInterval(function() {
              whereis.tracking.flightsim.flightPathSoFar.setOptions({
                strokeOpacity: whereis.tracking.flightsim.flightPathSoFar.strokeOpacity - 0.01
              })
              if (whereis.tracking.flightsim.flightPathSoFar.strokeOpacity <= 0) {
                whereis.tracking.flightsim.flightPathSoFar.setMap(null);
                cancelInterval(flightPathFadeInterval);
              }
            }, 10);
            onflight = false;
          }
          if (onflight)
            whereis.me.marker.setIcon(whereis.icons.plane);
          else 
            whereis.me.marker.setIcon(whereis.icons.harley);

          whereis.tracking.flightsim.
          flightPathSoFar.
          setPath([
            whereis.tracking.flightsim.startLatLon.toLatLng(), 
            whereis.tracking.flightsim.currentLatLon.toLatLng()
          ]);

          setMyPosition(whereis.tracking.flightsim.currentLatLon.toLatLng());
          if (currentTime > whereis.tracking.flightsim.endTime) {
            whereis.tracking.mode = 'tracking';
            cancelInterval(whereis.tracking.flightsim.interval);
          }
        }, 500);

        onflight = true;
      }
    });  
  }
  google.maps.event.addDomListener(window, 'load', initialize);
