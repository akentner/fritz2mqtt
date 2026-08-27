"use strict";
const Fritz2Mqtt_1 = require('./Fritz2Mqtt');
const Callmonitor_1 = require('./Callmonitor');
const MqttAdapter_1 = require('./MqttAdapter');
const argv = require('yargs')
    .option('fritzbox-host', {
    describe: 'Fritz!Box host name/ip address',
    demandOption: true
})
    .option('fritzbox-port', {
    describe: 'Fritz!Box port',
    default: 1012
})
    .option('mqtt-brokerurl', {
    describe: 'MQTT Brocker url (e.g. tcp://192.168.50.88:1883)',
    demandOption: true,
    example: ''
})
    .option('mqtt-topic', {
    describe: 'MQTT topic prefix',
    default: 'callmonitor'
})
    .option('countrycode', {
    describe: 'Country code',
    default: '+49'
})
    .option('areacode', {
    describe: 'Area code',
    default: '6181'
})
    .argv;
var config = new Fritz2Mqtt_1.Config();
config.callmonitor = new Callmonitor_1.Config(argv['fritzbox-host'], argv['fritzbox-port']);
config.callmonitor.countryCode = argv.countrycode;
config.callmonitor.areaCode = argv.areacode;
//upcoming feature
config.callmonitor.devices = [];
config.mqttAdapter = new MqttAdapter_1.Config(argv['mqtt-brokerUrl'], argv['mqtt-topic']);
var app = new Fritz2Mqtt_1.Fritz2Mqtt(config);
app.main();
