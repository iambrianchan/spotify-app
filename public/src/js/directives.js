"use strict";

angular.module('directives', [])

.directive('playlists', function($compile) {
	return {
		restrict: 'E',
		replace: true,
		template: "<div class='list'></div>",
		link: function(scope, element, attributes) {
			scope.$watch("progress.playlists", function callback(newValue, oldValue) {
				if (newValue != undefined && $(element).find('h2.heading').length == 0) {
					var heading, playlistHolder;
					heading = angular.element("<h2 class='heading'>Available Playlists:</h2>");
					element.append(heading);
					playlistHolder = $compile(angular.element('<div class="playlist" ng-repeat="venue in progress.playlists">{{venue.name}}<ul class="playlist-items" venue-name="{{venue.name}}" ng-click="selectPlaylist()"><li class="artist" artist-name="{{artist.name}}"style="background-image: url({{artist.images[2].url}})" ng-repeat="artist in venue.artists"></li></ul></div>'))(scope);
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
						var addButton, selectContainer, selectAll, deselectAll, heading, toggleButton, accordion, accordionGroups, container;
						selectContainer = angular.element("<div></div>").addClass("selectcontainer")
						selectAll = $compile(angular.element("<button ng-click='selectAll()'></button>").text("Select All"))(scope);
						deselectAll = $compile(angular.element("<button ng-click='deselectAll()'></button>").text("Deselect All"))(scope);
						toggleButton = $compile(angular.element("<button class='togglebutton' ng-click='expandButton()'><span ng-class=\"{'glyphicon glyphicon-chevron-left': !isExpanded, 'glyphicon glyphicon-chevron-right': isExpanded}\"></span></button>"))(scope);
						heading = angular.element('<h2 class="heading"></h2>').text("Selected Playlists");
						addButton = $compile(angular.element('<button style="display:block; margin: 0 auto; margin-top:20px; margin-bottom:20px;" ng-click="makePlaylists()">Make Selected Playlists</button>'))(scope);
						accordion = angular.element("<uib-accordion close-others='false'></uib-accordion>");
						accordionGroups = angular.element('<div><uib-accordion-group style="text-align:center"class="inventoryitem"heading="{{venue.name}}" ng-repeat="venue in progress.selectedVenues"><ul><li class="artist" artist-name="{{artist.name}}"style="background-image: url({{artist.images[2].url}})" ng-repeat="artist in venue.artists"></li></ul></uib-accordion-group></div>');
						accordion = $compile(accordion.append(accordionGroups))(scope);
						container = $compile(angular.element("<div class='inventorycontent' ng-class={'expanded':isExpanded}></div>"))(scope);
						selectContainer.append(selectAll).append(deselectAll);
						container.append(heading).append(selectContainer).append(addButton).append(accordion);
						element.append(container).append(toggleButton);
					}
				}
			});
		}
	}
})