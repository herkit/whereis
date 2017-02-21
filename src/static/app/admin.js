'use strict';

angular.module('WhereisAdminApp', [
  'ngMaterial', 
  'ngAnimate', 
  'ngAria', 
  'ngMessages', 
  'mdPickers', 
  'angularMoment']);

angular
.module('WhereisAdminApp')
.factory('adminApi', function($http, $mdDialog, $q) {
  var svc = this;
  svc.me = {};

  svc.login = function(callback) {
    $mdDialog.show({
      controller: LoginDialogController,
      templateUrl: 'app/dialogs/login.html',
      parent: angular.element(document.body),
      clickOutsideToClose:true
    })
    .then(
      function(login) {
        $http.
        post('/api/auth', login).
        then(function(response) {
          svc.me = response.data;
          if (typeof callback == 'function')
            callback(null, svc.me);
        }, function(err) {
          if (typeof callback == 'function')
            callback(err);
        });
      }, 
      function(err) {
        if (typeof callback == 'function')
          callback(err);
      }
    );
  };

  svc.autocompleteAirport = function(query) {
    var deferred = $q.defer();
    $http({ 
      url: '/api/autocomplete/airport',
      method: 'post',
      data: { 
        "query": query
      }
    }).
    then(
      function(response) {
        deferred.resolve(response.data);
      },
      function(err) {
        deferred.reject(err);
      }
    );
    return deferred.promise;
  };

  svc.sendCommand = function(command, data, callback) {
    $http.
    post('/api/command/' + command, data).
    then(
      function(result) {
        callback(null, result.data);
      },
      function(err) {
        console.log(err);
        if (err.code === 401) {
          svc.login(function(err) {
            if (!err) 
              svc.sendCommand(command, data, callback); 
          });
        }
      }
    )
  }

  svc.getFlights = function(callback) {
    $http.
    get('/api/flights').
    then(
      function(flights) {
        callback(null, flights.data);
      }, 
      function(err) {
        svc.login(
          function(err) {
            if (!err) 
              svc.getFlights(callback); 
          }
        );
      }
    );
  }

  svc.getFlightInfo = function(flightNumber, callback) {
    $http({
      url: '/api/flights/getdata',
      method: 'get',
      params: { flight_number: flightNumber }
    }).
    then(
      function(data) {
        callback(null, data);
      },
      function(err) {
        svc.login(
          function(err) {
            if (!err) 
              svc.getFlightInfo(flightNumber, callback); 
          }
        ); 
      }
    );
  }

  svc.addItinerary = function(flight, callback) {
    $http.
    post('/api/flights', flight).
    then(
      function(result) {
        callback(null, result.data);
      },
      function(err) {
        svc.login(
          function(err) {
            if (!err)
              svc.addItinerary(flight, callback);
          }
        );
      }
    );
  }

  return svc;
})

angular
.module('WhereisAdminApp')
.controller('SettingsCtrl', 
  function($scope, $mdToast, adminApi) {
    var ctrl = this;
    $scope.privacymode = false;
    $scope.devices = [
      {
        id: '087073819397',
        description: 'GPS tracker',
        poweredby: 'whereversim',
        lasttrack: moment(),
        active: true
      },
      {
        id: '738689',
        description: 'Xperia Z',
        poweredby: 'android',
        lasttrack: moment(),
        active: true
      }
    ]
  }
);


