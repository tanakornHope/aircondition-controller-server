var mqtt = require('mqtt');
var mqtt2 = require('mqtt');
const fs = require('fs');
const editJsonFile = require("edit-json-file");
const { Worker, isMainThread, parentPort, MessageChannel } = require('worker_threads');
const { port1, port2 } = new MessageChannel();

var deviceDataModel = JSON.parse(fs.readFileSync("deviceDataModel.json"));
var mqttSubscribe = fs.readFileSync("mqttSubConfig.json");
var isPersonDetected = false;
var shutdownTimer;
var localMqttClient;
var cloudMqttClient;
var isMqttConnected = false;
var personDetectedMessage;
var rpi1DetectedMsg = JSON.parse('{"isPerson":false,"prob":0.0}');
var rpi2DetectedMsg = JSON.parse('{"isPerson":false,"prob":0.0}');
var airconPowerOffDuration = 300000;

async function main() {
    initilizingMQTT();
    // doEventProcess();
    // mongoDB_thread_init();
    //console.log(deviceDataModel.get().airconController[0].controllercmd);
}

main();

function initilizingMQTT() {
    // Connect MQTT

    cloudMqttClient = mqtt2.connect({
        host: "soldier.cloudmqtt.com",
        port: "11992",
        username: "hrvmbcju",
        password: "g7usW2NJz0H_",
        keepalive: 60,
        reconnectPeriod: 10000,
        will: { 
            topic: 'hope/online', payload: 'false', qos: 2, retain: true 
        }
    });

    cloudMqttClient.on('connect', function(){
        console.log("cloud MQTT Connected = " + cloudMqttClient.connected);
        cloudMqttClient.publish(
            'hope/online', 
            'true', 
            { qos: 2, retain: true },
            function(error){
                console.log("cloudMqttClient publish error:", error);
            }
        );
    });
}
