"use strict";
var request = require('request');
var Q = require('q');
var CronJob = require('cron').CronJob;
var session = require('express-session');
var redis = require("redis");
var RedisStore = require('connect-redis')(session);

// import mongoose models and js
var artists = require('./models/artist');
var playlistsdb = require('./models/playlist');
var scraper = require('./scraper');
var spotifyApi = require('./spotifyapi');

// import environment configuration
var config = require('./../env.json').production;
var client_id = config.CLIENT_ID;
var client_secret = config.CLIENT_SECRET;
var redirect_uri = config.REDIRECT_URI;

// create redis client
var options = {
	host: config.REDIS_SERVER,
	port: config.REDIS_PORT,
	password: config.REDIS_PASS
};
var client = redis.createClient(options);

// the venue object will hold three properties: name, artists, and spotifyPlaylistId.
// the venue object uses four functions from spotifyApi.
var venue = function(name) {
	this.name = name;
	this.artists = [];
	return this;
}
venue.prototype.addArtists = function(artists) {
	if (artists.length != 0 && artists.length != undefined) {
		for (let i = 0; i < artists.length; i++) {
			var newArtist = new artist(artists[i].name, artists[i].track);
			this.artists.push(newArtist);
		}
	}
	else {
		var keys = Object.keys(artists);

		for (let i = 0; i < keys.length; i++) {
			var newArtist = new artist(keys[i]);
			this.artists.push(newArtist);
		};
	}
	return;
};
venue.prototype.removeAllTracks = spotifyApi.removeAllTracks;
venue.prototype.getAllTracks = spotifyApi.getAllTracks;
venue.prototype.addAllTracks = spotifyApi.addAllTracks;
venue.prototype.createPlaylist = spotifyApi.createPlaylist;


// the artist object will hold four properties: name, track, images, spotifyArtistId.
// the artist object uses six methods, five from spotifyApi.
var artist = function(name, track) {
	this.name = name;
	if (track) {
		this.track = track;
	}
	this.setTrackData = function(trackData) {
		this.track = trackData.track;
		this.images = trackData.images;
		return;
	}
}
artist.prototype.getArtistId = spotifyApi.getArtistId;
artist.prototype.getTopTrack = spotifyApi.getTopTrack;
artist.prototype.getArtist = spotifyApi.getArtist;
artist.prototype.addArtist = spotifyApi.addArtist;
artist.prototype.updateWithSpotifyData = function(artistModel) {
	if (!artistModel) {
		artistModel = null;
	}
	this._id = artistModel != null ? artistModel._id : null;
	this.spotifyArtistId = artistModel != null ? artistModel.spotifyArtistId : null;
	this.track = artistModel.track != null ? artistModel.track : null;
	this.images = artistModel.images != null ? artistModel.images : null;
	return;
}


// use the imported scraper from ./scraper.
var scrape = function() {

	// utility function for removing venues with few listed artists.
	function filterPlaylist(playlist) {
		var venues = Object.keys(playlist);
		for (let i = venues.length - 1; i >= 0; i--) {
			let artists = Object.keys(playlist[venues[i]].artists).length;
        	if (artists < 10) {
        		delete playlist[venues[i]];
        	}
        };
        return playlist;
	};

	function getScrapedArtists (location, access_token) {
		var deferred = Q.defer();
		if (location == "ATX") {
		    scraper.atxScraper.run(function onComplete(result) {
		        var playlist = {};
		        for (let i = 0; i < result.length; i++) {
		            let date = result[i];
		            let venues = Object.keys(result[i].shows);
		            for (let j = 0; j < venues.length; j++) {
		                let venue = venues[j];

		                if (playlist[venue] === undefined) {
		                    playlist[venue] = {artists: date.shows[venue]};
		                }
		                else {
		                    var artists = Object.keys(date.shows[venue]);
		                    // check to see if an artist is already listed in this venue
		                    for (let k = 0; k < artists.length; k++) {
		                        let artist = artists[k];
		                        if (playlist[venue].artists[artist] == undefined) {
		                            playlist[venue].artists[artist] = {};
		                        };
		                    };
		                }
		            }
		        }
		        playlist = filterPlaylist(playlist);
		        deferred.resolve(playlist);
		    });
		}

		else if (location == "SFO") {
		  	scraper.sfScraper.run(function onComplete(result) {
		  		var playlist = {};
		  		var venues = Object.keys(result);

		  		for (let i = 0; i < venues.length; i++) {
		  			let venue = venues[i];
		  			playlist[venue] = {artists:{}};

		  			for (let j = 0; j < result[venue].length; j++) {
		  				let artist = result[venue][j];
		  				playlist[venue].artists[artist] = {};
		  			}
		  		};
		        playlist = filterPlaylist(playlist);
		        deferred.resolve(playlist);
	    	});
		}
		return deferred.promise;
	};
	function main() {
		return Q.fcall(function() {
			return getScrapedArtists(location, access_token);
		})
		.then(function(result) {
			playlist = result;
			return;
		})
	};

	function automateATXScrape () {
		return Q.fcall(function() {
			return getScrapedArtists('ATX')
			.then(function(result) {
				return {name: 'ATX', venues: result};
			})
		});
	};
	function automateSFOScrape() {
		return Q.fcall(function() {
			return getScrapedArtists('SFO')
			.then(function(result) {
				return {name: 'SFO', venues: result}
			})
		});
	};

	function automateBothScrapes() {
		var arry = [];
		return Q.fcall(function() {
			return automateATXScrape()
			.then(function(result) {
				arry.push(result);
				return automateSFOScrape()
				.then(function(result) {
					arry.push(result);
					return arry;
				});
			});
		});
	};

	return {
		getScrape : main,
		automateScrapes : automateBothScrapes
	};
}();

