Aaron Lipman, May 2013

-----About:----------------
This project demonstrates a jQuery script which uses FaceBook's Graph API to map data from a FaceBook profile to an HTML form.

The applicable parameters are stored in an external .json file, providing a degree of abstraction so that the code may be easily repurposed.
-----UPDATE!---------------
Parameters are now passed directly to the function. The old version of the script is available in the "original" directory.


-----Deployment:-----------
Create a new Facebook application. Enable "Website with Facebook login."

Set the site URL to your external domain - you can use http://localhost for development/testing purposes.

Before deploying to production, be sure to disable "Sandbox Mode" and update your site URL!


-----Config & Mapping:-----
The form selector, Facebook App ID, mapping instructions, and callback function parameters are passed to the authAndLogin() function.

The "form selector" parameter identifies a jQuery selector for the relevant form.

The "mapping" parameter is a JSON object, instructing the script what form fields to map the Facebook user data to.

The Facebook user data available from your app is:
id
name
first_name
last_name
link
hometown
location
gender
timezone
locale
verified
updated_time

Certain additional information, such as email, language, religion and work can be requested by adding additional permissions to the scope section of the FB.login() function, in script.js. (Currently set to "email".)

For more info on permissions and available user data, refer to:
https://developers.facebook.com/docs/reference/api/user/


-----Image Mapping:--------
The script creates a url to the user's profile pic using Facebook's Graph API and the size attributes from configuration.json.

This url is stored as "image_url", and is available to the callback function.


-----Callback Function:----
Following a successful authorization request, the script executes the callback function.

The callback function is currently set to hide the Facebook login button, and show the user's profile pic.