"use strict";
var request = require('request');
var Q = require('q');
var scraper = require('./scraper');
var artists = require('./models/artist');

// spotify api variables
var client_id = 'client_id';
var client_secret = 'client_secret';
var redirect_uri = 'redirect_uri';
var access_token, token_type, expires_in, refresh_token, spotifyUserId, location, venues, playlist;
var isRunning = false;

// spotifyApi has functions to make http calls to Spotify's API.
var spotifyApi = {};
spotifyApi.getSpotifyUserId = function() {
    var deferred = Q.defer();
    var options = {
        url: "https://api.spotify.com/v1/me",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token
        }
    };
    request(options, function getUserId(error, response, body) {
        if (!error && response.statusCode == 200) {
            var id = JSON.parse(body).id;
            deferred.resolve(id);
        }
        else if (error) {
            console.log(error);
        }
        else if (response.statusCode == 401) {
        	setTimeout(function() {
        		deferred.resolve(spotifyApi.getSpotifyUserId());
        	}, 5000)
        }
    })
    return deferred.promise;
}
spotifyApi.getArtist = function() {
	var name = this.name;
	var spotifyId, track;
	return Q.fcall(function() {
		return getArtistIdFromMongo(name)
		.then(function onSuccess(result) {
	    	if (result) {
	    		return result;
	    	}
	    	else {
	    		return null;
	    		// this is where you would be searching spotify, but now we are going to leave that for a cron job.
	    	}
	    });
	})
	.then(function onSuccess(resultModel) {
		return resultModel;
	})

    // function to query db for artist
	function getArtistIdFromMongo(name) {
	    return Q(artists.findOne({name: name}).exec())
	};
}

spotifyApi.getAllUserPlaylists = function (offset, items) {
    if (!offset) {
        offset = 0;
    }
    var deferred = Q.defer();
    var url = "https://api.spotify.com/v1/me/playlists?limit=50&offset=" + offset;
    var options = {
        url: url,
        headers: {
            "Authorization": "Bearer " + access_token
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var playlists = JSON.parse(body).items;
            if (playlists.length == 50) {
                if (items) {
                    deferred.resolve(spotifyApi.getAllUserPlaylists(offset + 50, playlists.concat(items)));                          
                }
                else {
                    deferred.resolve(spotifyApi.getAllUserPlaylists(offset + 50, playlists));
                }
            }
            else {
                if (items) {
                    deferred.resolve(playlists.concat(items));
                }
                else {
                    deferred.resolve(playlists);
                }
            }
        }
    })
    return deferred.promise;
}

spotifyApi.removeAllTracks = function(spotifyUserId, items) {
	var self = this;
	var bodyItems = items.map(function(item, index) {
		return {"uri": item.track.uri, "positions": [index]};
	});
	bodyItems = JSON.stringify({"tracks": bodyItems});
	var url = "https://api.spotify.com/v1/users/" + spotifyUserId + "/playlists/" + self.spotifyPlaylistId + "/tracks";
	var options = {
		method: "DELETE",
		url: url,
		headers: {
			"Authorization": "Bearer " + access_token,
			"Content-Type": "application/json"
		},
		body: bodyItems
	};
	request(options, function callback(error, response, body) {
		if (!error && response.statusCode == 200) {
			return;
		}
        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
                self.removeAllTracks(spotifyUserId, items);
            }, delay);
        }
		else {
			console.log(response.statusCode);
			self.removeAllTracks(spotifyUserId, items);
		}
	})
}

spotifyApi.createPlaylist = function(spotifyUserId, location) {
	var self = this;
    var deferred = Q.defer();
    var url = "https://api.spotify.com/v1/users/" + spotifyUserId + "/playlists";

    var data = JSON.stringify({name: location + " - " + self.name});
    var options = {
        method: "POST",
        url: url,
        headers: {
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json"
        },
        body: data
    };
    request(options, 
        function (error, response, body) {
        if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
            deferred.resolve(JSON.parse(body).id);
        }
        else if (error) {
            console.log(error);
            deferred.resolve(self.createPlaylist(spotifyUserId, location));
        }
        else if (response.statusCode == 429) {
        	var delay = (response.headers['retry-after'] + 1) * 1000;
                setTimeout(function() {
                    deferred.resolve(self.createPlaylist(spotifyUserId, location));
                }, delay)
        }
        else {
        	console.log(response.statusCode);
        	setTimeout(function() {
            	deferred.resolve(self.createPlaylist(spotifyUserId, location));	        		
        	}, 3000);
        }
    });

    return deferred.promise;
}

