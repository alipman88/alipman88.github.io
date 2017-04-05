// Based on
// http://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
//
// This will parse a CSV,
// and replace values in the "email" column with their MD5 hash.
//
// The default delimiter is the comma, but this
// can be overriden in the second argument.

function hashEmailColumn( strData, emailColumn, letterCase, strDelimiter, quotedFields, salt, deleteOriginals ){
  // Check to see if the delimiter is defined.
  // If not, then default to a comma.
  strDelimiter = (strDelimiter || ",");

  // Only apply quotation rules if the text delimiter option is enabled
  quoteRegex = quotedFields === 'true' ? "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" : "("

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      quoteRegex +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
    );

  // Create an array to hold our data. Give the array
  // a default empty first row.
  var strDataOut = "";
  var row = [];
  var progress = 0

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;

  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[ 1 ];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      (strMatchedDelimiter != strDelimiter)
      ){

      // Since we have reached a new row of data,
      // add an empty row to our data array.
      strDataOut += row.join();
      strDataOut += "\n";
      progress += 1;

      // Log progress every 1,000 completed rows
      if (progress % 1000 === 0) { self.postMessage({'cmd': 'progress', 'msg': 'processing row ' + progress}) }
      
      row = [];
    }

    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[ 2 ]){

      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
        );

    } else {

      // We found a non-quoted value.
      var strMatchedValue = arrMatches[ 3 ];

    }

    // Now that we have our value string, let's add
    // it to the data array.
    if (emailColumn === row.length) {
      if (deleteOriginals === 'no') {
        // Save original email addresses, if desired
        row.push(strMatchedValue);
      }
      // This is the column we want to hash --
      // push the hashed value
      row.push(md5( salt + (letterCase === 'upper' ? strMatchedValue.trim().toUpperCase() : strMatchedValue.trim().toLowerCase()) ));
    } else {
      // This isn't the column we want to hash --
      // push the original value
      row.push(strMatchedValue);
    }
  }

  // Return the parsed data.
  self.postMessage({'cmd': 'progress', 'msg': 'completed ' + progress + ' rows!\npreparing file...'})
  return( strDataOut );
}
