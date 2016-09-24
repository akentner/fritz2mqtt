"use strict";
///<reference path="../typings/node/node.d.ts" />
const Callmonitor_1 = require('./Callmonitor');
const MqttAdapter_1 = require('./MqttAdapter');
class Fritz2Mqtt {
    constructor(config) {
        this.state = new State();
        this.mqttAdapter = new MqttAdapter_1.MqttAdapter(config.mqttAdapter);
        this.mqttAdapter.config.statePaths = [
            'devices/*',
            'connection/*',
            'lastCall',
            'lastRing',
            'lastConnect',
            'lastDisconnect',
        ];
        this.callmonitor = new Callmonitor_1.Callmonitor(config.callmonitor);
        this.callmonitor.on('change', () => {
            this.state.devices = this.callmonitor.state.devices;
            this.state.connection = this.callmonitor.state.connection;
            this.state.lastCall = this.callmonitor.state.lastCall;
            this.state.lastRing = this.callmonitor.state.lastRing;
            this.state.lastConnect = this.callmonitor.state.lastConnect;
            this.state.lastDisconnect = this.callmonitor.state.lastDisconnect;
            this.mqttAdapter.publishState(this.state);
        }).on('event', () => {
            this.state.lastEvent = this.callmonitor.state.lastEvent;
            this.state.history.push(this.callmonitor.state.lastEvent);
            this.state.history = this.state.history.splice(100);
        }).on('connect', () => {
            console.log('fritz connected');
        }).on('disconnect', () => {
            console.log('fritz disconnected');
        });
    }
    main() {
        console.log('start Fritz2Mqtt');
        this.mqttAdapter.init();
        this.callmonitor.init();
    }
}
exports.Fritz2Mqtt = Fritz2Mqtt;
class State {
    constructor() {
        this.devices = {};
        this.connection = {};
        this.lastEvent = {};
        this.lastCall = {};
        this.lastRing = {};
        this.lastConnect = {};
        this.lastDisconnect = {};
        this.history = [];
    }
}
exports.State = State;
class Config {
}
exports.Config = Config;
