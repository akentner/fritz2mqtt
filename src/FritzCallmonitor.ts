///<reference path="../typings/node/node.d.ts" />
import { EventEmitter } from 'events';
import {Socket} from "net";
import tcp = require('net');
import moment = require('moment-timezone');

export class FritzCallmonitor extends EventEmitter {

    static REGEX_CALL = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CALL;(\d+);(\d+);(\d+);(\d+);/g; // datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;
    static REGEX_RING = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});RING;(\d+);(\d+);(\d+);(\w+);/g; // datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;Gateway;
    static REGEX_CONNECT = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});CONNECT;(\d+);(\d+);(\d+);/g;    // datum;CONNECT;ConnectionID;Nebenstelle;Nummer;
    static REGEX_DISCONNECT = /^(\d{2}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2});DISCONNECT;(\d+);(\d+);/g;       // datum;DISCONNECT;ConnectionID;dauerInSekunden;

    private connection:Socket;
    public state:State;
    private eventInterval;

    /**
     *
     * @param config
     */
    constructor(config:Config) {
        super();
        this.connection = tcp.connect(config.port, config.host, () => {
            this.emit('connect')
        });
        this.connection.on('data', (data) => {
            var parsed;

            if (parsed = FritzCallmonitor.REGEX_CALL.exec(data)) {
                this.handleCall(parsed);
            }
            if (parsed = FritzCallmonitor.REGEX_RING.exec(data)) {
                this.handleRing(parsed);
            }
            if (parsed = FritzCallmonitor.REGEX_CONNECT.exec(data)) {
                this.handleConnect(parsed);
            }
            if (parsed = FritzCallmonitor.REGEX_DISCONNECT.exec(data)) {
                this.handleDisconnect(parsed);
            }
        });
        this.connection.on('end', () => {
            this.emit('disconnect')
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
            callingNumber: parsed[4],
            calledNumber: parsed[5]
        };

        this.state.connection[event.connectionId] = event;
        this.state.lastEvent = event;
        this.state.lastCall = event;

        this.emit('change');
    }

    private handleRing(parsed) {
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'ring',
            connectionId: parseInt(parsed[2]),
            callingNumber: parsed[3],
            calledNumber: parsed[4],
            gateway: parsed[5],
            duration: 0,
        };

        this.state.connection[event.connectionId] = event;
        this.state.lastEvent = event;
        this.state.lastRing = event;

        if (this.eventInterval[event.connectionId]) clearTimeout(this.eventInterval[event.connectionId]);
        this.eventInterval[event.connectionId] = setInterval(() => {
            event.duration = event.duration++;
            this.emit('change');
        });

        this.emit('change');
    }

    /**
     *
     * @param parsed
     */
    private handleConnect(parsed) {
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'connect',
            connectionId: parseInt(parsed[2]),
            extension: '' + parsed[3],
            callingNumber: '' + parsed[4],
            duration: 0,
        };

        this.state.connection[event.connectionId] = event;
        this.state.lastEvent = event;
        this.state.lastConnect = event;

        if (this.eventInterval[event.connectionId]) clearTimeout(this.eventInterval[event.connectionId]);
        this.eventInterval[event.connectionId] = setInterval(() => {
            event.duration = event.duration++;
            this.emit('change');
        });

        this.emit('change');
    }

    /**
     *
     * @param parsed
     */
    private handleDisconnect(parsed) {
        var event = {
            ts: this.getTimestamp(parsed[1]),
            type: 'disconnect',
            connectionId: parseInt(parsed[2]),
            duration: parseInt(parsed[3])
        };

        this.state.connection[event.connectionId] = null;
        this.state.lastEvent = event;
        this.state.lastDisconnect = event;

        this.emit('change');
    }

    /**
     *
     * @param dateStr
     * @returns {number}
     */
    private getTimestamp(dateStr:string) {
        return parseInt(moment.tz(dateStr, 'DD.MM.YY HH:mm:ss', 'Europe/Berlin').format('X'));
    }

}

interface Config {
    port: number,
    host: string
}

interface State {
    connection: any;
    lastEvent: any;
    lastCall: any;
    lastRing: any;
    lastConnect: any;
    lastDisconnect: any
}
