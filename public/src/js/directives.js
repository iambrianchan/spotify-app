"use strict";

angular.module('directives', [])

.directive('playlists', function($compile) {
	return {
		restrict: 'E',
		replace: true,
		template: "<div class='list'></div>",
		link: function(scope, element, attributes) {
			scope.$watch("progress.playlists", function callback(newValue, oldValue) {
				if (newValue != undefined) {
					var heading = angular.element("<h2 class='heading'>Available Playlists:</h2>");
					element.append(heading);
					var playlistHolder = $compile(angular.element('<div class="playlist" ng-repeat="venue in progress.playlists">{{venue.name}}<ul class="playlist-items" venue-name="{{venue.name}}" ng-click="selectPlaylist()"><li class="artist" artist-name="{{artist.name}}"style="background-image: url({{artist.images[2].url}})" ng-repeat="artist in venue.artists"></li></ul></div>'))(scope);
					element.append(playlistHolder);
				}
			});
		}
	}
})
.directive('inventory', function($compile) {
	return {
		restrict: 'E',
		replace: true,
		template: "<div></div>",
		link: function(scope, element, attributes) {
			scope.$watch("progress.playlists", function callback(newValue, oldValue) {
				if (scope.progress.playlists) {
					if ($(element).children('h2.heading').length == 0) {
						var heading = angular.element('<h2 class="heading"></h2>').text("Selected Playlists");
						element.append(heading);
						var button = $compile(angular.element('<button style="display:block; margin: 0 auto; margin-top:20px; margin-bottom:20px;" ng-click="makePlaylists()">Make Selected Playlists</button>'))(scope);
						if ($(element).find('button').length == 0) {
							element.append(button);
						}
					}
				}
			});
			scope.$watch("progress.selectedVenues", function callback(newValue, oldValue) {
				if (newValue.length > 0) {
					$('uib-accordion').remove();
					var uib = angular.element("<uib-accordion close-others='false'></uib-accordion>");
					var accordionGroups = angular.element('<div><uib-accordion-group class="inventoryitem"heading="{{venue.name}}" ng-repeat="venue in progress.selectedVenues"><ul><li class="artist" artist-name="{{artist.name}}"style="background-image: url({{artist.images[2].url}})" ng-repeat="artist in venue.artists"></li></ul></uib-accordion-group></div>');
					uib = $compile(uib.append(accordionGroups))(scope);
					element.append(uib);
				}
			}, true);
		}
	}
})