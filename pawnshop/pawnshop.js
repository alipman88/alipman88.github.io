function calc() {

	$('#results').html("");

	array = [['aaron' , $('#aaron').val().replace('$','')],['abby'  , $('#abby').val().replace('$','')],['coori' , $('#coori').val().replace('$','')],['zach'  , $('#zach').val().replace('$','')]];

	var sum = 0;
	var length = 0;
	array.forEach(function(e) {
		sum += parseInt(e[1]);
		length += 1;
	});

	var avg = sum / length;

	$('#results').append("----------------<br>");
	$('#results').append("total utilities: $" + sum.toFixed(2) + "<br>");
	$('#results').append("individual share: $" + avg.toFixed(2) + "<br>");
	$('#results').append("----------------<br>");

	for (i = 0; i < length; i++) {
		array[i][1] = avg - array[i][1];
	}

	array.sort(function(a,b){return b[1] - a[1]});

	length = 0;
	var owing = [];
	var owed  = [];

	array.forEach(function(e) {
		if (e[1] > 0) {
			length += 1;
			owing.push(e);
		}
		else if (e[1] < 0) {
			owed.push(e);
		}
	});

	owed.forEach(function(e) {
		$('#results').append(e[0] + " is owed $" + Math.abs(e[1]).toFixed(2) + "<br>");
	});
	$('#results').append("----------------<br>");

	owing.forEach(function(e) {
		$('#results').append(e[0] + " owes $" + Math.abs(e[1]).toFixed(2) + "<br>");
	});
	$('#results').append("----------------<br>");

	for (i = -1; i < length; i++) {
		if (Math.abs(owing.slice(-1)[0][1]) < Math.abs(owed.slice(-1)[0][1])) {
			owed.slice(-1)[0][1] += owing.slice(-1)[0][1]
			$('#results').append(owing.slice(-1)[0][0] + " pays " + owed.slice(-1)[0][0] + " $" + Math.abs(owing.slice(-1)[0][1]).toFixed(2) + "<br>");
			owing.pop();
			$('#results').append("----------------<br>");
		} else {
			owing.slice(-1)[0][1] += owed.slice(-1)[0][1]
			$('#results').append(owing.slice(-1)[0][0] + " pays " + owed.slice(-1)[0][0] + " $" + Math.abs(owed.slice(-1)[0][1]).toFixed(2) + "<br>");
			owed.pop();
		}
	}
}