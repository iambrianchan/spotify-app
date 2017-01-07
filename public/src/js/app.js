var myApp = angular.module('myApp', ['ngRoute', 'ui.bootstrap', 'angular-google-analytics', 'appRoutes', 'MainCtrl', 'ShowlistService', 'directives']);
myApp.config(['AnalyticsProvider', function (AnalyticsProvider) {

   AnalyticsProvider.setAccount('UA-89957529-2');
}]).run(['Analytics', function(Analytics) { }]);