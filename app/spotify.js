var artistsSchema = require('./models/artist');
var playlistsSchema = require('./models/playlist');

var spot = {};

// Get the current user id.
spot.getCurrentUser = async function(spotifyApi) {
	return new Promise(function(resolve, reject) {
		spotifyApi.getMe()
			.then(function(data) {
				resolve(data.body.id);
			}, function(error) {
				reject(Error('An error occurred getting the current user.'));
			});
	});
};

// subscribe the user to a spotify playlist
spot.subscribePlaylist = async function(spotifyApi, venue) {
	return new Promise((resolve, reject) => {
		spotifyApi.followPlaylist(venue.spotifyPlaylistId, {'public': true})
			.then((data) => {
				resolve(data.statusCode);
			})
			.catch((error) => {
				console.log(error);
				reject(error);
			})
	})
};

module.exports = spot;