spotifyApi.getAllTracks = function(getSpotifyUserId) {
	var self = this;
	var deferred = Q.defer();
	if (self.spotifyPlaylistId == undefined) {
		deferred.resolve(null);
		deferred.promise;
	};
    var url = "https://api.spotify.com/v1/users/" + spotifyUserId + "/playlists/" + self.spotifyPlaylistId + "/tracks";
    var options = {
        url: url,
        headers: {
            'Authorization': "Bearer " + access_token
        }
    };
    request.get(options, function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            deferred.resolve(JSON.parse(body).items);
        }
        else if(error) {
            console.log(error);
        	deferred.resolve(self.getAllTracks(spotifyUserId));
        }
        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
                deferred.resolve(self.getAllTracks(spotifyUserId));
            }, delay)
        }
    });
    return deferred.promise;
}

spotifyApi.addAllTracks = function (spotifyUserId) {
	var self = this;
	var deferred = Q.defer();
    var tracks = {"uris": []};
    var url = "https://api.spotify.com/v1/users/" + spotifyUserId + "/playlists/" + self.spotifyPlaylistId + "/tracks";
    for (let i = 0; i < self.artists.length; i++) {
    	if (self.artists[i] != undefined) {
            if (self.artists[i].track) {
                tracks.uris.push(self.artists[i].track);                   
            };
    	}
    };
    tracks.uris = tracks.uris.length >= 100 ? tracks.uris.slice(0, 100) : tracks.uris;
	if (tracks.uris.length == 0) return;
    tracks = JSON.stringify(tracks);
    var options = {
        method: "POST",
        url: url,
        headers: {
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json"
        },
        body: tracks
    };
    request(options, function callback(error, response, body) {
        if (!error && response.statusCode == 201) {
        	deferred.resolve(self.spotifyPlaylistId);
        }
        else if (error) {
        	console.log(error);
        	deferred.resolve(self.addAllTracks(spotifyUserId));
        }
        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
                deferred.resolve(self.addAllTracks(spotifyUserId));
            }, delay)
        }
        else {
            console.log(response.statusCode, self.spotifyPlaylistId, JSON.parse(tracks).uris.length, "artists failed to add to playlist");
            deferred.resolve(self.addAllTracks(spotifyUserId));
        };
    });
	deferred.promise;
}

// venue object is used to store artist data, and playlist id for the venue's playlist.
// venue object uses four functions from spotifyApi.
var venue = function(name) {
	this.name = name;
	this.artists = [];

	return this;
}
venue.prototype.addArtists = function(artists) {
	var keys = Object.keys(artists);

	for (let i = 0; i < keys.length; i++) {
		var newArtist = new artist(keys[i]);
		this.artists.push(newArtist);
	};
	return;
};
venue.prototype.setArtists = function(artists) {
	this.artists = artists;
	return;
};
venue.prototype.setSpotifyPlaylistId = function(spotifyPlaylistId) {
	this.spotifyPlaylistId = spotifyPlaylistId;
	return;
}
venue.prototype.removeAllTracks = spotifyApi.removeAllTracks;
venue.prototype.getAllTracks = spotifyApi.getAllTracks;
venue.prototype.addAllTracks = spotifyApi.addAllTracks;
venue.prototype.createPlaylist = spotifyApi.createPlaylist;


// artist object is used to store artist id, and top track uri.
var artist = function(name) {
	this.name = name;
}
artist.prototype.getSpotifyData = spotifyApi.getArtist;
artist.prototype.updateWithSpotifyData = function(artistModel) {
	if (!artistModel) {
		artistModel = null;
	}
	this._id = artistModel != null ? artistModel._id : null;
	this.spotifyId = artistModel != null ? artistModel.spotifyId : null;
	this.track = artistModel.track != null ? artistModel.track : null;
	return;
}


// use the imported scraper from ./scraper.
var scrape = function() {
	if (isRunning) {
		return;
	}
	isRunning = true;

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

	//utility function for counting number of artists;
	function countArtists(data) {
        var venues = Object.keys(data);
        var counter = 0;
        for (let i = 0; i < venues.length; i++) {
        	let venue = data[venues[i]];
            var artists = Object.keys(venue.artists);
            for (var j = 0; j < artists.length; j++) {
                counter++;
            }
        }
        return counter;
	}

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
			var numArtists = countArtists(result);
			playlist = result;
			return numArtists;
		})
	};

	return {
		getScrape : main
	};
}();

