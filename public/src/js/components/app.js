import { Suspense } from 'react';
import CityStore from './../cityStore';
import ReactTooltip from 'react-tooltip';

const Toggle = React.lazy(() => import('./toggle.js'));
const SaveButton = React.lazy(() => import('./savebutton.js'));
const LoginButton = React.lazy(() => import('./loginbutton.js'));
const Cart = React.lazy(() => import('./cart.js'));
const Venues = React.lazy(() => import('./venues.js'));

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

		let allVenues = [];		
		// Sort the venues by popularity
		if (this.state.city.name) {

			allVenues = this.state.city.venues.slice(0);

			function returnPopularity(venue) {
				if (venue.artists.length == 0) {
					return 0;
				}
				let avgPopularity = 0;
				for (const artist of venue.artists) {
					avgPopularity += artist.popularity;
				}
				avgPopularity /= venue.artists.length;
				return avgPopularity;
			}

			for (let venue of allVenues) {
				venue.avgPopularity = returnPopularity(venue);
			}

			allVenues.sort(function(a,b) {
				if (a.artists.length > b.artists.length) {
					return -1;
				}
				return 1;
			});
		}

		return (
			<div>
				<div id='title'>
					<h1>Your Venues, On Spotify</h1>
					<h4>Choose a city, pick some venues, create playlists</h4>
					<Suspense fallback={<div>Loading</div>}>
						<Toggle name='Austin'/>
						<Toggle name='San Francisco'/>
						<Toggle name='New York City'/> 
						<SaveButton />
						<LoginButton />
					</Suspense>
				</div>
				<div className='cart'>
					<h3>Cart</h3>
					<Suspense fallback={<div>Loading</div>}>
					<Cart />
					</Suspense>
				</div>
				<ReactTooltip type='light' border='true'/>
				{allVenues.length > 0 && < Suspense fallback={<div>Loading</div>}>
					<Venues venues={allVenues}/>
				</Suspense>}
			</div>

		);
	}
}
export default App;