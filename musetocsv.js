var osc = require('osc');
const fs = require('fs');
var eeg;
var data;

var getIPAddresses = function () {
    var os = require("os"),
        interfaces = os.networkInterfaces(),
        ipAddresses = [];

    for (var deviceName in interfaces) {
        var addresses = interfaces[deviceName];
        for (var i = 0; i < addresses.length; i++) {
            var addressInfo = addresses[i];
            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }
    return ipAddresses;
};

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 5000
});

udpPort.on("ready", function () {
    var ipAddresses = getIPAddresses();

    console.log("Listening for OSC over UDP.");
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udpPort.options.localPort);
    });
});

var a=0, b=0, c=0, d=0, e=0, f=0;
var data = [];
var datalog ='';
udpPort.on("message", function (oscMessage) { 
	if(oscMessage.address == '/muse/elements/alpha_absolute'){
		data[0] = oscMessage.args +',';
		a = 1;
	}if(oscMessage.address == '/muse/elements/beta_absolute'){
		data[1] = oscMessage.args+',';
		b = 1;	
	}if(oscMessage.address == '/muse/elements/delta_absolute'){
		data[2] = oscMessage.args+','; 
		c = 1;
	}if(oscMessage.address == '/muse/elements/theta_absolute'){
		data[3] = oscMessage.args+','; 
		d = 1;
	}if(oscMessage.address == '/muse/elements/gamma_absolute'){
		data[4] = oscMessage.args;
		e = 1; 
	}if(oscMessage.address == '/muse/elements/blink'){
		data[5] = oscMessage.args;
		f = 1; 
	}
	if(a==1 && b==1 && c==1 && d==1 && e==1 && f==1){
		var d = new Date();
        datalog = d.getHours()+":"+ d.getMinutes() +":"+ d.getSeconds() +":"+d.getMilliseconds()+",";
		for(var x=0; x<=5; x++){
			datalog += data[x];
		}
		datalog += '\r\n';
		fs.appendFile('DataPercobaanPakBai/attempt_WDG/attempt3_muse_WDG_14.csv', datalog, (err) => { 
        if (err) throw err; 
        });
		console.log(datalog);
		a=0, b=0, c=0, d=0, e=0;
		datalog = '';
	}
    /*if(oscMessage.address == '/muse/eeg'){ 
        var d = new Date();
        var millis = d.getMilliseconds();
        data = d.getHours()+":"+ d.getMinutes() +":"+ d.getSeconds() +":"+d.getMilliseconds()+",";
        data += oscMessage.args;
        data += '\n';

        console.log(data); 	
        fs.appendFile('data_muse.txt', data, (err) => { 
        if (err) throw err; 
        });
    }*/

});

udpPort.on("error", function (err) {
    console.log(err);
});

udpPort.open();