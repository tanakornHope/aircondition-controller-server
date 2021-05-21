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
    doEventProcess();
    mongoDB_thread_init();
    //console.log(deviceDataModel.get().airconController[0].controllercmd);
}

main();

function initilizingMQTT() {
    // Connect MQTT
    localMqttClient = mqtt.connect({
        host: '127.0.0.1',
        port: '1883',
        username: 'admin',
        password: '5617091',
        keepalive: 60,
        reconnectPeriod: 10000,
        will: { 
            topic: 'myFinalProject/server/properties/online', payload: 'false', qos: 2, retain: true
        }
    });

    cloudMqttClient = mqtt2.connect({
        host: "soldier.cloudmqtt.com",
        port: "11992",
        username: "hrvmbcju",
        password: "g7usW2NJz0H_",
        keepalive: 60,
        reconnectPeriod: 10000,
        will: { 
            topic: 'myFinalProject/server/properties/online', payload: 'false', qos: 2, retain: true 
        }
    });

    cloudMqttClient.on('connect', function(){
        console.log("cloud MQTT Connected = " + cloudMqttClient.connected);
        cloudMqttClient.publish(
            'myFinalProject/server/properties/online', 
            'true', 
            { qos: 2, retain: true },
            function(error){
                console.log("cloudMqttClient publish error:", error);
            }
        );
    });

    localMqttClient.on('connect', function () {
        console.log("local MQTT Connected = " + localMqttClient.connected);
        localMqttClient.publish(
            'myFinalProject/server/properties/online', 
            'true', 
            { qos: 2, retain: true },
            function(error){
                console.log("localMqttClient publish error:", error);
            }
        );
        deviceDataModel.MQTTbroker.online = true;
        // set both online flag.
        // initilize command flag ''false for air condition controller
        for (let i = 0; i < deviceDataModel.airconController.length; i++) {
            localMqttClient.publish(
                'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                "false", 
                { qos: 2, retain: true },
                function(error){
                    console.log("localMqttClient publish error:", error);
                }
            );
            cloudMqttClient.publish(
                'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                "false", 
                { qos: 2, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
        }
        localMqttClient.subscribe(JSON.parse(mqttSubscribe.toString()), function (err) {
            if (err) {
                console.log("localMqttClient subscribe error:",err);
            }
        });
    });

    //local mqtt connection object
    localMqttClient.on('error', function (error) {
        console.log("localMqttClient ERROR: ", error);
    });

    localMqttClient.on('offline', function () {
        console.log("broker is offline");
        deviceDataModel.MQTTbroker.online = false;
    });

    localMqttClient.on('reconnect', function () {
        console.log("reconnect");
    });

    localMqttClient.on('message', function (topic, message) {
        handleLocalMQTTMessage(topic, message);
    });

    //cloud mqtt connection object
    cloudMqttClient.on('error', function (error) {
        console.log("cloudMqttClient ERROR: ", error);
    });

    cloudMqttClient.on('offline', function () {
        console.log("broker is offline");
    });

    cloudMqttClient.on('reconnect', function () {
        console.log("reconnect");
    });

}

function handleLocalMQTTMessage(topic, message){
    try {
        if (topic == "myFinalProject/rpi1/objDetector") {
            rpi1DetectedMsg = JSON.parse(message.toString());
            cloudMqttClient.publish(
                'myFinalProject/rpi1/objDetector', 
                message.toString(), 
                { qos: 0, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
        }
        if (topic == "myFinalProject/rpi1/onlineStatus/online") {
            cloudMqttClient.publish(
                'myFinalProject/rpi1/onlineStatus/online', 
                message.toString(), 
                { qos: 2, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
            if (message.toString() === "true") {
                deviceDataModel.rpi[0].online = true;
            }
            else if (message.toString() === "false") {
                deviceDataModel.rpi[0].online = false;
                deviceDataModel.rpi[0].isperson = false;
                deviceDataModel.rpi[0].prob = 0.0;
            }
        }

        if (topic == "myFinalProject/rpi2/objDetector") {
            rpi2DetectedMsg = JSON.parse(message.toString());
            cloudMqttClient.publish(
                'myFinalProject/rpi2/objDetector', 
                message.toString(), 
                { qos: 0, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
        }
        if (topic == "myFinalProject/rpi2/onlineStatus/online") {
            cloudMqttClient.publish(
                'myFinalProject/rpi2/onlineStatus/online', 
                message.toString(), 
                { qos: 2, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
            if (message.toString() === "true") {
                deviceDataModel.rpi[1].online = true;
            }
            else if (message.toString() === "false") {
                deviceDataModel.rpi[1].online = false;
                deviceDataModel.rpi[1].isperson = false;
                deviceDataModel.rpi[1].prob = 0.0;
            }
        }

        if (topic == "myFinalProject/airconController1/measure") {
            cloudMqttClient.publish(
                'myFinalProject/airconController1/measure', 
                message.toString(), 
                { qos: 0, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
            deviceDataModel.airconController[0].measure = JSON.parse(message.toString());
        }
        if (topic == "myFinalProject/airconController1/properties") {
            cloudMqttClient.publish(
                'myFinalProject/airconController1/properties', 
                message.toString(), 
                { qos: 2, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }    
            );
            deviceDataModel.airconController[0].properties.wifiLocalIP = JSON.parse(message.toString()).wifiLocalIP
            deviceDataModel.airconController[0].properties.online = JSON.parse(message.toString()).online
            deviceDataModel.airconController[0].properties.bootcount = JSON.parse(message.toString()).bootcount
            if (JSON.parse(message.toString()).online == "false") {
                deviceDataModel.airconController[0].measure = JSON.parse({
                    "voltage": null,
                    "current": null,
                    "power": null,
                    "energy": null,
                    "frequency": null
                });
            }
        }

        if (topic == "myFinalProject/airconController2/measure") {
            cloudMqttClient.publish(
                'myFinalProject/airconController2/measure', 
                message.toString(), 
                { qos: 0, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }
            );
            deviceDataModel.airconController[1].measure = JSON.parse(message.toString());
        }
        if (topic == "myFinalProject/airconController2/properties") {
            cloudMqttClient.publish(
                'myFinalProject/airconController2/properties', 
                message.toString(), 
                { qos: 2, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }    
            );
            deviceDataModel.airconController[1].properties.wifiLocalIP = JSON.parse(message.toString()).wifiLocalIP
            deviceDataModel.airconController[1].properties.online = JSON.parse(message.toString()).online
            deviceDataModel.airconController[1].properties.bootcount = JSON.parse(message.toString()).bootcount
            if (JSON.parse(message.toString()).online == "false") {
                deviceDataModel.airconController[1].measure = JSON.parse({
                    "voltage": null,
                    "current": null,
                    "power": null,
                    "energy": null,
                    "frequency": null
                });
            }
        }

        if (topic == "myFinalProject/airconController3/measure") {
            cloudMqttClient.publish(
                'myFinalProject/airconController3/measure', 
                message.toString(), 
                { qos: 0, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }    
            );
            deviceDataModel.airconController[2].measure = JSON.parse(message.toString());
        }
        if (topic == "myFinalProject/airconController3/properties") {
            cloudMqttClient.publish(
                'myFinalProject/airconController3/properties', 
                message.toString(), 
                { qos: 2, retain: true },
                function(error){
                    console.log("cloudMqttClient publish error:", error);
                }    
            );
            deviceDataModel.airconController[2].properties.wifiLocalIP = JSON.parse(message.toString()).wifiLocalIP
            deviceDataModel.airconController[2].properties.online = JSON.parse(message.toString()).online
            deviceDataModel.airconController[2].properties.bootcount = JSON.parse(message.toString()).bootcount
            if (JSON.parse(message.toString()).online == "false") {
                deviceDataModel.airconController[2].measure = JSON.parse({
                    "voltage": null,
                    "current": null,
                    "power": null,
                    "energy": null,
                    "frequency": null
                });
            }
        }
    }
    catch (error) {
        console.log("MQTT message error: ", error);
    }
}

function doEventProcess() {
    setInterval(() => {
        try {
            deviceDataModel.timeStamp = new Date();
            if (!deviceDataModel.rpi[0].online && !deviceDataModel.rpi[1].online) {
                for (let i = 0; i < deviceDataModel.airconController.length; i++) {
                    localMqttClient.publish(
                        'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                        "false", 
                        { qos: 2, retain: true },
                        function(error){
                            console.log("localMqttClient publish error:",error);
                        }
                    );
                    cloudMqttClient.publish(
                        'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                        "false", 
                        { qos: 0, retain: true },
                        function(error){
                            console.log("cloudMqttClient publish error:",error);
                        }
                    );
                }
            }
            else if (deviceDataModel.rpi[0].online || deviceDataModel.rpi[1].online) {
                personDetecting();
            }
            //console.log(JSON.stringify(deviceDataModel));
            port1.postMessage(deviceDataModel);
        } catch(error) {
            console.log("doEventProcess error:", error);
        }
    }, 10000);
}

function personDetecting() {
    try {
        if (rpi1DetectedMsg.isPerson == false && rpi2DetectedMsg.isPerson == false) {
            //console.log(rpi2DetectedMsg);
            deviceDataModel.rpi[0].isperson = false;
            deviceDataModel.rpi[0].prob = 0.0;
            deviceDataModel.rpi[1].isperson = false;
            deviceDataModel.rpi[1].prob = 0.0;

            if (isPersonDetected == true) {
                isPersonDetected = !isPersonDetected;
                console.log("person disappeared. ready to countdown timer.");
                shutdownTimer = setTimeout(() => {
                    for (let i = 0; i < deviceDataModel.airconController.length; i++) {
                        localMqttClient.publish(
                            'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command',
                            "false", 
                            { qos: 2, retain: true },
                            function(error){
                                console.log("localMqttClient publish error:",error);
                            }
                        );
                        cloudMqttClient.publish(
                            'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                            "false", 
                            { qos: 0, retain: true },
                            function(error){
                                console.log("cloudMqttClient publish error:",error);
                            }
                        );
                        deviceDataModel.airconController[i].controllercmd = false;
                    }
                }, airconPowerOffDuration);
            }
        }
        else if (rpi1DetectedMsg.isPerson == true || rpi2DetectedMsg.isPerson == true) {
            deviceDataModel.rpi[0].isperson = true;
            deviceDataModel.rpi[0].prob = rpi1DetectedMsg.prob;
            deviceDataModel.rpi[1].isperson = true;
            deviceDataModel.rpi[1].prob = rpi2DetectedMsg.prob;

            if (isPersonDetected == false) {
                clearTimeout(shutdownTimer);
                isPersonDetected = !isPersonDetected;
                console.log("person detected. ready to control and stop countdown timer.");
                for (let i = 0; i < deviceDataModel.airconController.length; i++) {
                    localMqttClient.publish(
                        'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                        "true", 
                        { qos: 2, retain: true },
                        function(error){
                            console.log("localMqttClient publish error:", error);
                        }
                    );
                    cloudMqttClient.publish(
                        'myFinalProject/server/electricalAppliances/airconController' + (i + 1) + '/command', 
                        "true", 
                        { qos: 0, retain: true },
                        function(){
                            console.log("cloudMqttClient publish error:", error);
                        }
                    );
                    deviceDataModel.airconController[i].controllercmd = true;
                }
            }
        }
    }
    catch (error) {
        console.log("personDetecting error: ", error.toString());
    }
}

function mongoDB_thread_init() {
    if (isMainThread) {
        const worker = new Worker('./handleMongoDB.js');
        port2.on('message', (message) => {
            worker.postMessage(message);
        });
    }
}
