//require jest mapowane na endpointy a je�eli nie to po prostu odpali w�tek i //wykonuje to co w nim znajdzie czyli t� ostatni� linijk� ReceiveMessages()

require("./modules/receive_message").lab;
var urlMap = [];
var service = require("./lib/service").http(urlMap);
var PORT = 8080;
service(PORT);