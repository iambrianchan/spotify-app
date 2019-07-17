import Cookies from "js-cookie";
import * as CityActions from './../cityActions';
import CityStore from './../cityStore';

class SaveButton extends React.Component {
	constructor() {
		super();
		this.state = {
			hasCookie: false
		};
		this.savePlaylists = this.savePlaylists.bind(this);
		this.notifyBrowserOfSaveResult = this.notifyBrowserOfSaveResult.bind(this);
		this.getCookie = this.getCookie.bind(this);
	};

	// Determine if there are any active venues.
	// Call CityActions.savePlaylists to save all active venues.
	async savePlaylists() {
		let activeVenues = CityStore.getActiveVenues();
		if (activeVenues.length == 0) {
			return window.alert('No venues were selected, please select venues before saving.');
		}

		let successfulSave = await CityActions.savePlaylists(activeVenues);
		return this.notifyBrowserOfSaveResult(successfulSave);
	};

	// Notify browser of save result.
	notifyBrowserOfSaveResult(successfulSave) {
		let message = successfulSave == true ? 'Subscribed the selected spotify playlists to your account!' : 'An error occurred and the playlists were not saved to your account';
		return window.alert(message);
	}

	// Determine if the session cookie is set.
	getCookie() {
		let cookie = Cookies.get('Logged In');
		let cookieIsPresent = (cookie == 'true');
		this.setState({
			hasCookie: cookieIsPresent
		});
	};

	componentWillMount() {
		this.getCookie();
	};

	render() {
		return (
			<div>
				{this.state.hasCookie &&
					<button className='save-button' onClick={this.savePlaylists}>Subscribe Spotify Playlists</button>
				}
			</div>
		)
	};
}

export default SaveButton;