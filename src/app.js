var mqtt   = require('mqtt');
var tcp    = require('net');
var moment = require('moment-timezone');

var fritzConnection;
var mqttConnection;

var regexCall       = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CALL;(\d+);(\d+);(\d+);(\d+);/g; // datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;
var regexRing       = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});RING;(\d+);(\d+);(\d+);(\w+);/g; // datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;Gateway;
var regexConnect    = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CONNECT;(\d+);(\d+);(\d+);/g;    // datum;CONNECT;ConnectionID;Nebenstelle;Nummer;
var regexDisconnect = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});DISCONNECT;(\d+);(\d+);/g;       // datum;DISCONNECT;ConnectionID;dauerInSekunden;

mqttConnection = mqtt.connect('tcp://localhost:1883', {
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    will: {topic: "fritz/callmonitor/connect", payload: "0", qos: 1, retain: true}
});

mqttConnection.on('connect', function () {

    fritzConnection = tcp.connect('1012', '192.168.178.1');

    fritzConnection.on('data', function(data) {

        var event = {};

        if (parsed = regexCall.exec(data)) {
            event = {
                ts: moment.tz(parsed[1], 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'),
                type: 'call',
                connectionId: parsed[2],
                extension: parsed[3],
                callingNumber: parsed[4],
                calledNumber: parsed[5]
            };
            console.log('CALL', event);
            mqttConnection.publish('fritz/callmonitor/connection/'+parsed[2]+'/call', JSON.stringify(event), {qos: 0, retain: true});
        }
        if (parsed = regexRing.exec(data)) {
            event = {
                ts: moment.tz(parsed[1], 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'),
                type: 'ring',
                connectionId: parsed[2],
                callingNumber: parsed[3],
                calledNumber: parsed[4],
                gateway: parsed[5]
            };
            console.log('RING', event);
            mqttConnection.publish('fritz/callmonitor/connection/'+parsed[2]+'/ring', JSON.stringify(event), {qos: 0, retain: true});
        }
        if (parsed = regexConnect.exec(data)) {
            event = {
                ts: moment.tz(parsed[1], 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'),
                type: 'connect',
                connectionId: parsed[2],
                extension: parsed[3],
                callingNumber: parsed[4]
            };
            console.log('CONNECT', event);
            mqttConnection.publish('fritz/callmonitor/connection/'+parsed[2]+'/connect', JSON.stringify(event), {qos: 0, retain: true});
        }
        if (parsed = regexDisconnect.exec(data)) {
            event = {
                ts: moment.tz(parsed[1], 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'),
                type: 'disconnect',
                connectionId: parsed[2],
                length: parsed[3]
            };
            console.log('DISCONNECT', event);
            mqttConnection.publish('fritz/callmonitor/connection/'+parsed[2]+'/disconnect', JSON.stringify(event), {qos: 0, retain: true});
        }

    }).on('connect', function() {
        console.log('callmonitor connect');
        mqttConnection.publish('fritz/callmonitor/connect', '1', {qos: 0, retain: true});
    }).on('end', function() {
        mqttConnection.publish('fritz/callmonitor/connect', '0', {qos: 0, retain: true});
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


