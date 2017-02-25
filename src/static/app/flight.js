  LatLon.prototype.toLatLng = function() {
    return { lat: this.lat, lng: this.lon };
  }

  Date.getUtcTimestamp = function() {
    var now = new Date();
    return Math.floor(now.getTime() / 1000 + now.getTimezoneOffset() * 60);
  }

  Date.getUtcTime = function() {
    var now = new Date();
    return Math.floor(now.getTime() + (now.getTimezoneOffset() * 60000));
  }

  function fadeOut(seconds, callback) {
    var object = this;
    var 
      stroke = (object.strokeOpacity * 50)/(seconds*999),
      fadeout = setInterval(
        function() {
          if (object.strokeOpacity <= 0.0) {
            clearInterval(fadeout);
            object.setVisible(false);
            if (typeof (callback) === 'function')
              callback();
            return;
          }
          object.setOptions({
              'strokeOpacity': Math.max(0, object.strokeOpacity-stroke)
          });
        }, 
        50
      );
  }

  google.maps.Polyline.prototype.fadeOut = fadeOut;
 
  function initialize() {

    window.socket.on('flight', function(flightdata) {

      setLocationData([flightdata.flightnumber, flightdata.from.name +  ' to ' + flightdata.to.name, flightdata.airline.name]);

      var lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 4
      };

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
          strokeColor: '#FF0000',
          strokeOpacity: 0.15,
          strokeWeight: 4
        });
      } else {
        whereis.tracking.flightsim.currentPath.setPath(whereis.tracking.flightsim.flightPlan);
      }

      if (!whereis.tracking.flightsim.startIndicator) {
        whereis.tracking.flightsim.startIndicator = new google.maps.Marker({
          icon: {
            path: 'M 6 6 m -6, 0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0',
            fillColor: 'red',
            fillOpacity: 1,
            strokeColor: 'red',
            strokeWeight: 0,
            anchor: new google.maps.Point(6, 6) 
          },
          position: flightdata.from.location,
          map: whereis.map
        })
      } else {
        whereis.tracking.flightsim.startIndicator.setMap(whereis.map);
      }

      if (!whereis.tracking.flightsim.flightPathSoFar) {
        whereis.tracking.flightsim.flightPathSoFar = new google.maps.Polyline({
          path: [ whereis.tracking.flightsim.flightdata.from.location, whereis.tracking.flightsim.flightdata.from.location ],
          geodesic: true,
          strokeOpacity: 0,
          strokeColor: '#FF0000',
          icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '20px'
          }]
        });
      } else {
        whereis.tracking.flightsim.flightPathSoFar.setPath([ whereis.tracking.flightsim.flightdata.from.location, whereis.tracking.flightsim.flightdata.from.location ]);
        whereis.tracking.flightsim.flightPathSoFar.setVisible(true);
      }
      whereis.tracking.flightsim.flightPathSoFar.setMap(whereis.map);
      whereis.tracking.flightsim.currentPath.setMap(whereis.map);

      zoomToObject(whereis.tracking.flightsim.currentPath);
      
      whereis.tracking.flightsim.flightTime = flightdata.to.timestamp - flightdata.from.timestamp;

      whereis.tracking.flightsim.startLatLon = new LatLon(whereis.tracking.flightsim.flightdata.from.location.lat, whereis.tracking.flightsim.flightdata.from.location.lng);
      whereis.tracking.flightsim.endLatLon = new LatLon(whereis.tracking.flightsim.flightdata.to.location.lat, whereis.tracking.flightsim.flightdata.to.location.lng);
      whereis.tracking.flightsim.currentLatLon = new LatLon(whereis.tracking.flightsim.flightdata.from.location.lat, whereis.tracking.flightsim.flightdata.from.location.lng);

      whereis.me.position = whereis.tracking.flightsim.currentLatLon.toLatLng();
      whereis.me.accuracy = 1;
      setMapIndicator();

      whereis.tracking.flightsim.interval = setInterval(function() {
        var currentTime = Date.getUtcTime();
        if (currentTime >= whereis.tracking.flightsim.flightdata.from.timestamp * 1000) {
          var progress = (currentTime - whereis.tracking.flightsim.startTime * 1000) / whereis.tracking.flightsim.flightTime / 1000;
          if (currentTime < whereis.tracking.flightsim.endTime * 1000) {
            whereis.tracking.flightsim.currentLatLon = whereis.tracking.flightsim.startLatLon.intermediatePointTo(whereis.tracking.flightsim.endLatLon, progress);
            var bearing = whereis.tracking.flightsim.currentLatLon.bearingTo(whereis.tracking.flightsim.endLatLon);
            whereis.icons.plane.rotation = bearing;
          } else {
            whereis.tracking.flightsim.currentLatLon = whereis.tracking.flightsim.endLatLon;

            whereis.tracking.flightsim.currentPath.setMap(null);
            setTimeout(function() {
              whereis.tracking.flightsim.flightPathSoFar.setMap(null);
              whereis.tracking.flightsim.startIndicator.setMap(null)
            }, 2500);
          }
          whereis.tracking.flightsim.
          flightPathSoFar.
          setPath([
            whereis.tracking.flightsim.startLatLon.toLatLng(), 
            whereis.tracking.flightsim.currentLatLon.toLatLng()
          ]);

          whereis.me.position = whereis.tracking.flightsim.currentLatLon.toLatLng();
          whereis.me.accuracy = 1;

          if (currentTime > whereis.tracking.flightsim.endTime * 1000) {
            whereis.tracking.mode = whereis.mode.TRACKING;
            clearInterval(whereis.tracking.flightsim.interval);
          }

          setMapIndicator();
        }
      }, 500);
    });  
  }
  google.maps.event.addDomListener(window, 'load', initialize);
