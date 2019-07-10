import * as CityActions from './../cityActions';
import CityStore from './../cityStore';

class Toggle extends React.Component {
	constructor() {
		super();
		this.state = {
			active: false,
		};
		this.changeCity = this.changeCity.bind(this);
	};

	// Toggle the current city.
	changeCity() {
		return CityActions.getCityForUser(this.props.name);
	};

	componentWillMount() {
		CityStore.on("city change", async () => {
			let currentCity = await CityStore.getCity();
			if (currentCity.name == this.props.name) {
				this.setState({
					active: true
				});
			}
			else {
				this.setState({
					active: false
				});
			}
		});
	};

	render() {
		return (
			<button className={this.state.active == true ? 'toggle-active' : 'toggle'} onClick={this.changeCity}>{this.props.name}</button>
		)
	};
}

export default Toggle;