// module that is used to get spotify artist data.
var musicians = function(access_token) {

	function getArtistAndTrackData(data) {
		venues = Object.keys(data);
		for (let i = 0; i < venues.length; i++) {
			var venueName = venues[i];
			var newVenue = new venue(venueName);
			var artists = data[venueName].artists;
			newVenue.addArtists(artists);
			venues[i] = newVenue;
		}

		return Q.all(
			venues.map(function forVenues(venue) {
				return Q.all(venue.artists.map(function forArtists(artist) {
					return artist.getSpotifyData()
					.then(function onSuccess(resultModel) {
						if (resultModel != null) {
							artist.updateWithSpotifyData(resultModel);
						}
						return artist;
					})
				}))
				.then(function filterOnlyArtistsWithData(arrayOfNewArtists) {
					for (let i = arrayOfNewArtists.length - 1; i >= 0; i--) {
						let artist = arrayOfNewArtists[i];
						if (artist.track == null) {
							arrayOfNewArtists.splice(i, 1);
						}
					}
					venue.setArtists(arrayOfNewArtists);
					return venue;
				})
			})
		)
		.then(function(venues) {
		    // remove a playlist if it contains less than 9 artists (insignificant)
	    	for (let i = venues.length - 1; i >= 0; i--) {
	    		var numartists = venues[i].artists.length;
	    		if (numartists < 9) {
	    			venues.splice(i, 1);
	    		}
	    	}
		    return venues;
		});
	}
	function main(location, access_token) {
		return Q.fcall(function() {
			return getArtistAndTrackData(playlist);	
		})
	}
	return {
		getArtists: main
	}
}();

var playlists = function() {

// this is a long method. first the user id is retrieved. then a request to get all playlists. then set playlist id for any matches.
// it is also important to remove tracks to prevent duplicates in playlist. new playlists are created for those that are not found, and finally tracks are added.
	function main() {

		return Q.fcall(function retrieveUserId() {
			return spotifyApi.getSpotifyUserId();
		})
		.then(function onSuccess(userId) {
			spotifyUserId = userId;
		})
		.then(function searchForAllPlaylists() {
			return spotifyApi.getAllUserPlaylists();
		})
		.then(function onSuccess(arrayOfSpotifyPlaylists) {
			return Q.all(
				venues.map(function addSpotifyPlaylistIdToMatchingVenues(venue) {
					for (let i = 0; i < arrayOfSpotifyPlaylists.length; i++) {
						let thePlaylist = arrayOfSpotifyPlaylists[i];
						if (thePlaylist.name == location + " - " + venue.name) {
							var spotifyPlaylistId = thePlaylist.id;
							venue.setSpotifyPlaylistId(spotifyPlaylistId);
							return venue;
						}
					}
					return venue;
			}))
		})
		.then(function removeSpotifyTracks() {
	        return Q.all(venues.map(function(venue) {
	            return venue.getAllTracks(spotifyUserId)
	            .then(function removeTracks(items) {
	            	if (items) {
	            		return venue.removeAllTracks(spotifyUserId, items);
	            	}
	            })
	        }))	
		})
	    .then(function createAllPlaylists() {
	        return Q.all(venues.map(function(venue, index) {
	        	var deferred = Q.defer();
	        	setTimeout(function createThePlaylist() {
		            if (venue.spotifyPlaylistId) {
		            	deferred.resolve(venue.spotifyPlaylistId);
		            }
		            else {
		                deferred.resolve(venue.createPlaylist(spotifyUserId, location));                  		
		            };
	        	}, index * 1000);

	        	return deferred.promise;
	        }))
	        // add spotify playlist id to each venue.
	        .then(function setTheSpotifyPlaylistId(result) {
	        	for (let i = 0; i < result.length; i++) {
	        		venues[i].spotifyPlaylistId = result[i];
	        	}
	        	return;
	        })
	    }) 
	    .then(function addTracksToPlaylist() {
	        return Q.all(venues.map(function addArrayOfTracks(venue) {
	            return venue.addAllTracks(spotifyUserId);
	        }));
	    })
	}
	return {
		updatePlaylists : main
	};
}();

