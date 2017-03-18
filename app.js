'use strict';

const apiai = require('apiai');
const express = require('express');
const bodyParser = require('body-parser');

const SkypeBot = require('./skypebot');
const SkypeBotConfig = require('./skypebotconfig');

const config = require('./app.json');

const REST_PORT = (process.env.PORT || config.env.PORT.value);

const botConfig = new SkypeBotConfig(
    process.env.APIAI_ACCESS_TOKEN || config.env.APIAI_ACCESS_TOKEN.value,
    process.env.APIAI_LANG || config.env.APIAI_LANG.value,
    process.env.APP_ID || config.env.APP_ID.value,
    process.env.APP_SECRET || config.env.APP_SECRET.value,
    process.env.REDSHIFT_CONNECTION_STRING || config.env.REDSHIFT_CONNECTION_STRING.value,
    process.env.REDSHIFT_TABLE_NAME || config.env.REDSHIFT_TABLE_NAME.value,
    process.env.REDSHIFT_DATE_COLUMN_NAME || config.env.REDSHIFT_DATE_COLUMN_NAME.value
);

const skypeBot = new SkypeBot(botConfig);

// console timestamps
require('console-stamp')(console, 'yyyy.mm.dd HH:MM:ss.l');

const app = express();
app.use(bodyParser.json());

app.post('/chat', skypeBot.botService.listen());

app.listen(REST_PORT, function () {
    console.log('Rest service ready on port ' + REST_PORT);
});