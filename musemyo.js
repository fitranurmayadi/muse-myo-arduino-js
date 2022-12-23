var osc = require("osc");
var Myo = require('myo');
const fs = require('fs');
var eeg;
var emg;
let data;
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
    var punchTime = 0;  
    
    myMyo.on('emg', function(data){  
        var a = data;
        console.log(a);
    });    
}

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

udpPort.on("message", function (oscMessage) {
    if(oscMessage.address == '/muse/eeg'){
        data = oscMessage.args;
        data += '\r\n';
        console.log(oscMessage.args); 
        fs.appendFile('Output.txt', data, (err) => { 
        if (err) throw err; 
        })  
    }

});

udpPort.on("error", function (err) {
    console.log(err);
});

udpPort.open();