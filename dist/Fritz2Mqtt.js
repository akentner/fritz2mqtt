"use strict";
///<reference path="../typings/node/node.d.ts" />
const Callmonitor_1 = require('./Callmonitor');
const MqttAdapter_1 = require('./MqttAdapter');
class Fritz2Mqtt {
    constructor() {
        this.state = new State();
        var callmonitorConfig = new Callmonitor_1.Config('192.168.178.1');
        callmonitorConfig.areaCode = '6181';
        var mqttAdapterConfig = new MqttAdapter_1.Config();
        this.callmonitor = new Callmonitor_1.Callmonitor(callmonitorConfig);
        this.callmonitor.on('change', () => {
            this.state.connection = this.callmonitor.state.connection;
            this.state.lastCall = this.callmonitor.state.lastCall;
            this.state.lastRing = this.callmonitor.state.lastRing;
            this.state.lastConnect = this.callmonitor.state.lastConnect;
            this.state.lastDisconnect = this.callmonitor.state.lastDisconnect;
            this.mqttAdapter.publishState(this.state);
        }).on('event', () => {
            this.state.lastEvent = this.callmonitor.state.lastEvent;
            this.state.history.push(this.callmonitor.state.lastEvent);
            //this.state.history = this.state.history.splice(100);
        }).on('connect', () => {
            console.log('fritz connected');
        }).on('disconnect', () => {
            console.log('fritz disconnected');
        });
        this.mqttAdapter = new MqttAdapter_1.MqttAdapter(mqttAdapterConfig);
    }
    main() {
        console.log('start Fritz2Mqtt');
        this.mqttAdapter.init();
        this.callmonitor.init();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Fritz2Mqtt;
class State {
    constructor() {
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