angular
.module('WhereisAdminApp')
.controller('FlightsCtrl',
  function($scope, $mdToast, $mdDialog, adminApi) {
    var ctrl = this;
    $scope.from = '';
    $scope.flights = [];
    $scope.autocompleteAirport = adminApi.autocompleteAirport;
    $scope.today = Date.now();
    /*$scope.departureAirport = { code: '', name: '' };
    $scope.arrivalAirport = { code: '', name: '' };*/

    function sendStartFlightCommand(flight) {
      adminApi.sendCommand('startflight', { id: flight.id }, function(err, result) {
        if (err)
          $mdToast.show($mdToast.simple().textContent("Unable to start flight"));
        else
          $mdToast.show($mdToast.simple().textContent("Starting flight"));
      })
    };

    $scope.startFlight = function(flight) {
      if (flight.from.timestamp > Date.now() / 1000 + 3600) 
      {
        var timeString = new Date(flight.from.timestamp * 1000).toISOString()
        var confirm = $mdDialog.confirm()
          .title('Do you really want to start this flight?')
          .textContent(flight.from.name + ' - ' + flight.to.name + ' ' + timeString + "\nThis flight is more than one hour away, are you sure you want to start it?")
          .ariaLabel('Start flight')
          .ok('Yes, ofcourse!')
          .cancel('No, I misclicked...');

        $mdDialog.show(confirm).then(
          function() {
            sendStartFlightCommand(flight);
          }, 
          function() {
            $mdToast.show($mdToast.simple().textContent("Canceled start flight command"));
          }
        );
      }
      else
        sendStartFlightCommand(flight);
    }
    
    $scope.addItinerary = function() {
      var flight = {
        flightnumber: $scope.flightnumber,
        airline: $scope.airline,
        from: $scope.departureAirport.code,
        to: $scope.arrivalAirport.code,
        departure: $scope.departureTime.toISOString(),
        arrival: $scope.arrivalTime.toISOString(),
      }

      adminApi.addItinerary(
        flight, 
        function(err, newFlight) {
          if (!err) {
            loadFlights();
          }
        }
      );
    }

    $scope.newFlight = function() {
      $mdDialog.show({
        controller: AddFlightDialogController,
        templateUrl: '/app/dialogs/addflight/addflight.html',
        parent: angular.element(document.body),
        fullscreen: true,
        clickOutsideToClose:true
      })
      .then(
        function(newFlight) {
          loadFlights();
          $mdToast.show($mdToast.simple().textContent("Flight added"));
        },
        function() {
          $mdToast.show($mdToast.simple().textContent("Add flight canceled"));
        }
      )

    }

    $scope.loadFlightData = function(flightNumber) {
      adminApi.getFlightInfo(flightNumber, function(err, info) {
        if (!err)
        {
          $scope.departureAirportName = info.data[0].departure;
          $scope.departureAirport = $scope.departureAirport || {};
          $scope.departureAirport.code = info.data[0].departure;
          $scope.departureAirport.name = info.data[0].departure;
          $scope.arrivalAirportName = info.data[0].arrival;
          $scope.arrivalAirport = $scope.arrivalAirport || {};
          $scope.arrivalAirport.code = info.data[0].arrival;
          $scope.arrivalAirport.name = info.data[0].arrival;
          $scope.airline = info.data[0].airline[0];
        }
      })
    }

    function loadFlights() {
      adminApi.getFlights(
        function(err, flights) {
          if (!err) {
            $scope.flights = flights.map(function(flight) {
              flight.from.localtime = flight.from.timestamp + (flight.from.timezone.dstOffset || 0) + (flight.from.timezone.rawOffset || 0);
              flight.to.localtime = flight.to.timestamp + (flight.to.timezone.dstOffset || 0) + (flight.to.timezone.rawOffset || 0);
              flight.duration = flight.to.timestamp - flight.from.timestamp;
              return flight;
            });
          }
          
        }
      );
    }

    loadFlights();
  }
);

angular
.module('WhereisAdminApp')
.filter('wiTimeSpan', 
  function() {
    return function(seconds, padded) {
      var steps = [
        { denom: 'd', factor: 86400, modulo: 0 },
        { denom: 'h', factor: 3600, modulo: 60 },
        { denom: 'm', factor: 60, modulo: 60 },
        { denom: 's', factor: 1, modulo: 60 }
      ];

      var parts = steps.map(
        (step) => {
          var val = Math.floor(seconds / step.factor);
          var strval = val;
          if (step.modulo > 0)
          {
            val = val % step.modulo;
            if (padded)
              strval = ('000000' + val).slice(-step.modulo.toString().length);
            else
              strval = val;
          } else {
            strval = val;
          }


          return { value: val, strval: strval + step.denom };
        }
      )

      while(parts[0].value == 0)
        parts.shift();

      while(parts[parts.length - 1].value == 0)
        parts.pop();

      return parts.map((part) => { return part.strval; }).join("\u00a0");
    }
  }
);


function LoginDialogController($scope, $mdDialog) {

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.login = function() {
    $mdDialog.hide({ username: $scope.username, password: $scope.password });
  };
}