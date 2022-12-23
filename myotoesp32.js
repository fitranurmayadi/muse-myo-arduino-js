var Myo = require('myo');
Myo.connect('com.stolksdorf.myAwesomeApp', require('ws'));

var udp = require('dgram');
var buffer = require('buffer');
var client = udp.createSocket('udp4');

var serverIP = '192.168.0.164';
var serverPort = 12345;


const fs = require('fs');
var posedata;
var data_send = "0:0:0";
var last_data_send = "0:0:0";
var lastTime = 0;

Myo.on('pose', function(pose_name){
    //console.log('Started ', pose_name);
    var d = new Date();
    posedata= d.getHours()+":"+ d.getMinutes() +":"+ d.getSeconds() +":"+d.getMilliseconds()+",";
    posedata += pose_name;
    posedata += '\r\n';
    console.log(posedata);
    fs.appendFile('myodatapose.csv', posedata, (err) => { 
      if (err) throw err; 
    });
});

Myo.on('double_tap', function(){
  console.log('RESET');
  this.zeroOrientation();
  send_udp("P:S:0\n"); //send to ESP32 P:pose G:
});

Myo.on('fist', function(){
  send_udp("P:G:0\n"); //send to ESP32 P:pose G:grip
});

Myo.on('fingers_spread', function(){
  send_udp("P:R:0\n"); //send to ESP32 P:pose R:release  
});

Myo.on('wave_in', function(){
  send_udp("P:F:0\n"); 
});

Myo.on('wave_out', function(){
  send_udp("P:B:0\n");
});

function send_udp(data){
  client.send(data,serverPort,serverIP,function(error){
  if(error){
    client.close();
  }else{
    console.log(data);
  }
  });
}

function kalk( x,  in_min,  in_max,  out_min,  out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

Myo.on('imu', function(data){ 
  var time = (new Date()).getTime();
  if(lastTime < time - 50){
    var orz = data.orientation.z.toFixed(2);
    var orzt = kalk(orz, -0.6, 0.6, 0, 180);
    var orx = data.orientation.y.toFixed(2);
    var orxt = kalk(orx, -0.6, 0.6, 0, 180);
    data_send = "M:"+orzt.toFixed()+":"+orxt.toFixed()+"\n";
    send_udp(data_send);
    lastTime = time;
  }
});
