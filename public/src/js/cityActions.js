import dispatcher from "./dispatcher";
import * as http from "http";
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Send a GET to the /auth endpoint to begin authorization.
export function authorize() {
	let options = {
		hostname: '',
		path: '/auth'
	};

	return new Promise(function(resolve, reject) {
		let request = http.get(options, (response) => {
			let data = '';

			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				resolve(data);
			});
		});

		request.end();
	});
};

// Retrieve a city.
export async function getCityForUser(location) {
	const city = await requestCity(location);
	return dispatcher.dispatch({
		type: "CHANGE_CITY",
		city: city
	});
};

// Send a GET to /cities/:city to retrieve a city.
function requestCity(location) {
	let path = '/cities/' + location;
	let options = {
		hostname: '',
		path: path
	};

	return new Promise(function(resolve, reject) {
		let request = http.get(options, (response) => {
			let data = '';

			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				resolve(JSON.parse(data));
			});
		});

		request.on('error', (error) => {
			console.log(error);
			resolve(Error('An error occurred retrieving a city'));
		});

		request.end();
	})
};

// Dispatch TOGGLE_VENUE to set a venue to toggle active state of venues in Store.
export function toggleVenue(venueName) {
	return dispatcher.dispatch({
		type: 'TOGGLE_VENUE',
		venueName: venueName
	});
};

// Dispatch CLEAR_VENUES to make all venues in Store not active.
export function clearAllVenues() {
	return dispatcher.dispatch({
		type: 'CLEAR_VENUES'
	});
};

// Send a POST request to /playlists to save the active venues to a user's account.
export function savePlaylists(venuesArray) {
	let postData = {
		venues: venuesArray
	};
	postData = JSON.stringify(postData);

	let options = {
		hostname: '',
		path: '/playlists',
		method: 'POST',
		headers: {'Content-Type': 'application/json'}
	};

	return new Promise(function(resolve, reject) {
		let request = http.request(options, (response) => {
			let data = '';

			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				clearAllVenues();
				resolve(true);
			});
		});

		request.on('error', (error) => {
			resolve(false);
		});
		request.write(postData)
		request.end();
	});
};