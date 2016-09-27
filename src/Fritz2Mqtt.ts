///<reference path="../typings/node/node.d.ts" />
import { Callmonitor, Event, Config as CallmonitorConfig} from './Callmonitor';
import { MqttAdapter, Config as MqttAdapterConfig} from './MqttAdapter';

export class Fritz2Mqtt {

    private callmonitor:Callmonitor;
    private mqttAdapter:MqttAdapter;
    state:State = new State();

    constructor(config:Config) {
        this.mqttAdapter = new MqttAdapter(config.mqttAdapter);
        this.mqttAdapter.config.statePaths = [
            'extension/*',
            'connection/*',
            'lastCall',
            'lastRing',
            'lastConnect',
            'lastDisconnect',
        ];

        this.callmonitor = new Callmonitor(config.callmonitor);
        this.callmonitor.on('event', () => {

            console.log('onEvent', this.state.lastEvent);


            this.state.extension = this.callmonitor.state.extension;
            this.state.connection = this.callmonitor.state.connection;
            this.state.lastCall = this.callmonitor.state.lastCall;
            this.state.lastRing = this.callmonitor.state.lastRing;
            this.state.lastConnect = this.callmonitor.state.lastConnect;
            this.state.lastDisconnect = this.callmonitor.state.lastDisconnect;
            this.state.lastEvent = this.callmonitor.state.lastEvent;
            this.state.history.push(this.callmonitor.state.lastEvent);
            this.state.history = this.state.history.splice(100);
            this.mqttAdapter.publishEvent(this.state.lastEvent);
        }).on('connect', () => {
            console.log('fritz connected');
        }).on('disconnect', () => {
            console.log('fritz disconnected');
        });
    }

    public main() {
        console.log('start Fritz2Mqtt');
        this.mqttAdapter.init();
        this.callmonitor.init();
    }
}

export class State {
    extension:any = {};
    devices:any = {};
    connection:any = {};
    lastEvent:any = {};
    lastCall:any = {};
    lastRing:any = {};
    lastConnect:any = {};
    lastDisconnect:any = {};
    history:any[] = [];
}

export class Config {
    callmonitor:CallmonitorConfig;
    mqttAdapter:MqttAdapterConfig;
}