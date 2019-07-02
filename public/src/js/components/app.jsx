import CityStore from './../cityStore';
import * as CityActions from './../cityActions';
import Toggle from './toggle.jsx';
import SaveButton from './savebutton.jsx';
import LoginButton from './loginbutton.jsx';
import Venue from './venue.jsx';

class App extends React.Component {

	constructor() {
		super();
		this.state = {
			location: '',
			city: {
				venues: [],
			},
		};
	};

	// Update the current city when changed.
	componentDidMount() {
		CityStore.on("city change", () => {
			this.setState({
				city: CityStore.getCity(),
			});
		});
	}

	render() {
		// map an array of Venue components.
		var allVenues = function() {
			return <div />
		}
		if (this.state.city.name) {
			allVenues = this.state.city.venues.map(venue => {
				return(
					<Venue key={venue._id} venue={venue}/>
					)
			});
		}

		return (
			<div>
				<div id='title'>
					<h1>Your Venues, On Spotify</h1>
					<h4>Choose a city, pick some venues, create playlists</h4>
					<Toggle name='ATX' webname='Austin'/>
					<Toggle name='SFO' webname='San Francisco' />
					<SaveButton />
					<LoginButton />
				</div>
				{allVenues}
			</div>

		);
	}
}

export default App;