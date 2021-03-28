const { Worker, isMainThread, parentPort } = require('worker_threads');
const mqtt = require('mqtt');

var cloudMqttClient;

function main() {
    /* parentPort.on('message', (message) => {
        //deviceDataModel = message;
        console.log(message);
    }); */

    cloudMqttClient = mqtt.connect({
        host: "3.82.210.188",
        port: "11992",
        username: "hrvmbcju",
        password: "g7usW2NJz0H_",
        will: { topic: 'myFinalProject/server/properties/online', payload: 'false', qos: 2, retain: true }
    });

    cloudMqttClient.on('connect', function(){
        console.log('Cloud mqtt is connected');
        cloudMqttClient.publish('myFinalProject/server/properties/online', 'true', { qos: 2, retain: true });
    });
    cloudMqttClient.on('error', function (error) {
        console.log("ERROR: ", error);
    });
}

main();