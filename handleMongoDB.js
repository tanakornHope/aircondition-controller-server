var mqtt = require('mqtt');
const fs = require('fs');
var mongoose = require('mongoose');
const { Worker, isMainThread, parentPort } = require('worker_threads');

var dataPushingInterval = 300000;
var serverIsOnline;
var mqttClientInstance;
var mongoDBconnection;
var deviceDataModel;
var mongooseSchema = new mongoose.Schema({
    timeStamp: Date,
    MQTTbroker: { online: Boolean },
    server: { online: Boolean },
    rpi: [
        {
            online: Boolean,
            isperson: Boolean,
            prob: Number
        },
        {
            online: Boolean,
            isperson: Boolean,
            prob: Number
        }
    ],
    airconController: [
        {
            controllercmd: Boolean,
            properties: { wifiLocalIP: String, online: Boolean, bootcount: Number },
            voltage: Number,
            current: Number,
            power: Number,
            energy: Number,
            frequency: Number
        },
        {
            controllercmd: Boolean,
            properties: { wifiLocalIP: String, online: Boolean, bootcount: Number },
            voltage: Number,
            current: Number,
            power: Number,
            energy: Number,
            frequency: Number
        },
        {
            controllercmd: Boolean,
            properties: { wifiLocalIP: String, online: Boolean, bootcount: Number },
            voltage: Number,
            current: Number,
            power: Number,
            energy: Number,
            frequency: Number
        }
    ],
    lightingController: [
        {
            controllercmd: Boolean,
            properties: { wifiLocalIP: String, online: Boolean, bootcount: Number },
            voltage: Number,
            current: Number,
            power: Number,
            energy: Number,
            frequency: Number
        }
    ]
});

var MongooseModel = mongoose.model("iotdevicedatas", mongooseSchema);

async function main() {
    parentPort.on('message', (message) => {
        deviceDataModel = message;
    });
    await mongodb_connect();
    await putDataToMongoDB();
}

main();

function mongodb_connect() {
    return new Promise(function (resolve, reject) {
        mongoose.connect('mongodb+srv://thanakorn:5617091@cluster0.ljv90.mongodb.net/finalproject',
        { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            keepAlive: true,
            keepAliveInitialDelay: 60000
        }, function(error){
            resolve(console.log("mongoDB conn error:",error));
        });

        mongoDBconnection = mongoose.connection;

        mongoDBconnection.on("error", function (msg) {
            resolve(console.log("mongoDB error:", msg));
        });
        mongoDBconnection.on("connected", function () {
            resolve(console.log("mongoDB is connected."));
        });
        mongoDBconnection.on("reconnectFailed", function () {
            resolve(console.log("mongoDB reconnect is failed."));
        });
        mongoDBconnection.on("disconnected", function () {
            resolve(console.log("mongoDB was disconnected."));
        });
        mongoDBconnection.on("reconnected", function () {
            resolve(console.log("reconnecting is successful."));
        });
        mongoDBconnection.on("reconnect", function () {
            resolve(console.log("mongodb is reconnecting."));
        });
    });
}

function putDataToMongoDB() {
    return new Promise(function (resolve, reject) {
        setInterval(() => {
            console.log("Document Inserted at: "+deviceDataModel.timeStamp);
            var mongooseDocument = new MongooseModel({
                timeStamp: deviceDataModel.timeStamp,
                MQTTbroker: { online: deviceDataModel.MQTTbroker.online },
                server: { online: true },
                rpi: [
                    {
                        online: deviceDataModel.rpi[0].online,
                        isperson: deviceDataModel.rpi[0].isperson,
                        prob: deviceDataModel.rpi[0].prob
                    },
                    {
                        online: deviceDataModel.rpi[1].online,
                        isperson: deviceDataModel.rpi[1].isperson,
                        prob: deviceDataModel.rpi[1].prob
                    }
                ],
                airconController: [
                    {
                        controllercmd: deviceDataModel.airconController[0].controllercmd,
                        properties: {
                            wifiLocalIP: deviceDataModel.airconController[0].properties.wifiLocalIP,
                            online: deviceDataModel.airconController[0].properties.online,
                            bootcount: deviceDataModel.airconController[0].properties.bootcount
                        },
                        voltage: deviceDataModel.airconController[0].measure.voltage,
                        current: deviceDataModel.airconController[0].measure.current,
                        power: deviceDataModel.airconController[0].measure.power,
                        energy: deviceDataModel.airconController[0].measure.energy,
                        frequency: deviceDataModel.airconController[0].measure.frequency
                    },
                    {
                        controllercmd: deviceDataModel.airconController[1].controllercmd,
                        properties: {
                            wifiLocalIP: deviceDataModel.airconController[1].properties.wifiLocalIP,
                            online: deviceDataModel.airconController[1].properties.online,
                            bootcount: deviceDataModel.airconController[1].properties.bootcount
                        },
                        voltage: deviceDataModel.airconController[1].measure.voltage,
                        current: deviceDataModel.airconController[1].measure.current,
                        power: deviceDataModel.airconController[1].measure.power,
                        energy: deviceDataModel.airconController[1].measure.energy,
                        frequency: deviceDataModel.airconController[1].measure.frequency
                    },
                    {
                        controllercmd: deviceDataModel.airconController[2].controllercmd,
                        properties: {
                            wifiLocalIP: deviceDataModel.airconController[2].properties.wifiLocalIP,
                            online: deviceDataModel.airconController[2].properties.online,
                            bootcount: deviceDataModel.airconController[2].properties.bootcount
                        },
                        voltage: deviceDataModel.airconController[2].measure.voltage,
                        current: deviceDataModel.airconController[2].measure.current,
                        power: deviceDataModel.airconController[2].measure.power,
                        energy: deviceDataModel.airconController[2].measure.energy,
                        frequency: deviceDataModel.airconController[2].measure.frequency
                    }
                ],
                lightingController: [
                    {
                        controllercmd: deviceDataModel.lightingController[0].controllercmd,
                        properties: {
                            wifiLocalIP: deviceDataModel.lightingController[0].properties.wifiLocalIP,
                            online: deviceDataModel.lightingController[0].properties.online,
                            bootcount: deviceDataModel.lightingController[0].properties.bootcount
                        },
                        voltage: deviceDataModel.lightingController[0].measure.voltage,
                        current: deviceDataModel.lightingController[0].measure.current,
                        power: deviceDataModel.lightingController[0].measure.power,
                        energy: deviceDataModel.lightingController[0].measure.energy,
                        frequency: deviceDataModel.lightingController[0].measure.frequency
                    }
                ]
            });
            mongooseDocument.save(function(error){
                resolve(console.log("mongo inserting error:", error));
            });
        }, dataPushingInterval);
    });
}