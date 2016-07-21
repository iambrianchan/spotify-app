var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ArtistSchema = Schema({
	name: String,
	spotifyArtistId: String,
	track: String,
	images: []
});

module.exports = mongoose.model('Artists', ArtistSchema);