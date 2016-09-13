///<reference path="../typings/node/node.d.ts" />
import { Callmonitor, Config as CallmonitorConfig} from './Callmonitor';
import { MqttAdapter, Config as MqttAdapterConfig} from './MqttAdapter';

export default class Fritz2Mqtt {

    private callmonitor:Callmonitor;
    private mqttAdapter:MqttAdapter;
    state:State = new State();

    constructor() {
        var callmonitorConfig = new CallmonitorConfig('192.168.178.1');
        callmonitorConfig.areaCode = '6181';

        var mqttAdapterConfig = new MqttAdapterConfig();

        this.callmonitor = new Callmonitor(callmonitorConfig);
        this.callmonitor.on('change', () => {
            this.state.connection = this.callmonitor.state.connection;
            this.state.lastCall = this.callmonitor.state.lastCall;
            this.state.lastRing = this.callmonitor.state.lastRing;
            this.state.lastConnect = this.callmonitor.state.lastConnect;
            this.state.lastDisconnect = this.callmonitor.state.lastDisconnect;
            this.mqttAdapter.publishState(this.state);
        }).on('event', () => {
            this.state.lastEvent = this.callmonitor.state.lastEvent;
            this.state.history.push(this.callmonitor.state.lastEvent);
            //this.state.history = this.state.history.splice(100);
        }).on('connect', () => {
            console.log('fritz connected');
        }).on('disconnect', () => {
            console.log('fritz disconnected');
        });

        this.mqttAdapter = new MqttAdapter(mqttAdapterConfig);
    }

    public main() {
        console.log('start Fritz2Mqtt');
        this.mqttAdapter.init();
        this.callmonitor.init();
    }
}

export class State {
    connection:any = {};
    lastEvent:any = {};
    lastCall:any = {};
    lastRing:any = {};
    lastConnect:any = {};
    lastDisconnect:any = {};
    history:any[] = [];
}