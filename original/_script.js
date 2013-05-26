// Aaron Lipman
// May 2013

// This script uses Facebook's API and jQuery to map Facebook user data (name, email, location, etc.)
// To to various form fields in an HTML document. A url is generated for the user's profile pic as well.

// the function callback() is triggered after a succesful authorization request.

$.ajaxSetup({async: false}); // ¡Importante!
$.getJSON("/configuration.json", function(json) {
    objects = json;
});

// Connect to FaceBook and check log-in status
window.fbAsyncInit = function() {
	FB.init({
	appId      : objects.config.FB_app_ID,		 // App ID
	channelUrl : objects.config.FB_app_Channel,	 // Not necessary unless using cross-site scripting
	status     : true,							 // check login status
	cookie     : true,							 // enable cookies to allow the server to access the session
	xfbml      : true							 // parse XFBML
});

// This event is fired for any authentication related change, such as login, logout or session refresh.
// Whenever someone who was previously logged out tries to log in again, the correct case below will be handled. 
FB.Event.subscribe('auth.authResponseChange', function(response) {

	// The following block runs whenever our Facebook application requests authorization. 
	if (response.status === 'connected') {
		// Once the user has logged into Facebook OK'd authorization for our app,
		// Execute the following jQuery to map Facebook data to form fields:
		FB.api('/me', function(user) {
			    $.each(objects.mapping, function(key, value) {
		    		$(value).val(user[key]);
		    		// Since Facebook returns a user's city as "location.name" instead of "location",
		    		// We need this extra step if we're requesting a location.
		    		try {
		    			if (user[key].name) {
		    		 		$(value).val(user[key].name);
		    			}
		    		} catch (err) {}
			    });

			// Generates a url top the user's profile pic
			image_url = 'https://graph.facebook.com/' + user.id + '/picture?' + objects.mapping.size_attr

			callback();
		});
	} else if (response.status === 'not_authorized') {
		// If the user is logged into FaceBook but has not yet OK'd authorization for our app:
		FB.login();	//Request authorization
	} else {
		// If the user is not logged into FaceBook:
		FB.login();	//Request login
	}
	});
};

// Load the FaceBook Javascript Standard Development Kit
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));

// A callback function triggered after succesful authorization
function callback() {
	// Displays a profile pic
	$('#profile_pic').attr('src', image_url);
	$('#profile_pic').show();

	// Hides Facebook login button after successful login
	//$('#fb_login').hide();
}