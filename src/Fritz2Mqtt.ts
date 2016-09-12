///<reference path="../typings/node/node.d.ts" />
import { FritzCallmonitor, Config } from 'FritzCallmonitor';

export default class Fritz2Mqtt {

    fritzCallmonitor:FritzCallmonitor;

    constructor() {

        var config = new Config();
        config.host = '192.168.178.1';
        config.port = 1012;

        this.fritzCallmonitor = new FritzCallmonitor(config);

        this.fritzCallmonitor.on('change', () => {
            console.log(this.fritzCallmonitor.state);
        });
        this.fritzCallmonitor.on('connect', () => {
            console.log('fritz disconnected');
        });
        this.fritzCallmonitor.on('connect', () => {
            console.log('fritz disconnected');
        });

    }

    public main() {
        console.log('start Fritz2Mqtt');
        this.fritzCallmonitor.init();
    }
}
