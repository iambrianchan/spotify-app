angular.module('ShowlistService', []).factory('showlist', ['$http', function($http) {
	return {
		authorize : function() {
			console.log('auth');
			return $http.get('/auth');
		},

		scrape : function(location) {
			return $http.get('/scrape/locations/' + location);
		},

		getArtists : function() {
			return $http.get('/artists');
		},

		makePlaylists : function() {
			console.log('getPlaylists - service');
			return $http.get('/playlists');
		}
	}
}]);