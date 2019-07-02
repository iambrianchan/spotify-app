import * as CityActions from './../cityActions';
import CityStore from './../cityStore';
import ReactTooltip from 'react-tooltip';

class Artist extends React.Component {
	constructor() {
		super();
	};

	componentWillMount() {

	};

	render() {
		// If the artist has an image, present it. Else present a default.
		let lastIndex = this.props.artist.images.length - 1;
		let imageSource = this.props.artist.images.length > 0 ? this.props.artist.images[lastIndex].url : './../build/assets/img/questionmark.png';
		return (
			<img src={imageSource} data-tip={this.props.artist.name}></img>
		)
	};
}

export default Artist;