///<reference path="../typings/lodash/lodash.d.ts" />

import _ = require('lodash');

export class MqttAdapter {

    config:Config;
    lastState:any = {};

    constructor(config:Config) {
        this.config = config;
    }

    public init() {

    }

    public publishState(nextState:any) {
        console.log('Publish state', nextState);

        _.merge(this.lastState, nextState, function (objectValue, sourceValue, key, object, source) {
            if ( !(_.isEqual(objectValue, sourceValue))) {

                console.log(key + "\n    Expected: " + sourceValue + "\n    Actual: " + objectValue);
            }
        });
    }
}


export class Config {
    host:string;
    port:number;
    topic:string;
}