'use strict'
var artists = require('./models/artist');
var Q = require('q');
var request = require('request');

var spotifyApi = {};

// retrieves user id from spotify api.
spotifyApi.getSpotifyUserId = function(access_token) {
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
        		deferred.resolve(spotifyApi.getSpotifyUserId(access_token));
        	}, 5000)
        }
    })
    return deferred.promise;
}

// finds artist from database, otherwise returns null
spotifyApi.getArtist = function() {
	var name = this.name;
	var spotifyId, track;
	return Q.fcall(function() {
		return getArtistFromDatabase(name)
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
	function getArtistFromDatabase(name) {
	    return Q(artists.findOne({name: name}).exec())
	};
}

// adds artist to database
spotifyApi.addArtist = function(token) {
	var artist = this;
	return Q.fcall(function() {
		return artist.getArtistId(token)
		.then(function(artist) {
			if (artist != null) {
				return artist.getTopTrack(token)
				.then(function(artist) {
					if (artist != null) {
						return saveArtistToMongo(artist);
					}
					else return null;
				})
			}
			else return null;
		})
	})

	function saveArtistToMongo(artist) {
		var deferred = Q.defer();
		artists.create({
			name: artist.name,
			spotifyArtistId: artist.spotifyArtistId,
			track: artist.track,
			images: artist.images
		}, function onSuccess(error, result) {
			deferred.resolve(result);
		})

		return deferred.promise;
	}
};

// retrieves an artist id from spotify api using an artist name.
spotifyApi.getArtistId = function(token) {
	var artist = this;
    var parsedArtist = artist.name.split('#').join('%20');
    parsedArtist = parsedArtist.split(' ').join('%20');
    var url = 'https://api.spotify.com/v1/search?q=' + parsedArtist + '&type=artist';
    var deferred = Q.defer();
    var options = {
        url: url,
        headers: {
            "Authorization": "Bearer " + token
        }
    };
    request(options, function getArtistId(error, response, body) {
        if (!error && response.statusCode == 200) {

            // get the spotify artist id from the search
            if (JSON.parse(body).artists.items[0]) {
                var id = JSON.parse(body).artists.items[0].id;
                artist.spotifyArtistId = id;
                deferred.resolve(artist);

            }
            // if the search returns no results resolve null
            else {
                deferred.resolve(null);
            }
        }
        else if (error) {
            deferred.resolve(artist.getArtistId(token));
        }
        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
            deferred.resolve(artist.getArtistId(token));
            }, delay)
        }

        else {
            deferred.resolve(artist.getArtistId(token));
        };
    })

    return deferred.promise; 	
}

// retrieves an artist's top track from spotify api using the artist's spotify id.
spotifyApi.getTopTrack = function (token) {
	var artist = this;
	var deferred = Q.defer();
	var url = "https://api.spotify.com/v1/artists/" + artist.spotifyArtistId + "/top-tracks?country=US";

    var options = {
        url: url,
        headers: {
            "Authorization": "Bearer " + token
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var tracks = JSON.parse(body).tracks;
            if (tracks.length > 0) {
            	var trackData = {
            		track: tracks[0].uri,
            		images: tracks[0].album.images
            	}
            	artist.setTrackData(trackData)
                deferred.resolve(artist);
            }
            // if the search for top track returns no results resolve null
            else {
                deferred.resolve(null);
            }
        }

        else if (error) {
            deferred.resolve(artist.getTopTrack(token));
        }

        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
                deferred.resolve(artist.getTopTrack(token));
            }, delay)
        }
        else {
        	deferred.resolve(artist.getTopTrack(token));
        }
    })
    return deferred.promise;    	
}

// retrieves all user playlists from spotify api.
spotifyApi.getAllUserPlaylists = function (access_token, offset, items) {
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
                    deferred.resolve(spotifyApi.getAllUserPlaylists(access_token, offset + 50, playlists.concat(items)));                          
                }
                else {
                    deferred.resolve(spotifyApi.getAllUserPlaylists(access_token, offset + 50, playlists));
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

// removes all tracks from a user's spotify playlist given the spotify playlist id
spotifyApi.removeAllTracks = function(access_token, spotifyUserId, items) {
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
                self.removeAllTracks(access_token, spotifyUserId, items);
            }, delay);
        }
		else {
			console.log(response.statusCode);
			self.removeAllTracks(access_token, spotifyUserId, items);
		}
	})
}

// creates a playlist given the spotify user's id.
spotifyApi.createPlaylist = function(access_token, spotifyUserId, location) {
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
            deferred.resolve(self.createPlaylist(access_token, spotifyUserId, location));
        }
        else if (response.statusCode == 429) {
        	var delay = (response.headers['retry-after'] + 1) * 1000;
                setTimeout(function() {
                    deferred.resolve(self.createPlaylist(access_token, spotifyUserId, location));
                }, delay)
        }
        else {
        	console.log(response.statusCode);
        	setTimeout(function() {
            	deferred.resolve(self.createPlaylist(access_token, spotifyUserId, location));	        		
        	}, 3000);
        }
    });

    return deferred.promise;
}

// retrieves all tracks from a spotify playlist.
spotifyApi.getAllTracks = function(access_token, spotifyUserId) {
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
        	deferred.resolve(self.getAllTracks(access_token, spotifyUserId));
        }
        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
                deferred.resolve(self.getAllTracks(access_token, spotifyUserId));
            }, delay)
        }
    });
    return deferred.promise;
}

// adds an array of tracks to a playlist given the playlist id.
spotifyApi.addAllTracks = function (access_token, spotifyUserId) {
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
        	deferred.resolve(self.addAllTracks(access_token, spotifyUserId));
        }
        else if (response.statusCode == 429) {
            var delay = (response.headers['retry-after'] + 1) * 1000;
            setTimeout(function() {
                deferred.resolve(access_token, self.addAllTracks(spotifyUserId));
            }, delay)
        }
        else {
            console.log(response.statusCode, self.spotifyPlaylistId, JSON.parse(tracks).uris.length, "artists failed to add to playlist");
            deferred.resolve(self.addAllTracks(access_token, spotifyUserId));
        };
    });
	deferred.promise;
}

module.exports = spotifyApi;