///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/moment-timezone/moment-timezone.d.ts" />
///<reference path="../typings/object-assign/object-assign.d.ts" />
"use strict";
const events_1 = require('events');
const tcp = require('net');
const moment = require('moment-timezone');
const assign = require('object-assign');
class Callmonitor extends events_1.EventEmitter {
    /**
     *
     * @param config
     */
    constructor(config) {
        super();
        this.state = new State();
        this.eventInterval = {};
        this.config = config;
    }
    init() {
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
        }
        this.connection = tcp.connect(this.config.port, this.config.host, () => {
            this.emit('connect');
        });
        this.connection.on('data', (data) => {
            var parsed;
            if (parsed = Callmonitor.REGEX_CALL.exec(data)) {
                this.handleCall(parsed);
            }
            if (parsed = Callmonitor.REGEX_RING.exec(data)) {
                this.handleRing(parsed);
            }
            if (parsed = Callmonitor.REGEX_CONNECT.exec(data)) {
                this.handleConnect(parsed);
            }
            if (parsed = Callmonitor.REGEX_DISCONNECT.exec(data)) {
                this.handleDisconnect(parsed);
            }
        });
        this.connection.on('end', () => {
            this.emit('disconnect');
            setTimeout(() => {
                this.init();
            }, 5000);
        });
    }
    /**
     *
     * @param parsed
     */
    handleCall(parsed) {
        var event = {
            ts: Callmonitor.getTimestamp(parsed[1]),
            type: 'call',
            connectionId: parseInt(parsed[2]),
            extension: parsed[3],
            callingNumber: this.formatNumber(parsed[4]),
            calledNumber: this.formatNumber(parsed[5]),
            duration: 1
        };
        this.state.lastCall = event;
        this.state.lastRing = event;
        this.handleEvent(event);
    }
    /**
     *
     * @param parsed
     */
    handleRing(parsed) {
        var event = {
            ts: Callmonitor.getTimestamp(parsed[1]),
            type: 'ring',
            connectionId: parseInt(parsed[2]),
            callingNumber: this.formatNumber(parsed[3]),
            calledNumber: this.formatNumber(parsed[4]),
            gateway: parsed[5],
            extension: null,
            duration: 0,
        };
        this.state.lastRing = event;
        this.handleEvent(event);
    }
    /**
     *
     * @param parsed
     */
    handleConnect(parsed) {
        let connectionId = parseInt(parsed[2]);
        var event = {
            ts: Callmonitor.getTimestamp(parsed[1]),
            type: 'connect',
            connectionId: connectionId,
            extension: '' + parsed[3],
            callingNumber: this.state.connection[connectionId].callingNumber,
            calledNumber: this.state.connection[connectionId].calledNumber,
            duration: 0,
        };
        this.state.lastConnect = event;
        this.handleEvent(event);
    }
    /**
     *
     * @param parsed
     */
    handleDisconnect(parsed) {
        let connectionId = parseInt(parsed[2]);
        var event = {
            ts: Callmonitor.getTimestamp(parsed[1]),
            type: 'disconnect',
            connectionId: parseInt(parsed[2]),
            extension: this.state.connection[connectionId].extension,
            callingNumber: this.state.connection[connectionId].callingNumber,
            calledNumber: this.state.connection[connectionId].calledNumber,
            duration: parseInt(parsed[3]),
        };
        this.state.lastDisconnect = event;
        this.handleEvent(event);
    }
    /**
     *
     * @param event
     */
    handleEvent(event) {
        this.state.connection[event.connectionId] = event.type !== 'disconnect' ? event : null;
        this.state.extension[event.extension] = event.type !== 'disconnect' ? event : null;
        this.setLastEvent(event);
        if (this.eventInterval[event.connectionId])
            clearTimeout(this.eventInterval[event.connectionId]);
        if (event.type !== 'disconnect') {
            this.eventInterval[event.connectionId] = setInterval(() => {
                event.duration++;
                this.emit('event', event);
            }, 1000);
        }
        this.emit('event', event);
    }
    ;
    /**
     *
     * @param event
     */
    setLastEvent(event) {
        let lastEvent = assign({}, event);
        if (event.type !== 'disconnect') {
            delete lastEvent.duration;
        }
        this.state.lastEvent = lastEvent;
        this.emit('event');
    }
    /**
     *
     * @param dateStr
     * @returns {number}
     */
    static getTimestamp(dateStr) {
        return parseInt(moment.tz(dateStr, 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'));
    }
    /**
     *
     * @param number
     * @returns {string}
     */
    formatNumber(number) {
        if (number.length < 10) {
            number = this.config.countryCode + this.config.areaCode + number;
        }
        number = number.replace(/^0/, this.config.countryCode);
        return number;
    }
}
Callmonitor.REGEX_CALL = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CALL;(\d+);(\d+);(\d+);(\d+);/g; // datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;
Callmonitor.REGEX_RING = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});RING;(\d+);(\d+);(\d+);(\w+);/g; // datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;Gateway;
Callmonitor.REGEX_CONNECT = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CONNECT;(\d+);(\d+);(\d+);/g; // datum;CONNECT;ConnectionID;Nebenstelle;Nummer;
Callmonitor.REGEX_DISCONNECT = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});DISCONNECT;(\d+);(\d+);/g; // datum;DISCONNECT;ConnectionID;dauerInSekunden;
exports.Callmonitor = Callmonitor;
class Config {
    constructor(host, port) {
        this.areaAccessCode = '0';
        this.countryCode = '+49';
        this.host = host;
        this.port = port || 1012;
    }
}
exports.Config = Config;
class State {
    constructor() {
        this.connection = {};
        this.extension = {};
    }
}
exports.State = State;
