///<reference path="../typings/lodash/lodash.d.ts" />
"use strict";
const _ = require('lodash');
class MqttAdapter {
    constructor(config) {
        this.lastState = {};
        this.config = config;
    }
    init() {
    }
    publishState(nextState) {
        console.log('Publish state', nextState);
        _.merge(this.lastState, nextState, function (objectValue, sourceValue, key, object, source) {
            if (!(_.isEqual(objectValue, sourceValue))) {
                console.log(key + "\n    Expected: " + sourceValue + "\n    Actual: " + objectValue);
            }
        });
    }
}
exports.MqttAdapter = MqttAdapter;
class Config {
}
exports.Config = Config;
