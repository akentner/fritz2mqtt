var mqtt    = require('mqtt');
var tcp = require('net');

var fritzConnection;
var mqttConnection;

var regexCall       = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CALL;(.+);(.+);(.+);(.+);/g; // datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;
var regexRing       = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});RING;(.+);(.+);(.+);/g;      // datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;
var regexConnect    = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CONNECT;(.+);(.+);(.+);/g;   // datum;CONNECT;ConnectionID;Nebenstelle;Nummer;
var regexDisconnect = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});DISCONNECT;(.+);(.+);/g;     // datum;DISCONNECT;ConnectionID;dauerInSekunden;

mqttConnection = mqtt.connect('tcp://localhost:1883', {
    protocolId: 'MQIsdp',
    protocolVersion: 3, 
    will: {topic: "fritz/connect", payload: "0", qos: 1}
});

mqttConnection.on('connect', function () {

    fritzConnection = tcp.connect('1012', '192.168.178.1');

    fritzConnection.on('data', function(data) {

        var parsed = [];

        if (parsed = regexCall.exec(data)) {
            console.log('CALL', parsed);
        }
        if (parsed = regexRing.exec(data)) {
            console.log('RING', parsed);
        }
        if (parsed = regexConnect.exec(data)) {
            console.log('CONNECT', parsed);
        }
        if (parsed = regexDisconnect.exec(data)) {
            console.log('DISCONNECT', parsed);
        }

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


