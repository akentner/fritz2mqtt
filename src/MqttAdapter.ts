///<reference path="../typings/lodash/lodash.d.ts" />
///<reference path="../typings/mqtt/mqtt.d.ts" />

import _ = require('lodash');
import mqtt = require('mqtt');
import { State } from './Callmonitor';

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

    public publishState(nextState:State) {
        console.log('Publish state', nextState);

        this.conditionalPublishStatePart(nextState, 'lastEvent');
        this.conditionalPublishStatePart(nextState, 'lastCall');
        this.conditionalPublishStatePart(nextState, 'lastRing');
        this.conditionalPublishStatePart(nextState, 'lastConnect');
        this.conditionalPublishStatePart(nextState, 'lastDisconnect');

        this.lastState = _.cloneDeep(nextState);
    }

    private conditionalPublishStatePart(nextState:State, path:string) {

        //var



        if (!this.lastState || this.lastState[path] !== nextState[path]) {
            this.client.publish(this.config.topic + '/status/' + path, JSON.stringify(nextState[path]), {
                qos: 0,
                retain: true
            });
        }
    };

    private index(obj, path, value) {
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