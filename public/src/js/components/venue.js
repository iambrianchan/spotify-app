import * as CityActions from './../cityActions';
import CityStore from './../cityStore';
import Artist from './artist.js';

class Venue extends React.Component {
	constructor() {
		super();
		this.state = {
			active: false,
		}
		this.toggleVenue = this.toggleVenue.bind(this);
	};

	// Toggle the venue. This is bound to an onClick function.
	toggleVenue() {
		const currentState = this.state.active;
		this.setState({
			active: !currentState,
		});
		return CityActions.toggleVenue(this.props.venue.name);
	};

	// Listen for venues clear, and set active to false.
	componentWillMount() {
		CityStore.on('venues clear', () => {
			this.setState({
				active: false 
			});
		});
	}

	render() {
		const venue = this.props.venue;
		const artists = this.props.venue.artists;
		// Map an array of artist components from the venue.
		let allArtists = artists.map(artist => {
			return(
				<Artist key={artist._id} artist={artist}/>
			)
		});
		return (
			<div className={this.state.active ? 'active-venue venue' : 'venue'} onClick={this.toggleVenue}>
			<div className='venue-title'>{venue.name}</div>
			{allArtists}
			</div>
		)
	}
}

export default Venue;