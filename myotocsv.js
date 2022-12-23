var Myo = require('myo');
const fs = require('fs');
var emg;

var myMyo;

Myo.connect('com.fitra.nurmayadi', require('ws'));
Myo.on('connected', function(){   
    myMyo = this;
    addEvents(myMyo); 
});

var addEvents = function(myo){  
    myMyo.on('connected', function(){  
    	myMyo.streamEMG(true);
	});
	myMyo.on('emg', function(data){ 
		var d = new Date();
        emg = d.getHours()+":"+ d.getMinutes() +":"+ d.getSeconds() +":"+d.getMilliseconds()+",";
        emg += data;
        emg += '\r\n';
        console.log(emg);

        fs.appendFile('data_myo_seriously_feisal_22_design.txt', emg, (err) => { 
        if (err) throw err; 
        });  
	});
}