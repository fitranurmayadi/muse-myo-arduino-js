const fs = require('fs');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/COM4', { baudRate: 115200 })

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
parser.on('data', onData);

var hms_data
function onData(data){
	var d = new Date();
    hms_data = d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() +":"+ d.getMilliseconds()+",";
    hms_data += data;
    hms_data += '\r\n';
    console.log(hms_data);
	fs.appendFile('biosensor_fitra_robot1.csv', hms_data, (err) => { 
        if (err) throw err; 
        });
}
