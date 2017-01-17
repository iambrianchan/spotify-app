angular.module('ShowlistService', []).factory('showlist', ['$http', function($http) {
	return {
		
		authorize : function() {
			return $http.get('/auth');
		},

		getArtists : function(location) {
			return $http.get('/locations/' + location + '/artists');
		},

		makePlaylists : function (arrayOfVenueNames) {
			var body = {};
			body.venues = arrayOfVenueNames;
			body = JSON.stringify(body);
			var config = {
				method: "POST",
				url: "/playlists",
				data: body,
	 			headers: {'Content-Type': 'application/json'}
			};

			return $http(config);
		}
	};

}]);