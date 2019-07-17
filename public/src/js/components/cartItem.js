import * as CityActions from './../cityActions';

class CartItem extends React.Component {
	constructor() {
		super();
		this.removeVenue = this.removeVenue.bind(this);
	};

	// Toggle the current city.
	removeVenue() {
		CityActions.toggleVenue(this.props.name)
	};

	componentWillMount() {

	};

	render() {
		return (
			<button onClick={this.removeVenue}>{this.props.name}</button>
		)
	};
}

export default CartItem;