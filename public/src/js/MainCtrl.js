// public/js/controllers/MainCtrl.js
angular.module('MainCtrl', []).controller('MainController', ['$scope', '$http', '$window', 'showlist', function($scope, $http, $window, showlist) {
	$scope.location;
	$scope.progress = {selectedVenues: []};
	$scope.auth = function() {
		showlist.authorize()
		.then(function onSuccess(response) {
			$window.location.href = response.data;
		}, function onError(error) {
			console.log(error);
		});	
	};
	$scope.getArtists = function() {
		if ($scope.location == "SFO" || $scope.location == "ATX") {
			showlist.getArtists($scope.location)
			.then(function onSuccess(response) {
				$scope.progress.playlists = response.data.venues;
				$scope.progress.selectedVenues = [];
			}, function onError(error) {
				console.log(error);
			})
		}
		else {
			$window.alert('Please choose a region!');
		}
	}

	$scope.selectPlaylist = function() {
		var index = $scope.progress.selectedVenues.indexOf(this.venue);
		if (index == -1) {
			$scope.progress.selectedVenues.push(this.venue);
		}
		else {
			$scope.progress.selectedVenues.splice(index, 1);
		}
		return;
	}
	$scope.makePlaylists = function () {
		var venues = [];
		for (let i = 0; i < $scope.progress.selectedVenues.length; i++) {
			venues.push($scope.progress.selectedVenues[i].name);
		}
		showlist.makePlaylists(venues)
		.then(function success(response) {
			$window.alert('Successfully added playlists to your account!');
		}, function onError(error) {
			$window.alert('Login first to add selected playlists to your account!');
		})
	}
}]);