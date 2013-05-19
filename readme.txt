Aaron Lipman, May 2013

-----About:----------------

This project demonstrates a jQuery script which uses FaceBook's Graph API to map data from a FaceBook user to HTML form fields, and executes a callback function.

The applicable parameters are stored in an external .json file, providing a degree of abstraction so that the code may be easily repurposed.


-----Deployment:-----------

Create a new Facebook application. Enable "Website with Facebook login."

Set the site URL to your external domain - you can use http://localhost for development/testing purposes.

Before deploying to production, be sure to disable "Sandbox Mode" and update your site URL!


-----Config & Mapping:-----

The config, mapping, and form_selector parameters are stored as a JSON object, "configuration.json"

The "config" parameters in configuration.json refer to a Facebook app ID.
Note the FB_app_Channel field is unnecessary unless you will utilize cross-site-scripting.

The "form_selector" parameter creates a jQuery selector for the form to be updated.

The "mapping" parameters instruct the script what form fields to map the Facebook user data to.

The Facebook user data available from your app is:
id
name
first_name
last_name
link
hometown
location
gender
email
timezone
locale
verified
updated_time

Certain additional information, such as language, religion and work can be requested by adding additional permissions to the "perms" attribute of the <fb:login-button> HTML tag. 

For more info on permissions and available user data, refer to:
https://developers.facebook.com/docs/reference/api/user/


----Image Mapping:---------

The script creates a url to the user's profile pic using Facebook's Graph API and the size attributes from configuration.json.

This url is stored as "image_url", and is available to the callback function.


----Callback Function:-----

Following a successful authorization request, the script executes the callback function.
The callback function is currently set to hide the Facebook login button, and show the user's profile pic.