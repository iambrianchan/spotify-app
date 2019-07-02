import * as CityActions from './../cityActions';
import CityStore from './../cityStore';

class Toggle extends React.Component {
	constructor() {
		super();
		this.changeCity = this.changeCity.bind(this);
	};

	// Toggle the current city.
	changeCity() {
		return CityActions.getCityForUser(this.props.name);
	};

	componentWillMount() {

	};

	render() {
		return (
			<button onClick={this.changeCity}>{this.props.webname}</button>
		)
	};
}

export default Toggle;