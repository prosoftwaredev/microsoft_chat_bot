'use strict';
var restify = require('restify');
var request = require('request');
var BotCore = require('./src/core.js');

// Setup Restify Server
var server = restify.createServer();
server.pre(restify.pre.sanitizePath());
server.use(restify.bodyParser());
// Create bot
server.post('/api/messages', BotCore.connector.listen());

require("./model/factory")



server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
})


