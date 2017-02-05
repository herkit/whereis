//1203292316,0031698765432,GPRMC,211657.000,A,5213.0247,N,00516.7757,E,0.00,273.30,290312,,,A*62,F,imei:123456789012345,123

var net = require('net');

var client = new net.Socket();
client.connect(5007, '127.0.0.1', function() {
  console.log('Connected');
  //client.write('1203292316,0031698765432,GPRMC,211657.000,A,5213.0247,N,00516.7757,E,0.00,273.30,290312,,,A*62,F,imei:123456789012345,123');
  client.write('(087073819397BR00170205A6022.8269N00518.7227E000.3172029000.00,00000000L00000000)');  
});

client.on('data', function(data) {
  console.log('Received: ' + data);
  client.destroy(); // kill client after server's response
});

client.on('close', function() {
  console.log('Connection closed');
});