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

// Get the current user's playlists.
spot.getAllCurrentUserPlaylists = async function(spotifyApi, userId) {
	return new Promise(function(resolve, reject) {
		spotifyApi.getUserPlaylists(userId, {limit: 50})
			.then(function(data) {
				resolve(data.body.items);
			}, function(error) {
				resolve(Error('An error occurred getting the current user\'s playlists.'));
			});
	});
};

// Create a playlist on the current user's account
spot.createUserPlaylist = async function(spotifyApi, userId, playlist, location) {
	return new Promise(function(resolve, reject) {
		let playlistName = playlist.name + ", " + location;
		spotifyApi.createPlaylist(userId, playlistName, {'public': true})
			.then(function(data) {
				playlist.spotifyPlaylistId = data.body.id;
				resolve(playlist);
			}, function(error) {
				resolve(Error('An error occurred creating a user playlist.'));
			});
	});
};

// Replace all tracks in a playlist with ones supplied in playlist array.
spot.replaceAllTracksInPlaylist = async function(spotifyApi, userId, playlist) {
	return new Promise(function(resolve, reject) {
		let tracks = playlist.artists.map(function(artist) {
			return artist.track.trackUri;
		});

		if (playlist.spotifyPlaylistId) {
			spotifyApi.replaceTracksInPlaylist(playlist.spotifyPlaylistId, tracks)
				.then(function(data) {
					resolve('Successfully replaced tracks in playlist.');
				}, function(error) {
					resolve(Error('An error occured replacing tracks in an existing user playlist.'));
				});
		}
	});
};

module.exports = spot;