import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import createHistory from 'history/createBrowserHistory';
import { BrowserRouter as Router, Route } from "react-router-dom";
import App from './components/app.jsx';

// ReactGA.initialize('UA-89957529-3');
// const history = createHistory();
// history.listen((location, action) => {
// 	ReactGA.set({ page: location.pathname });
// 	ReactGA.pageview(location.pathname);
// });

ReactDOM.render((
	<Router history={history}>
		<Route exact path='/' component={App} />
	</Router>
	), 
document.getElementById('spotify'));