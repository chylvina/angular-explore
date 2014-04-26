var app = angular.module('plunker', []);

app.controller('MainCtrl', function($scope) {
  $scope.name = 'World';
});

var $injector = angular.injector();
$injector.get('$injector');