// module that is used to get spotify artist data.
var musicians = function(access_token) {

// this function is used in daily chrono job.
	function updateDatabase(access_token, data) {
		var venues = Object.keys(data);
		for (let i = 0; i < venues.length; i++) {
			let venueName = venues[i];
			let newVenue = new venue(venueName);
			let artists = data[venueName].artists;
			newVenue.addArtists(artists);
			venues[i] = newVenue;
		};
		return Q.all(
			venues.map(function forVenues(venue) {
				return Q.all(venue.artists.map(function forArtists(artist) {
	    			return Q(artists.findOne({name: artist.name}).exec())
	    			.then(function callback(result) {
	    				if (result) {
	    					return result;
	    				}
	  					else {
	  						return artist.addArtist(access_token);
	  					}
	    			})
				}))
				.then(function(results) {
					for (let i = results.length - 1; i >= 0; i--) {
						if (results[i] == null) {
							results.splice(i, 1)
						}
					}
					venue.artists = results;
					return venue;
				});
			})
		)
		.then(function() {
			return removeAllDuplicatesFromDatabase();
		})
		.then(function() {
			return venues;
		})

		// removing duplicates from the database is necessary because searching for artists is run in parallel.
		// if an artist is found to be in more than one venue, it will be added more than once.
		function removeAllDuplicatesFromDatabase() {
			return Q.fcall(function() {
		    	return Q(artists.find({}).exec());
			})
			.then(function(results) {
				var uniqueArtists = {};
				var dupes = [];
				for (let i = 0; i < results.length; i++) {
					if (uniqueArtists[results[i].name] == undefined) {
						uniqueArtists[results[i].name] = true;					
					}
					else {
						dupes.push(results[i]['_id']);
					}
				}
				return removeDuplicates(dupes)
			})

			// function that takes an array of duplicate artists and removes them from db based on _id.
			function removeDuplicates(idArray) {
				return Q(artists.remove({ _id: {$in : idArray}}).exec());
			}
		}	
	}
	return {
		updateArtists: updateDatabase
	}
}();

var playlists = function() {

// this is a long method. first the user id is retrieved. then a request to get all playlists. then set playlist id for any matches.
// it is also important to remove tracks to prevent duplicates in playlist. new playlists are created for those that are not found, and finally tracks are added.
	function main(access_token, arrayOfIndexesToUpdate, location) {
		var spotifyUserId;
		// retrieve spotify user id.
		return Q.fcall(function retrieveUserId() {
			return spotifyApi.getSpotifyUserId(access_token);
		})
		// retrieve all user playlists.
		.then(function searchForAllPlaylists(userId) {
			spotifyUserId = userId;
			return spotifyApi.getAllUserPlaylists(access_token);
		})
		// set the spotifyPlaylistId for all matching playlists.
		.then(function onSuccess(arrayOfSpotifyPlaylists) {
			arrayOfIndexesToUpdate.map(function addSpotifyPlaylistIdToMatchingVenues(venue) {
				for (let i = 0; i < arrayOfSpotifyPlaylists.length; i++) {
					let thePlaylist = arrayOfSpotifyPlaylists[i];
					if (thePlaylist.name == location + " - " + venue.name) {
						var spotifyPlaylistId = thePlaylist.id;
						venue.spotifyPlaylistId = spotifyPlaylistId;
						return venue;
					}
				}
				return venue;
			})
		})
		// retrieve array of all tracks from each playlist that is being updated.
		// remove all tracks from a playlist being updated if it contains tracks.
		.then(function removeSpotifyTracks() {
	        return Q.all(arrayOfIndexesToUpdate.map(function(venue) {
	            return venue.getAllTracks(access_token, spotifyUserId)
	            .then(function removeTracks(items) {
	            	if (items) {
	            		return venue.removeAllTracks(access_token, spotifyUserId, items);
	            	}
	            })
	        }))	
		})
		// create any playlists that do not exist yet.
	    .then(function createAllPlaylists() {
	        return Q.all(arrayOfIndexesToUpdate.map(function(venue, index) {
	        	var deferred = Q.defer();
	        	setTimeout(function createThePlaylist() {
		            if (venue.spotifyPlaylistId) {
		            	deferred.resolve(venue.spotifyPlaylistId);
		            }
		            else {
		                deferred.resolve(venue.createPlaylist(access_token, spotifyUserId, location));                  		
		            };
	        	}, index * 1000);

	        	return deferred.promise;
	        }))
	        // add spotify playlist id to each venue.
	        .then(function setTheSpotifyPlaylistId(result) {
	        	for (let i = 0; i < result.length; i++) {
	        		arrayOfIndexesToUpdate[i].spotifyPlaylistId = result[i];
	        	}
	        	return;
	        })
	    }) 
	    // add tracks to each playlist.
	    .then(function addTracksToPlaylist() {
	        return Q.all(arrayOfIndexesToUpdate.map(function addArrayOfTracks(venue) {
	            return venue.addAllTracks(access_token, spotifyUserId);
	        }));
	    })
	}
	return {
		updatePlaylists : main
	};
}();

