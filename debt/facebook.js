window.fbAsyncInit = function() {
  FB.init({
    appId      : '198667233618182', // App ID
    // channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    xfbml      : true  // parse XFBML
  });
};
// Load the SDK Asynchronously
(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/all.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));

function share_image(img_url, text) {
	//Check to see if the user has authenticated the App.
	FB.getLoginStatus(function (response) {

		if (response.status === 'connected') {
			//If you want the user's Facebook ID or their access token, this is how you get them.
			var uid = response.authResponse.userID;
			var access_token = response.authResponse.accessToken;

			do_api_share(access_token, img_url, text);

		} else {

			//If they haven't, call the FB.login method
			FB.login(function (response) {

				if (response.authResponse) {

					//If you want the user's Facebook ID or their access token, this is how you get them.
					var uid = response.authResponse.userID;
					var access_token = response.authResponse.accessToken;

					do_api_share(access_token, img_url, text);
				} else {
					alert("You must install the application to share your greeting.");
				}
			}, {
				scope: 'publish_stream'
			});
		}
	});
}


function do_api_share(at, img_url, text) {

	FB.api("/me/photos", 'post',  {message: text, access_token: at, url: img_url}, function (response) {
			console.log(response);
		});
}
 
//Calling the function