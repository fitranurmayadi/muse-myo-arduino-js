var Myo = require('myo');

Myo.connect('com.stolksdorf.myAwesomeApp', require('ws'));

const SerialPort = require('serialport');
const port = new SerialPort('/COM9', { baudRate: 115200 });

port.on("open", () => {
  console.log('serial port open');
});


Myo.on('double_tap', function(){
	console.log('RESET');
	this.zeroOrientation();
});

Myo.on('imu', function(data){
	port.write("P:G:0\n", (err) => {
  	});	
});