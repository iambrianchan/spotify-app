import Venue from './venue.js';
import 'react-virtualized/styles.css';
import List from 'react-virtualized/dist/commonjs/List';
import WindowScroller from 'react-virtualized/dist/commonjs/WindowScroller'
import ReactTooltip from 'react-tooltip';

class Venues extends React.Component {
	constructor() {
		super();
	};

	componentWillMount() {

	};

	render() {
		const allVenues = this.props.venues;
		// Map an array of artist components from the venue.
		if (!allVenues) {
			return null;
		}

		function rowRenderer ({
			key,         // Unique key within array of rows
			index,       // Index of row within collection
			isScrolling, // The List is currently being scrolled
			isVisible,   // This row is visible within the List (eg it is not an overscanned row)
			style        // Style object to be applied to row (to position it)
			}) {
			ReactTooltip.rebuild()
			return(
				<div style={style}>
				<Venue key={allVenues[index]._id} venue={allVenues[index]}/>
				</div>
			)
		}
		return(
			<WindowScroller>
			    {({ height, isScrolling, registerChild, scrollTop }) => (
			      <div ref={registerChild}>
			          <List
			            autoHeight
			            height={height}
			            isScrolling={isScrolling}
			            rowCount={allVenues.length}
			            rowHeight={250}
			            rowRenderer={rowRenderer}
			            scrollTop={scrollTop}
			            width={700}
			          />
			      </div>
			    )}
			</WindowScroller>
			)
	};
}

export default Venues;