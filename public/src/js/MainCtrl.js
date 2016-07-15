// public/js/controllers/MainCtrl.js
angular.module('MainCtrl', []).controller('MainController', ['$scope', '$http', '$window', 'showlist', function($scope, $http, $window, showlist) {
	$scope.location;
	$scope.progress = {}
	$scope.auth = function() {
		showlist.authorize()
		.then(function onSuccess(response) {
			$window.location.href = response.data;
		}, function onError(error) {
			console.log(error);
		});	
	};
	$scope.getScraped = function() {
		if ($scope.location == "SFO" || $scope.location == "ATX") {
			$scope.progress.initialMessage = "finding artists in the " + $scope.location + " area";
			showlist.scrape($scope.location)
			.then(function onSuccess(response) {
				var artistCount = response.data;
				$scope.progress.artistCountMessage =  artistCount + " artists were found, getting their top tracks. This may take a moment.";
				return $scope.getArtists();
			}, function onError(error) {
				console.log(error);
			});
		}
	}
	$scope.getArtists = function() {
		showlist.getArtists()
		.then(function onSuccess(response) {
			var playlistCount = response.data;
			$scope.progress.playlistCountMessage = "adding " + playlistCount + " playlists to your Spotify account";
			return $scope.makePlaylists();
		}, function onError(error) {
			console.log(error);
		})
	}

	$scope.makePlaylists = function() {
		showlist.makePlaylists()
		.then(function onSuccess(response) {
			$scope.progress.completionMessage = "your account is now updated with playlists for " + $scope.location + " music venues!";
			console.log($scope.progress);
		}, function onError(error) {
			console.log(error);
		})
	}
}]);