function AddFlightDialogController($scope, $mdToast, $mdDialog, adminApi) {
  $scope.autocompleteAirport = adminApi.autocompleteAirport;

  $scope.cancel = function() {
    $mdDialog.cancel();
  }

  $scope.addItinerary = function() {
    var flight = {
      flightnumber: $scope.flightnumber,
      airline: $scope.airline,
      from: $scope.departureAirport.code,
      to: $scope.arrivalAirport.code,
      departure: moment($scope.departureTime).format('YYYY-MM-DD HH:mm:ss'), 
      arrival: moment($scope.arrivalTime).format('YYYY-MM-DD HH:mm:ss'),
    }

    adminApi.addItinerary(
      flight, 
      function(err, newFlight) {
        if (!err) {
          $mdDialog.hide(newFlight);
        } else {
          $mdToast.show($mdToast.simple().textContent("Something went wrong"));
        }
      }
    );
  }

  $scope.loadFlightData = function(flightNumber) {
    adminApi.getFlightInfo(flightNumber, function(err, info) {
      if (!err && info.data.length > 0)
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
      } else {
        $scope.departureAirportName = '';
        $scope.departureAirport = null;
        $scope.arrivalAirportName = '';
        $scope.arrivalAirport = null;
        $scope.airline = '';
        $mdToast.show($mdToast.simple().textContent('Could not find flight'));
      }
    })
  }  

}