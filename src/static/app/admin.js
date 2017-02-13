'use strict';

angular.module('WhereisAdminApp', ['ngMaterial', 'angularMoment']);

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
    then(function(flights) {
      callback(null, flights.data);
    }, function(err) {
      svc.login(function(err) {
        if (!err) 
          svc.getFlights(callback); 
      });
    });
  }

  return svc;
})

angular
.module('WhereisAdminApp')
.controller('FlightsCtrl',
  function($scope, $mdToast, $mdDialog, adminApi) {
    var ctrl = this;
    $scope.from = '';
    $scope.flights = [];
    $scope.autocompleteAirport = adminApi.autocompleteAirport;

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
    adminApi.getFlights(function(err, flights) {
      console.log(err, flights);
      if (!err)
        $scope.flights = flights;
    });
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