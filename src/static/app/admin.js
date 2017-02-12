'use strict';

angular.module('WhereisAdminApp', ['ngMaterial']);

angular
.module('WhereisAdminApp')
.factory('auth', function($http, $mdDialog) {
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
  return svc;
})

angular
.module('WhereisAdminApp')
.controller('FlightsCtrl',
  function($scope, $http, auth) {
    var ctrl = this;

    ctrl.loadFlights = function() {
      $http.get('/api/flights').then(function(flights) {
        $scope.flights = flights.data;
      }, function(err) {
        auth.login(function(err) { if (!err) ctrl.loadFlights(); });
      });  
    }
    
    ctrl.loadFlights();
  }
)

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