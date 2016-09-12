///<reference path="../typings/node/node.d.ts" />
import {FritzCallmonitor, Config} from 'FritzCallmonitor';

export default class Fritz2Mqtt {

    fritzCallmonitor:FritzCallmonitor;

    constructor() {

        var config

        this.fritzCallmonitor = new FritzCallmonitor()


    }

    main() {
        var i = 0;

        this.emit('data', 'start');

        setInterval(() => {
            i++;

            this.emit('data', i);
            console.log('runs app ' + i);
        }, 5000);
    }
}
