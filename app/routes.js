"use strict";
var session = require('express-session');
var redis = require("redis");
var RedisStore = require('connect-redis')(session);
var SpotifyWebApi = require("spotify-web-api-node");

// set credentials from environment variables.
var credentials = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
};

// instantiate the spotifyApi and import the spotify helper
var spotifyApi = new SpotifyWebApi(credentials);
var spot = require('./spotify');

// import mongoose models and js
var artists = require('./models/artist');
var playlistsSchema = require('./models/playlist');

// create redis client
var options = {
	host: process.env.REDIS_SERVER,
	port: process.env.REDIS_PORT,
	password: process.env.REDIS_PASS
};
var client = redis.createClient(options);

// create playlists for the user
async function playlists(req) {
	return new Promise(async function(resolve, reject) {
		try {
			spotifyApi.setAccessToken(req.session.access_token);
			spotifyApi.setRefreshToken(req.session.refresh_token);
			let location = req.session.location;
			let data = req.body;
			let venues = data.venues;

			// retrieve the playlist from the database
			const city = await playlistsSchema.findOne({name: location})
				.exec()
				.then((data) => {
					return data;
				})
				.catch((error) => {
					return Error("An error occurred while retrieving city from the database:");
				})
			if (city instanceof Error) {
				console.log(city);
			}

			// map values from database to the array of venues requested
			venues = venues.map(function(venue) {
				for (let i = 0; i < city.venues.length; i++) {
					if (venue == city.venues[i].name) {
						return city.venues[i];
					}
				}
			});

			// Get the current user id.
			const theCurrentUserId = await spot.getCurrentUser(spotifyApi);

			// Get the current user's playlists.
			const theCurrentUserPlaylists = await spot.getAllCurrentUserPlaylists(spotifyApi, theCurrentUserId);

			// Add playlist id if a similarly named playlist is already present
			venues = venues.map(function(venue) {
				for (let i = 0; i < theCurrentUserPlaylists.length; i++) {
					if (theCurrentUserPlaylists[i].name == venue.name + ", " + location) {
						venue.spotifyPlaylistId = theCurrentUserPlaylists[i].id;
						venue.totalTracks = theCurrentUserPlaylists[i].tracks.total;
					}
				}
				return venue;
			});

			// Create playlist if venue does not have spotifyPlaylistId
			venues = await Promise.all(
				venues.map(async venue => {
					if (!venue.spotifyPlaylistId) {
						await spot.createUserPlaylist(spotifyApi, theCurrentUserId, venue, location);
					}
					return await venue;
				})
			);

			// Replace all tracks in the playlist
			venues = await Promise.all(
				venues.map(async venue => {
					return await spot.replaceAllTracksInPlaylist(spotifyApi, theCurrentUserId, venue);
				})
			);

			resolve(true);  // success
		}

		catch {
			resolve(false);  // failure
		}
	});
}

module.exports = function(app) {
	// initialize redis for sessions
	var redisOptions = {
		client: client,
		host: options.host,
		pass: options.password,
		port: options.port
	}
	var sessionStore = new RedisStore(options);
	app.use(session({
		secret: 'making spotify playlists',
		resave: false,
		saveUninitialized: false,
		store: sessionStore,
		cookie: { 'maxAge': 1800000 },
	}));

	// /callback is registered to the spotify application.
    app.get('/callback', async function(req, res) {
        let code = req.query.code;
        spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
        	req.session.access_token = data.body['access_token'];
        	req.session.refresh_token = data.body['refresh_token'];
        	return res.redirect('/');
        },
        function(error) {
        	console.log('Error authorizing: cannot get access_token & refresh_token:', error);
        	return res.status(500).send();
        });
    });

    // begin the authorization flow, by eventually sending the user to login.
    app.get('/auth', async function(req, res) {
		let scopes = ['playlist-modify-public'];

    	if (req.session.access_token) {
    		return res.send();
    	}

		let authorizeUrl = await spotifyApi.createAuthorizeURL(scopes);
    	return res.json(authorizeUrl);
    });

    // get the artists in a city.
    app.get('/cities/:location', async function (req, res) {
    	let location = req.params.location;
    	if (req.session.access_token) {
    		req.session.location = location;
    	}

		return await playlistsSchema.findOne({name: location}, function(error, data) {
			if (!error) {
				return res.status(200).send(data);
			}
			console.log("An error occurred retrieving a city:", error);
			return res.status(500).send();
		});
    });

    // create a playlist for the user
	app.post('/playlists', async function (req, res) {
		if (!req.session.access_token) {
			return res.status(404).send();
		}

		let successful = await playlists(req);
		if (successful) {
			return res.status(200).send();
		}
		return res.status(500).send();
	});

	// render the index file
    app.get('*', function(req, res) {
    	if (req.session.access_token) {
     		res.cookie('Logged In', 'true');   		
    	}
    	else {
    		res.cookie('Logged In', 'false');
    	}
        return res.render('index');
    });
}