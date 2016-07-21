var mongoose = require('mongoose');
var artist = require('./artist');
var Schema = mongoose.Schema;

var ArtistSchema = new Schema({
	name: String,
	spotifyArtistId: String,
	track: String,
	images: []
});

var VenueSchema = new Schema({
	name: String,
	artists: [ArtistSchema]
})

var PlaylistSchema = new Schema({
	name: String,
	venues: [VenueSchema],
	date: Date,
});

module.exports = mongoose.model('Playlists', PlaylistSchema);