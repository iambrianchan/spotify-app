import { EventEmitter } from "events";
import dispatcher from "./dispatcher";

class CityStore extends EventEmitter {
	constructor() {
		super();
		this.activeVenues = [];
		this.city = {};
	};

	// Return the current city.
	getCity() {
		return this.city;
	};

	// Change the current city.
	updateCity(city) {
		this.city = city;
		return;
	};

	// Return the active venues.
	getActiveVenues() {
		return this.activeVenues;
	};

	// Toggle a venue active/off.
	toggleVenue(venueName) {
		let indexOfVenue = this.activeVenues.indexOf(venueName);
		if (indexOfVenue > -1) {
			return this.activeVenues.splice(indexOfVenue, 1);
		}

		return this.activeVenues.push(venueName);
	};

	// Make all venues inactive.
	clearAllVenues() {
		this.activeVenues = [];
		return;
	}

	// Handle city change, toggle venue, clear all.
	handleActions(action) {

		switch (action.type) {

			case "CHANGE_CITY": {
				this.updateCity(action.city);

				this.emit("city change");
				break;
			}

			case "TOGGLE_VENUE": {
				this.toggleVenue(action.venueName);
				this.emit("venue toggle");
				break;
			}

			case 'CLEAR_VENUES': {
				this.clearAllVenues();
				this.emit('venues clear');
				break;
			}
		}
	}
}

const cityStore = new CityStore;
cityStore.setMaxListeners(0);

dispatcher.register(cityStore.handleActions.bind(cityStore));


export default cityStore;