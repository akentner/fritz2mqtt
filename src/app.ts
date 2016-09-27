import { Fritz2Mqtt, Config } from './Fritz2Mqtt';
import { Config as CallmonitorConfig} from './Callmonitor';
import { Config as MqttAdapterConfig} from './MqttAdapter';


// todo: external config from command line, e .g. via yargs

var config = new Config();

config.callmonitor = new CallmonitorConfig('192.168.178.1');

config.callmonitor.countryCode = '+49';
config.callmonitor.areaCode = '6181';

//upcoming feature
config.callmonitor.devices = [
];

config.mqttAdapter = new MqttAdapterConfig('tcp://192.168.178.96:1883', 'callmonitor');

var app = new Fritz2Mqtt(config);
app.main();
