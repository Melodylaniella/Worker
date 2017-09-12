module.exports = {
    getUniqueSQSName: function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            var ret;
            if (c == 'x') {
                ret = r.toString(16);
            }
            else {
                ret = (r & 0x3 | 0x8).toString(16);
            }
            return ret;
        });
        return uuid;
    },
    putIntoLogDB: function (message) {

        var AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config.json');
        var dynamodb = new AWS.DynamoDB();

        var params = {
            Item: {
                "GUID": {
                    S: this.getUniqueSQSName()
                }, 
                "timestamp": {
                    S: String(Date.now())
                }, 

                "Message": {
                    S: "Worker; " + message
                }
            },
            ReturnConsumedCapacity: "TOTAL",
            TableName: this.logTableName
        };
        dynamodb.putItem(params, function (err, data) {
        });

    },
    // ustawienie danych potrzebnych do wykorzystania usług amazon min. nazwa koszyka, link, tabela do logowania
    bucketName: "lesiakbucket",
    messageQueue: "https://sqs.eu-west-2.amazonaws.com/105347894034/LesiakQueue",
    logTableName: "LesiakLogDB",
    receiveInterval: 5 * 1000,

    // wartości sqs charakteryzujące każdą operację 
    DELETE_TYPE: "1",
    ROTATE_TYPE: "2",
    BLACKANDWHITE_TYPE: "3",
    BLUR_TYPE: "4",
    INVERT_TYPE: "5",
    API_VERSION: "2017-09-01"

};