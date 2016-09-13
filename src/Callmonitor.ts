///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/moment-timezone/moment-timezone.d.ts" />
///<reference path="../typings/object-assign/object-assign.d.ts" />
import { EventEmitter } from 'events';
import {Socket} from "net";
import tcp = require('net');
import moment = require('moment-timezone');
import assign = require('object-assign');

export class Callmonitor extends EventEmitter {

    static REGEX_CALL = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CALL;(\d+);(\d+);(\d+);(\d+);/g; // datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;
    static REGEX_RING = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});RING;(\d+);(\d+);(\d+);(\w+);/g; // datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;Gateway;
    static REGEX_CONNECT = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CONNECT;(\d+);(\d+);(\d+);/g; // datum;CONNECT;ConnectionID;Nebenstelle;Nummer;
    static REGEX_DISCONNECT = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});DISCONNECT;(\d+);(\d+);/g; // datum;DISCONNECT;ConnectionID;dauerInSekunden;

    private config:Config;
    private connection:Socket;
    public state:State = new State();
    private eventInterval:any = {};

    /**
     *
     * @param config
     */
    constructor(config:Config) {
        super();
        this.config = config;
    }

    public init() {
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
        }

        this.connection = tcp.connect(this.config.port, this.config.host, () => {
            this.emit('connect')
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
    private handleCall(parsed) {
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'call',
            connectionId: parseInt(parsed[2]),
            extension: parsed[3],
            callingNumber: this.formatNumber(parsed[4]),
            calledNumber: this.formatNumber(parsed[5]),
            duration: 1
        };

        this.state.connection[event.connectionId] = event;
        this.setLastEvent(event);
        this.state.lastCall = event;

        if (this.eventInterval[event.connectionId]) clearTimeout(this.eventInterval[event.connectionId]);
        this.eventInterval[event.connectionId] = setInterval(() => {
            event.duration++;
            this.emit('change');
        }, 1000);

        this.emit('change');
    }

    private handleRing(parsed) {
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'ring',
            connectionId: parseInt(parsed[2]),
            callingNumber: this.formatNumber(parsed[3]),
            calledNumber: this.formatNumber(parsed[4]),
            gateway: parsed[5],
            duration: 0,
        };

        this.state.connection[event.connectionId] = event;
        this.setLastEvent(event);
        this.state.lastRing = event;

        if (this.eventInterval[event.connectionId]) clearTimeout(this.eventInterval[event.connectionId]);
        this.eventInterval[event.connectionId] = setInterval(() => {
            event.duration++;
            this.emit('change');
        }, 1000);

        this.emit('change');
    }

    /**
     *
     * @param parsed
     */
    private handleConnect(parsed) {
        let connectionId = parseInt(parsed[2]);
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'connect',
            connectionId: connectionId,
            extension: '' + parsed[3],
            callingNumber: this.state.connection[connectionId].callingNumber,
            calledNumber: this.state.connection[connectionId].calledNumber,
            duration: 0,
        };

        this.state.connection[event.connectionId] = event;
        this.setLastEvent(event);
        this.state.lastConnect = event;

        if (this.eventInterval[event.connectionId]) clearTimeout(this.eventInterval[event.connectionId]);
        this.eventInterval[event.connectionId] = setInterval(() => {
            event.duration++;
            this.emit('change');
        }, 1000);

        this.emit('change');
    }

    /**
     *
     * @param parsed
     */
    private handleDisconnect(parsed) {
        let connectionId = parseInt(parsed[2]);
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'disconnect',
            connectionId: parseInt(parsed[2]),
            extension: this.state.connection[connectionId].extension,
            callingNumber: this.state.connection[connectionId].callingNumber,
            calledNumber: this.state.connection[connectionId].calledNumber,
            duration: parseInt(parsed[3]),
        };

        this.state.connection[event.connectionId] = null;
        this.setLastEvent(event);
        this.state.lastDisconnect = event;
        if (this.eventInterval[event.connectionId]) clearTimeout(this.eventInterval[event.connectionId]);

        this.emit('change');
    }

    /**
     *
     * @param event
     */
    private setLastEvent(event) {
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
    private getTimestamp(dateStr:string) {
        return parseInt(moment.tz(dateStr, 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'));
    }

    /**
     *
     * @param number
     * @returns {string}
     */
    private formatNumber(number:string) {
        if (number.length < 10) {
            number = this.config.countryCode + this.config.areaCode + number;
        }
        number = number.replace(/^0/, this.config.countryCode);

        return number;
    }
}

export class Config {
    port:number;
    host:string;
    areaCode:string;
    areaAccessCode:string = '0';
    countryCode:string = '+49';

    constructor(host:string, port?:number) {
        this.host = host;
        this.port = port || 1012;
    }
}

export class State {
    connection:any = {};
    lastEvent:any;
    lastCall:any;
    lastRing:any;
    lastConnect:any;
    lastDisconnect:any
}
