importScripts('parse-csv.js', 'md5.js');

self.addEventListener('message', function(e) {
  var filename = e.data.filename;

  // If the file ends in '.tsv', use a tab character as the delimiter.
  // Otherwise, use a comma
  var delimiter = /\.tsv$/.test(filename) ? '\t' : ',';

  // Get the text of the csv, and standardize the line-breaks,
  // if a different encoding is used
  var text = e.data.csv.replace(/(?:\r\n|\r)/g, '\n');

  // Add an extra linebreak at the end of the file, if none exists
  var append = /\n$/.test(text) ? '' : '\n';

  console.log(append);

  // Create a header array
  var headers = text.substring(0, text.indexOf('\n')).split(delimiter);

  // Get various configuration options
  var letter_case = e.data.letter_case;
  var column_to_hash = e.data.column_to_hash;
  var delete_originals = e.data.delete_originals;
  var salt = e.data.salt;
  var quoted_fields = e.data.quoted_fields;

  // Determine which column number to hash
  var email_column = headers.map(function(s){return s.replace(/\"/g, '').trim();}).indexOf(column_to_hash);

  // Check for errors
  if (column_to_hash === "") { self.postMessage({'cmd': 'error', 'msg': '\"Column to hash\" is required!'}); return false; }
  if (email_column === -1) { self.postMessage({'cmd': 'error', 'msg': 'Unable to find a column matching \"' + column_to_hash + '\"!'}); return false; }

  // Separate the remainder of the csv
  var body = text.substring(text.indexOf('\n') + 1) + append;
  
  // Hash the email column
  var hashed_body = hashEmailColumn(body, email_column, letter_case, delimiter, quoted_fields, salt, delete_originals);

  if (delete_originals === 'no') {
    headers.splice(email_column, 0, 'original');
  }

  // Combine the headers, and csv with MD5-hashed email column
  var converted_csv = headers.join().replace(column_to_hash, 'hashed_' + column_to_hash) + '\n' + hashed_body;

  // Return the converted CSV
  self.postMessage({'cmd': 'complete', 'msg': converted_csv});
}, false);