module.exports = function(app) {

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
                access_token = body.access_token;
                token_type = body.token_type;
                expires_in = body.expires_in;
                refresh_token = body.refresh_token;
            }
        });
        res.redirect('/');
    });

    app.get('/auth', function onSuccess(req, res) {
        var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id + '&response_type=code' + '&redirect_uri=' + redirect_uri + "&scope=playlist-modify-public"; 
        res.json(url);
    });
    app.get('/scrape/locations/:location', function onSuccess(req, res) {
    	location = req.params.location;
    	return Q.fcall(function() {
    		return scrape.getScrape();
    	})
    	.then(function(numArtists) {
    		res.status(200).send(numArtists.toString());
    	})
    })
    app.get('/artists', function onSuccess(req, res) {
    	var start = new Date();
    	return Q.fcall(function() {
    		return musicians.getArtists(access_token)
    	})
    	.then(function onSuccess(result) {
    		var end = new Date();
    		res.status(200).send(result.length.toString());
    	});
    });
    app.get('/playlists', function onSuccess(req, res) {
    	return Q.fcall(function() {
    		return playlists.updatePlaylists()
    	})
    	.then(function onSuccess() {
    		res.sendStatus(200);
    	});
    })
    app.get('*', function(req, res) {
        res.render('index');
    })
}


	// to be used for maybe a cron job instead.

	// function searchSpotifyForArtist() {

	//     function searchSpotifyForTopTrack(artistId) {
	//         var deferred = Q.defer();
	//         var url = "https://api.spotify.com/v1/artists/" + artistId + "/top-tracks?Authorization=" + access_token + "&country=US";

	//         request(url, function (error, response, body) {
	//             if (!error && response.statusCode == 200) {
	//                 var tracks = JSON.parse(body).tracks;
	//                 if (tracks.length > 0) {
	//                     var track = tracks[0].uri
	//                     artists.create({
	//                         name: this.name,
	//                         spotifyId: artistId,
	//                         track: track
	//                     }, function (error, result) {
	//                         if (error) {
	//                             console.log(error);
	//                             deferred.resolve(searchSpotifyForTopTrack(artistId));
	//                         }
	//                         else {
	//                             deferred.resolve({result}); 
	//                         }
	//                     });
	//                 }
	//                 // if the search for top track returns no results resolve null
	//                 else {
	//                     deferred.resolve(null);
	//                 }
	//             }

	//             else if (error) {
	//                 deferred.resolve(searchSpotifyForTopTrack(artistId));
	//             }

	//             else if (response.statusCode == 429) {
	//                 delay = (response.headers['retry-after'] + 1) * 1000;
	//                 setTimeout(function() {
	//                     deferred.resolve(searchSpotifyForTopTrack(artistId));
	//                 }, delay)
	//             }
	//         })

	//         return deferred.promise;        
	//     };


	//     var parsedArtist = this.name.replace('#', '%20');
	//     var url = 'https://api.spotify.com/v1/search?Authorization=' + access_token + '&q=' + parsedArtist + '&type=artist';
	//     var deferred = Q.defer();
	//     request(url, function getArtistId(error, response, body) {
	//         if (!error && response.statusCode == 200) {

	//             // get the spotify artist id from the search
	//             if (JSON.parse(body).artists.items[0]) {
	//                 var id = JSON.parse(body).artists.items[0].id;
	//                 deferred.resolve(searchSpotifyForTopTrack(id));

	//             }
	//             // if the search returns no results resolve null
	//             else {
	//                 deferred.resolve(null);
	//             }
	//         }
	//         else if (error) {
	//             deferred.resolve(searchSpotifyForArtist(artist));
	//         }
	//         else if (response.statusCode == 429) {
	//             delay = (response.headers['retry-after'] + 1) * 1000;
	//             setTimeout(function() {
	//                 deferred.resolve(searchSpotifyForArtist(artist));
	//             }, delay)
	//         }

	//         else {
	//             deferred.resolve(searchSpotifyForArtist(artist));
	//         };
	//     })

	//     return deferred.promise;        
	// }


	// functions to use later for for database accuracy.

	// // removing duplicates from the database is necessary because searching for artists is run in parallel.
	// // if an artist is found to be in more than one venue, it will be added more than once.
	// function removeAllDuplicatesFromDatabase() {
	// 	return Q.fcall(function() {
	//     	return Q(artists.find({}).exec())
	// 	})
	// 	.then(function(results) {
	// 		var uniqueArtists = {};
	// 		var dupes = [];
	// 		for (let i = 0; i < results.length; i++) {
	// 			if (uniqueArtists[results[i].name] == undefined) {
	// 				uniqueArtists[results[i].name] = true;					
	// 			}
	// 			else {
	// 				dupes.push(results[i]['_id']);
	// 			}
	// 		}
	// 		return removeDuplicates(dupes);		
	// 	})
	// 	// function that takes an array of duplicate artists and removes them from db based on _id.
	// 	function removeDuplicates(idArray) {
	// 		return Q(artists.remove({ _id: {$in : idArray}}).exec());
	// 	}
	// }