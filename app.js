require("./modules/receive_message").lab;
var urlMap = [];
var service = require("./lib/service").http(urlMap);
var PORT = 8080;
service(PORT);