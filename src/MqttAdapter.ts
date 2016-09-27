///<reference path="../typings/lodash/lodash.d.ts" />
///<reference path="../typings/mqtt/mqtt.d.ts" />

import _ = require('lodash');
import mqtt = require('mqtt');
import { State, Event } from './Callmonitor';

export class MqttAdapter {

    config:Config;
    lastState:State;

    private client:mqtt.Client;

    constructor(config:Config) {
        this.config = config;
    }

    public init() {
        this.client = mqtt.connect(this.config.brokerUrl, this.config.options);
        this.client.on('connect', () => {
            this.client.publish(this.config.topic + '/connect', '1', {qos: 0, retain: true})
        });
    }

    /**
     *
     * @param event
     */
    public publishEvent(event:Event) {
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


export class Config {
    brokerUrl:string;
    topic:string;
    options:any;
    statePaths:any;

    constructor(brokerUrl:string, topic:string, options?:any) {
        this.brokerUrl = brokerUrl;
        this.topic = topic;
        this.options = {
            protocolId: 'MQIsdp',
            protocolVersion: 3,
            will: {topic: topic + '/connect', payload: null, qos: 0, retain: true}
        };
    }
}