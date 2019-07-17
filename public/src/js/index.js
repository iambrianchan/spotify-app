import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import createHistory from 'history/createBrowserHistory';
import { BrowserRouter as Router, Route } from "react-router-dom";
import App from './components/app.js';

ReactGA.initialize('UA-89957529-2');
ReactGA.pageview('/');

ReactDOM.render((
	<Router history={history}>
		<Route exact path='/' component={App} />
	</Router>
	), 
document.getElementById('spotify'));