import Cookies from "js-cookie";
import * as CityActions from './../cityActions';
import CityStore from './../cityStore';

class LoginButton extends React.Component {
	constructor() {
		super();
		this.state = {
			hasCookie: false
		};
		this.getCookie = this.getCookie.bind(this);
		this.savePlaylists = this.login.bind(this);
	};

	// Redirect the user to the redirect url that is obtained from CityActions.authorize().
	async login() {
		let redirectUrl = await CityActions.authorize();
		redirectUrl = redirectUrl.replace(/['"]+/g, '');
		window.location.href = redirectUrl;
		return null;
	};

	// Determine if the session cookie is set.
	getCookie() {
		let cookie = Cookies.get('Logged In');
		let cookieIsPresent = (cookie == 'true');
		this.setState({
			hasCookie: cookieIsPresent
		});
	};

	// Get the cookie
	componentWillMount() {
		this.getCookie();
	};

	render() {
		return (
			<div>
				{!this.state.hasCookie &&
					<button className='login-button' onClick={this.login}>Login to spotify</button>				
				}
			</div>
		)
	};
};

export default LoginButton;