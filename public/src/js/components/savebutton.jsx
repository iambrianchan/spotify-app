import * as CityActions from './../cityActions';
import CityStore from './../cityStore';

class SaveButton extends React.Component {
	constructor() {
		super();
		this.savePlaylists = this.savePlaylists.bind(this);
		this.notifyBrowserOfSaveResult = this.notifyBrowserOfSaveResult.bind(this);
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
		let message = successfulSave == true ? 'Saved the selected spotify playlists to your account!' : 'An error occurred and the playlists were not saved to your account';
		return window.alert(message);
	}

	componentWillMount() {
	};

	render() {
		return (
			<button className='save-button' onClick={this.savePlaylists}>Create Spotify Playlists</button>
		)
	};
}

export default SaveButton;