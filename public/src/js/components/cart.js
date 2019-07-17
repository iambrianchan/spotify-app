import CityStore from './../cityStore';
import CartItem from './cartItem';

class Cart extends React.Component {
	constructor() {
		super();
		this.state = {
			activeVenues: [],
		};
	};

	componentWillMount() {
		CityStore.on('venue toggle', () => {
			const activeVenues = CityStore.getActiveVenues();
			this.setState({
				activeVenues: activeVenues
			});
		});

		CityStore.on('venues clear', () => {
			this.setState({
				activeVenues: []
			});
		});

		CityStore.on('city change', () => {
			this.setState({
				activeVenues: []
			});
		});
	};

	render() {
		let activeVenues = this.state.activeVenues.map(venue => {
			return (
				<CartItem name={venue}/>
				)
		})
		return (
			<div className='cart-items'>
				{activeVenues}
			</div>
		)
	};
}

export default Cart;