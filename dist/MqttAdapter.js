///<reference path="../typings/lodash/lodash.d.ts" />
///<reference path="../typings/mqtt/mqtt.d.ts" />
"use strict";
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
    /**
     *
     * @param event
     */
    publishEvent(event) {
        console.log('Publish event', event);
        let message = JSON.stringify(event);
        let options = {
            qos: 0,
            retain: true
        };
        this.client.publish(this.config.topic + '/status/extension/' + event.extension, message, options);
        this.client.publish(this.config.topic + '/status/connection/' + event.connectionId, message, options);
        this.client.publish(this.config.topic + '/status/last/' + event.type, message, options);
        this.client.publish(this.config.topic + '/status/last/event', message, options);
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
