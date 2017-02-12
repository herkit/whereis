'use strict';

angular.module('WhereisAdminApp', ['ngMaterial']);

angular
.module('WhereisAdminApp')
.factory('adminApi', function($http, $mdDialog) {
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
        then(function(me) {
          svc.me = me;
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
  function($scope, adminApi) {
    var ctrl = this;
    $scope.flights = [];
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