"use strict";
const Fritz2Mqtt_1 = require('./Fritz2Mqtt');
const Callmonitor_1 = require('./Callmonitor');
const MqttAdapter_1 = require('./MqttAdapter');
// todo: external config from command line, e .g. via yargs
var config = new Fritz2Mqtt_1.Config();
config.callmonitor = new Callmonitor_1.Config('192.168.178.1');
config.callmonitor.countryCode = '+49';
config.callmonitor.areaCode = '6181';
//upcoming feature
config.callmonitor.devices = [];
config.mqttAdapter = new MqttAdapter_1.Config('tcp://192.168.178.96:1883', 'callmonitor');
var app = new Fritz2Mqtt_1.Fritz2Mqtt(config);
app.main();
