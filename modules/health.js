var task = function (request, callback) {

    console.log("test");
    callback.send('hello world');

};

exports.lab = task;
