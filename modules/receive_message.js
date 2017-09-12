var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var Const = require("./const");
var Jimp = require("jimp");
var sqs = new AWS.SQS({apiVersion: Const.API_VERSION});
var s3 = new AWS.S3();

// ustawienie parametrow np poprania 10 wiadomosci naraz 
var params = {
    MaxNumberOfMessages: 10,
    QueueUrl: Const.messageQueue,
    VisibilityTimeout: 10,
    WaitTimeSeconds: 0,
    AttributeNames: [
        "All"
    ],
    MessageAttributeNames: [
        'All'
    ]
};

var receiveMessages = function () {

    // odbiera wiadomosci dzialajac w k�ko (po 10)
    sqs.receiveMessage(params, function (err, data) {

        // jesli napotykamy b�ad logujemy to do bazy danych
        if (err)
            Const.putIntoLogDB("Receive Error: " + err);
            // jesli nie napotykamy b��du - sprawdzamy w switchu kt�r� metod� mamy wykona� (u�yte numerowanie z const.js)
        else {

            if (data.Messages) {
                data.Messages.forEach(function (value) {

                    if (Number(value["Attributes"].ApproximateReceiveCount) <= 1) {

                        const numberType = value.MessageAttributes["MessageType"].StringValue;

                        switch (numberType) {
                            case Const.DELETE_TYPE:
                                deletePhoto(JSON.parse(value.Body));
                                break;
                            case Const.ROTATE_TYPE:
                                rotateImage(JSON.parse(value.Body));
                                break;
                            case Const.BLACKANDWHITE_TYPE:
                                blackandwhiteImage(JSON.parse(value.Body));
                                break;
                            case Const.BLUR_TYPE:
                                blurImage(JSON.parse(value.Body));
                                break;
                            case Const.INVERT_TYPE:
                                invertImage(JSON.parse(value.Body));
                                break;
                        }

                        var deleteParams = {
                            QueueUrl: Const.messageQueue,
                            ReceiptHandle: value.ReceiptHandle
                        };

                        // po odczytaniu i wykonaniu wiadomosc zostaje usuni�ta aby drugi worker jej nie wykona�
                        sqs.deleteMessage(deleteParams, function (err, data) {
                            if (err)
                                Const.putIntoLogDB("Delete error: " + err);
                        });
                    }

                });
                // pr�ba ponownego pobrania wiadomo�ci
                receiveMessages();

                // odczekanie 5 sekund je�li nie by�o wiadomo�ci do popbrania i ponowna pr�ba
            } else {
                setTimeout(function () {
                    receiveMessages()
                }, Const.receiveInterval);
            }
        }
    });

};

function deletePhoto(photoKey) {

    var params = {Bucket: Const.bucketName, Key: photoKey};

    s3.deleteObject(params, function (err, data) {
        if (err)
            Const.putIntoLogDB("Error while deleting local photo: " + err);
    });

}

function blackandwhiteImage(photoKey) {
    transformImage(photoKey, "gray");
}

function rotateImage(photoKey) {
    transformImage(photoKey, "rotate");
}

function blurImage(photoKey) {
    transformImage(photoKey, "blur");
}

function invertImage(photoKey) {
    transformImage(photoKey, "invert");
}

// og�lna funkcja, do kt�rej przekazywany jest parametr w zalezno�ci od wykonywanej operacji na zdj�ciu
function transformImage(photoKey, typeOfTransform) {

    var urlParams = {Bucket: Const.bucketName, Key: photoKey};
    s3.getSignedUrl('getObject', urlParams, function (err, url) {

        Jimp.read(url, function (err, image) {
            if (err)
                Const.putIntoLogDB("Error read photo: " + err);

            if (typeOfTransform == "gray") {
                image.greyscale();
            } else if (typeOfTransform == "rotate"){
                image.rotate(90);
            } else if (typeOfTransform == "blur") {
                image.blur(20);
            } else if (typeOfTransform == "invert") {
                image.invert();
            }
                
            image.getBuffer(image.getMIME(), (err, buffer) => {

                if (err)
                    Const.putIntoLogDB("Error while transforming photo: " + err);
                else {

                    var newImageData = {
                        Bucket: Const.bucketName,
                        Key: Const.getUniqueSQSName(),
                        Body: buffer
                    };

                    s3.putObject(newImageData, function (err, data) {
                        if (err)
                            Const.putIntoLogDB("Error uploading transformed photo: " + err);
                    });
                }

            });
        });
    });
}

receiveMessages();