// public/js/appRoutes.js
    angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider
        .when('/', {
            templateUrl: 'src/views/partials/home.html',
            controller: 'MainController'
        })
        .otherwise('/');
    $locationProvider.html5Mode(true);

}]);