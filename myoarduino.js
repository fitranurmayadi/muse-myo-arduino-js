var Myo = require('myo');
Myo.connect('com.fitra.nurmayadi', require('ws'));

var myMyo;

Myo.on('connected', function(){  
    myMyo = this;
    addEvents(myMyo);
});
var addEvents = function(myo){  
    myMyo.on('connected', function(){  
    	myMyo.streamEMG(true);
	});
	myMyo.on('emg', function(data){  
		var a = data;
    	console.log(a);
	});	
}

