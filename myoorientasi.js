var Myo = require('myo');

Myo.connect('com.stolksdorf.myAwesomeApp', require('ws'));

const SerialPort = require('serialport');
const port = new SerialPort('/COM13', { baudRate: 115200 }); // ganti '/COM9'dengan serial port arm robot

port.on("open", () => {
  console.log('serial port open');
});

Myo.on('double_tap', function(){
	console.log('RESET');
	this.zeroOrientation();
});

Myo.on('fist', function(){
	send_serial("P:G:0\n");
});

Myo.on('fingers_spread', function(){
	send_serial("P:R:0\n");
});

Myo.on('wave_in', function(){
	send_serial("P:T:0\n");
});

Myo.on('wave_out', function(){
	send_serial("P:N:0\n");
});

function send_serial(data){
	console.log(data);
	port.write(data, (err) => {
  	});	
}

function kalk( x,  in_min,  in_max,  out_min,  out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var data_send = "0:0:0";
var last_data_send = "0:0:0";
var lastTime = 0;
Myo.on('imu', function(data){ 
	var time = (new Date()).getTime();
	if(lastTime < time - 50){
		var orz = data.orientation.z.toFixed(2);
		var orzt = kalk(orz, -0.6, 0.6, 0, 180);
		var orx = data.orientation.y.toFixed(2);
		var orxt = kalk(orx, -0.6, 0.6, 0, 180);
		data_send = "M:"+orzt.toFixed()+":"+orxt.toFixed()+"\n"; //M:x:Z M:0:90
		send_serial(data_send);
		lastTime = time;
	}
});
