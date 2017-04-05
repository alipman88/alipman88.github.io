// Initialize the worker on page load, so that folks may disconnect their internet connection
// while running the process.
worker = new Worker('worker.js');

document.getElementById('file-form').addEventListener('submit', function() {

  // Clear errors
  document.getElementById("errors").innerHTML = "";

  // Make sure a file is present
  if (document.getElementById('fileinput').files.length == 0) {
    document.getElementById("errors").innerHTML = "please select a file";
    return false;
  }

  document.getElementById("progress").innerHTML = 'loading...';

  // Initialize a FileReader
  var reader = new FileReader();
  var filename = document.getElementById('fileinput').files[0].name;

  console.log(filename);

  // Get various config options
  var case_select = document.getElementById('case');
  var letter_case = case_select.options[case_select.selectedIndex].value;
  var delete_originals_select = document.getElementById('delete_originals');
  var delete_originals = delete_originals_select.options[delete_originals_select.selectedIndex].value;
  var quoted_fields_select = document.getElementById('quoted_fields');
  var quoted_fields = quoted_fields_select.options[quoted_fields_select.selectedIndex].value;
  var column_to_hash = document.getElementById('column_to_hash').value.trim();
  var salt = document.getElementById('salt').value;

  reader.onload = function() {
    worker.postMessage({
      'csv': reader.result,
      'filename': filename,
      'letter_case': letter_case,
      'delete_originals': delete_originals,
      'column_to_hash': column_to_hash,
      'salt': salt,
      'quoted_fields': quoted_fields
    });

    worker.addEventListener('message', function(e) {
      switch(e.data.cmd) {
        case 'complete':
          // Once the file finished processing, automatically download it
          
          if ( document.getElementById("errors").innerHTML === "" ) {
            document.getElementById("errors").innerHTML = "no errors detected";
          }

          var pom = document.createElement('a');
          pom.setAttribute('href', window.URL.createObjectURL(new Blob([e.data.msg], {type: 'text/csv'})));
          pom.setAttribute('download', '[hashed] ' + filename.replace('.tsv', '.csv'));

          document.body.appendChild(pom);
          document.getElementById("progress").innerHTML += '\n' + 'file ready!';
          pom.click();
          document.body.removeChild(pom);
          break;
        case 'progress':
          // Display the progress
          document.getElementById("progress").innerHTML = e.data.msg;
          break;
        case 'error':
          // Log any errors
          document.getElementById("errors").innerHTML += e.data.msg + '\n';
          break;
      }
    }, false);
  }

  reader.readAsText(document.getElementById('fileinput').files[0]);
});
