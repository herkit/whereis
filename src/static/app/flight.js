  LatLon.prototype.toLatLng = function() {
    return { lat: this.lat, lng: this.lon };
  }

  Date.getUtcTimestamp = function() {
    var now = new Date();
    return Math.floor(now.getTime() / 1000 + now.getTimezoneOffset() * 60);
  }


  google.maps.Polyline.prototype.fadeOut = function(seconds, callback) {
    var polyline = this;
    var stroke = (this.strokeOpacity*50)/(seconds*999),
        fadeout = setInterval(
          function() {
            if (polyline.strokeOpacity <= 0.0) {
              clearInterval(fadeout);
              polyline.setVisible(false);
              if (typeof (callback) === 'function')
                callback();
              return;
            }
            polyline.setOptions({
                'strokeOpacity': Math.max(0, polyline.strokeOpacity-stroke)
            });
          }, 
          50
        );
  }
 
  function initialize() {

    window.socket.on('flight', function(flightdata) {

      setLocationData([flightdata.flightnumber, flightdata.from.name +  ' to ' + flightdata.to.name, flightdata.airline.name]);

      if (!whereis.tracking.flightsim)
        whereis.tracking.flightsim = {};
      whereis.tracking.mode = whereis.mode.FLIGHT;
      whereis.tracking.flightsim.flightdata = flightdata;
      whereis.tracking.flightsim.startTime = flightdata.from.timestamp;
      whereis.tracking.flightsim.endTime = flightdata.to.timestamp;
      showPoweredBy();

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

      whereis.tracking.flightsim.startLatLon = new LatLon(whereis.tracking.flightsim.flightdata.from.location.lat, whereis.tracking.flightsim.flightdata.from.location.lng);
      whereis.tracking.flightsim.endLatLon = new LatLon(whereis.tracking.flightsim.flightdata.to.location.lat, whereis.tracking.flightsim.flightdata.to.location.lng);
      whereis.tracking.flightsim.currentLatLon = new LatLon(whereis.tracking.flightsim.flightdata.from.location.lat, whereis.tracking.flightsim.flightdata.from.location.lng);

      setMyPosition(whereis.tracking.flightsim.currentLatLon.toLatLng(), whereis.icons.plane)

      whereis.tracking.flightsim.interval = setInterval(function() {
        var currentTime = Date.getUtcTimestamp();
        if (currentTime >= whereis.tracking.flightsim.flightdata.from.timestamp) {
          var progress = (currentTime - whereis.tracking.flightsim.startTime) / whereis.tracking.flightsim.flightTime;
          if (currentTime < whereis.tracking.flightsim.endTime) {
            whereis.tracking.flightsim.currentLatLon = whereis.tracking.flightsim.startLatLon.intermediatePointTo(whereis.tracking.flightsim.endLatLon, progress);
            var bearing = whereis.tracking.flightsim.currentLatLon.bearingTo(whereis.tracking.flightsim.endLatLon);
            whereis.icons.plane.rotation = bearing;
          } else {
            whereis.tracking.flightsim.currentLatLon = whereis.tracking.flightsim.endLatLon;

            whereis.tracking.flightsim.currentPath.setMap(null);
            whereis.tracking.flightsim.flightPathSoFar.fadeOut(1);
            onflight = false;
          }
          whereis.tracking.flightsim.
          flightPathSoFar.
          setPath([
            whereis.tracking.flightsim.startLatLon.toLatLng(), 
            whereis.tracking.flightsim.currentLatLon.toLatLng()
          ]);

          setMyPosition(whereis.tracking.flightsim.currentLatLon.toLatLng(), whereis.icons.plane);
          if (currentTime > whereis.tracking.flightsim.endTime) {
            whereis.tracking.mode = whereis.mode.TRACKING;
            clearInterval(whereis.tracking.flightsim.interval);
          }
        }
      }, 500);
    });  
  }
  google.maps.event.addDomListener(window, 'load', initialize);
