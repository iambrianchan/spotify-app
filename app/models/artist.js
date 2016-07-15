var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ArtistSchema = Schema({
	name: String,
	spotifyId: String,
	track: String
});

module.exports = mongoose.model('Artists', ArtistSchema);