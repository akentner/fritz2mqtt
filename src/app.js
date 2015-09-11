var mqtt    = require('mqtt');
var tcp = require('net');

var fritzConnection;
var mqttConnection;

mqttConnection = mqtt.connect('tcp://localhost:1883', {will: {topic: "fritz/connect", payload: "0", qos: 1}});

mqttConnection.on('connect', function () {

    fritzConnection = tcp.connect('80', 'localhost');

    fritzConnection.on('data', function(data) {
        console.log('callmonitor:','' + data);

        mqttConnection.publish('fritz/connect', '1');

    }).on('connect', function() {
        mqttConnection.publish('fritz/connect', '1');
    }).on('end', function() {
        console.log('Disconnected');
    });


});

mqttConnection.on('reconnect', function () {
    mqttConnection.publish('fritz/connect', '1');
});

mqttConnection.on('close', function () {
    console.log('close');
});

mqttConnection.on('error', function (error) {
    console.log(error);
});

mqttConnection.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString());
    //client.end();
});


