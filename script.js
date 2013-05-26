// Aaron Lipman
// May 2013

// This script uses Facebook's API and jQuery to map Facebook user data (name, email, location, etc.)
// To to various form fields in an HTML document. A url is generated for the user's profile pic as well.
// the function callback() is triggered after a succesful authorization request.

// Loads the Facebook Javascript SDK
(function (d) {
	var js, id = 'facebook-jssdk',
		ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {
		return;
	}
	js = d.createElement('script');
	js.id = id;
	js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));

// Initializes a "tunnel" to Facebook Graph API
function authAndLogin(form_selector, app_ID, mapping, callback) {
	xform_selector = form_selector;
	xapp_ID = app_ID;
	xmapping = mapping;
	FB.init({
		appId: xapp_ID, // App ID
		channelUrl: "//www.optional.com/channel", // Not necessary unless using cross-site scripting
		status: true, // check login status
		cookie: true, // enable cookies to allow the server to access the session
		xfbml: false // -- we'll use our own HTML instead of Facebook's login buttons
	});
	FB.login(function (response) {
		if (response.authResponse) {
			FB.api('/me', function (response) {
				callback();
			});
		}
	}, {
		scope: 'email'
	});
}

// Connect to FaceBook and check log-in status
window.fbAsyncInit = function () {
	// This event is fired for any authentication related change, such as login, logout or session refresh.
	// We take advantage of this to run the data-mapping chunk of our code. 
	FB.Event.subscribe('auth.authResponseChange', function (response) {
		// The following block runs whenever our Facebook application requests authorization. 
		if (response.status === 'connected') {
			// Once the user has logged into Facebook OK'd authorization for our app,
			// execute the following jQuery to map Facebook data to form fields:
			FB.api('/me', function (user) {
				$.each(xmapping, function (key, value) {
					$(xform_selector).find(value).val(user[key]);
					// Since Facebook returns a user's city as "location.name" instead of "location",
					// We need this extra step if we're requesting a location.
					try {
						if (user[key].name) {
							$(value).val(user[key].name);
						}
					} catch (err) {}
				});

				// Generates a url top the user's profile pic
				image_url = 'https://graph.facebook.com/' + user.id + '/picture?' + xmapping.size_attr

			});
		}
	});
};