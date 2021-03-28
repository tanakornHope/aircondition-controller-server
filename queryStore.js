const hourlyQuery = [
    {
        "$project": {
            "energy": { "$arrayElemAt": ["$airconController.energy", 0] },
            "timeStamp": 1,
            "_id": 0
        }

    },
    {
        "$match": {
            "timeStamp": { "$gte": new Date("2020-10-02 17:00:00.000Z"), "$lt": new Date("2020-10-03 17:00:00.000Z") }
        }
    },
    {
        "$group": {
            "_id": { "$hour": "$timeStamp" },
            "first": { "$first": "$$ROOT" },
            "last": { "$last": "$$ROOT" }
        }
    },
    {
        "$sort": { "first.timeStamp": 1 }
    }
];

const dailyQuery = [
    {
        $project: {
            "energy": { $arrayElemAt: ["$airconController.energy", 0] },
            "timeStamp": 1,
            "_id": 0
        }

    },
    {
        $match: {
            "timeStamp": { "$gte": new Date("2020-09-01 17:00:00.000Z"), "$lt": new Date("2020-10-01 17:00:00.000Z") }
        }
    },
    {
        "$group": {
            "_id": { "$dayOfMonth": { date: "$timeStamp", timezone: "Asia/Bangkok" } },
            "first": { "$first": "$$ROOT" },
            "last": { "$last": "$$ROOT" }
        }
    },
    {
        "$sort": { "first.timeStamp": 1 }
    }
];

module.exports = {
    hourlyQuery,
    dailyQuery
};