// public/js/controllers/MainCtrl.js
angular.module('MainCtrl', ['ngCookies']).controller('MainController', ['$scope', '$http', '$window', 'showlist', '$cookies', function($scope, $http, $window, showlist, $cookies) {
	$scope.location;
	$scope.progress = {selectedVenues: []};

	// authentication route.
	$scope.auth = function() {
		showlist.authorize()
		.then(function onSuccess(response) {
			$window.location.href = response.data;
		}, function onError(error) {
			console.log(error);
		});	
	};
	
	// retrieves all playlists from backend.
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

	// selects a playlist from the list. selected playlists can be added to the account.
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

	// deselects a playlist.
	$scope.deselectPlaylist = function () {
		var index = $scope.progress.selectedVenues.indexOf(this.venue);
		$scope.progress.selectedVenues.splice(index, 1);
	}

	// make the playlists
	$scope.makePlaylists = function () {
		var venues = [];
		for (var i = 0; i < $scope.progress.selectedVenues.length; i++) {
			venues.push($scope.progress.selectedVenues[i].name);
		}
		showlist.makePlaylists(venues)
		.then(function success(response) {
			$window.alert('Successfully added playlists to your account!');
		}, function onError(error) {
			$window.alert('Login first to add selected playlists to your account!');
		})
	}

	// whether the login button should be shown.
	$scope.showLogin = function() {
		var loggedIn = $cookies.get('Logged In');
		if (loggedIn == 'true') {
			return false;
		}
		return true;
	}

	// whether the selected playlists should be shown.
	$scope.isExpanded = false;
	$scope.expandButton = function() {
		$scope.isExpanded = !$scope.isExpanded;
	}
}]);