new CronJob('00 00 00 * * *',
	function() {
		var start = new Date().getTime();
        return Q.fcall(function() {
        	var deferred = Q.defer();

        	request.post('https://accounts.spotify.com/api/token', {form: 
	        {grant_type: "client_credentials",
	        client_id: client_id,
	        "token_type": "bearer",
	        client_secret: client_secret
	        }},
	        function (error, response, body) {
	            if (error) console.log(error)
	            if (!error && response.statusCode == 200) {
	                body = JSON.parse(body);
	                deferred.resolve(body);
	            }
	        });

	        return deferred.promise;
	    })
    	.then(function(token) {
    		return scrape.automateScrapes()
    		.then(function(result) {
				return Q.all(result.map(function(city) {
					return musicians.updateArtists(token.access_token, city.venues)
					.then(function(filteredVenues) {
						city.venues = filteredVenues;
						return city;
					});
				}))
    		})
    		.then(function(cities) {
    			return Q.all(cities.map(function(city) {
    				var deferred = Q.defer();
    				playlistsdb.findOneAndUpdate(
    					{name: city.name}, 
    					{name: city.name, venues: city.venues, date: new Date()},
    					{upsert: true},
    					function(error, result) {
    						if (error) return console.log(error);
    						deferred.resolve(result);
    					}
    				)
    				return deferred.promise;
    			}));
    		})
    		.then(function() {
    			var end = new Date().getTime();
    			var timeElapsed = (end - start) / 1000;
    			return console.log('update took', timeElapsed);
    		})
    	})
	}, 
	null, 
	true, 
	'Europe/London'
);


module.exports = function(app) {
	var options = {
		client: client,
		pass: config.REDIS_PASS,
		host: config.REDIS_SERVER,
		port: config.REDIS_PORT
	}
	var sessionStore = new RedisStore(options);
	app.use(session({
		secret: 'doing spotify things',
		resave: false,
		saveUninitialized: false,
		store: sessionStore,
		cookie: { 'maxAge': 1800000 },
	}))
    app.get('/callback', function(req, res) {
        var code = req.query.code;
        
        request.post('https://accounts.spotify.com/api/token', {form: 
        {grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
        client_id: client_id,
        client_secret: client_secret
        }},
        function (error, response, body) {
            if (error) console.log(error)
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                req.session.access_token = body.access_token;
                req.session.refresh_token = body.refresh_token;
            	res.redirect('/');
            }
        });
    });

    app.get('/auth', function onSuccess(req, res) {
    	if (req.session.access_token) {
    		res.send();
    	}
        else {
        	var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id + '&response_type=code' + '&redirect_uri=' + redirect_uri + "&scope=playlist-modify-public"; 
        	res.json(url);
        }
    });
    app.get('/locations/:location/artists', function onSuccess(req, res) {
    	var location = req.params.location;
    	if (req.session.access_token) {
    		req.session.location = location;
    	}
		return Q(playlistsdb.findOne({name: location}).exec())
		.then(function(result) {
			res.status(200).send(result);
		})
    });
	app.post('/playlists', function onSuccess(req, res) {
		if (req.session.access_token) {
			var location = req.session.location;
			var body = req.body;
			var selected = [];
			return Q(playlistsdb.findOne({name: location}).exec())
			.then(function(result) {
				for (let i = 0; i < body.venues.length; i++) {
					for (let j = 0; j < result.venues.length; j++) {
						if (result.venues[j].name == req.body.venues[i]) {
							let newVenue = new venue(body.venues[i]);
							newVenue.addArtists(result.venues[j].artists);
							selected.push(newVenue);
						}
					}
				}
				return Q.fcall(function() {
					return playlists.updatePlaylists(req.session.access_token, selected, location);
				})
				.then(function() {
					return res.status(200).send();
				});
			})
		}
		else {
			res.status(404).send();
		}
	})
    app.get('*', function(req, res) {
    	if (req.session.access_token) {
     		res.cookie('Logged In', 'true');   		
    	}
    	else {
    		res.cookie('Logged In', 'false');
    	}
        res.render('index');
    })
}