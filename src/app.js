var mqtt    = require('mqtt');
var tcp = require('net');

var fritzConnection;
var mqttConnection;

mqttConnection = mqtt.connect('tcp://localhost:1883', {
    protocolId: 'MQIsdp',
    protocolVersion: 3, 
    will: {topic: "fritz/connect", payload: "0", qos: 1}
});

mqttConnection.on('connect', function () {

    fritzConnection = tcp.connect('1012', '192.168.178.1');

    fritzConnection.on('data', function(data) {

        


        mqttConnection.publish('fritz/callmonitor/', data);
    }).on('connect', function() {
        console.log('callmonitor connect');
        mqttConnection.publish('fritz/callmonitor/connect', '1');
    }).on('end', function() {
        mqttConnection.publish('fritz/callmonitor/connect', '0');
    });

});

mqttConnection.on('reconnect', function () {
    console.log('mqtt reconnect');
});

mqttConnection.on('close', function () {
    console.log('mqtt close');
});

mqttConnection.on('error', function (error) {
    console.log('mqtt error: ', error);
});

mqttConnection.on('message', function (topic, message) {
    console.log('mqtt message:', topic, message.toString());
});


