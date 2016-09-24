///<reference path="../typings/lodash/lodash.d.ts" />
///<reference path="../typings/mqtt/mqtt.d.ts" />
"use strict";
const _ = require('lodash');
const mqtt = require('mqtt');
class MqttAdapter {
    constructor(config) {
        this.config = config;
    }
    init() {
        this.client = mqtt.connect(this.config.brokerUrl, this.config.options);
        this.client.on('connect', () => {
            this.client.publish(this.config.topic + '/connect', '1', { qos: 0, retain: true });
        });
    }
    publishState(nextState) {
        console.log('Publish state', nextState);
        this.conditionalPublishStatePart(nextState, 'lastEvent');
        this.conditionalPublishStatePart(nextState, 'lastCall');
        this.conditionalPublishStatePart(nextState, 'lastRing');
        this.conditionalPublishStatePart(nextState, 'lastConnect');
        this.conditionalPublishStatePart(nextState, 'lastDisconnect');
        this.lastState = _.cloneDeep(nextState);
    }
    conditionalPublishStatePart(nextState, path) {
        //var
        if (!this.lastState || this.lastState[path] !== nextState[path]) {
            this.client.publish(this.config.topic + '/status/' + path, JSON.stringify(nextState[path]), {
                qos: 0,
                retain: true
            });
        }
    }
    ;
    index(obj, path, value) {
        if (typeof path == 'string')
            return this.index(obj, path.split('.'), value);
        else if (path.length == 1 && value !== undefined)
            return obj[path[0]] = value;
        else if (path.length == 0)
            return obj;
        else
            return this.index(obj[path[0]], path.slice(1), value);
    }
}
exports.MqttAdapter = MqttAdapter;
class Config {
    constructor(brokerUrl, topic, options) {
        this.brokerUrl = brokerUrl;
        this.topic = topic;
        this.options = {
            protocolId: 'MQIsdp',
            protocolVersion: 3,
            will: { topic: topic + '/connect', payload: null, qos: 0, retain: true }
        };
    }
}
exports.Config = Config;
