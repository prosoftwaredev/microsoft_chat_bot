//=========================================================
// Bot Setup
//=========================================================
'use strict';

var builder = require('botbuilder');
var scenario = require('./dialogs');
var core = {};

core.model = (process.env.LUIS_MODEL_API);
core.recognizer = new builder.LuisRecognizer(core.model);
core.dialog = new builder.IntentDialog({ recognizers: [core.recognizer] });
core.connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
core.bot = new builder.UniversalBot(core.connector);

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
core.bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

core.botname = "The Stats Bot";

//=========================================================
// Bots Dialogs
//=========================================================


core.bot.dialog('/', [
    function (session, results, next) {
        // session.userData.authenticated = null;
        (session.userData.authenticated) ?
            session.replaceDialog('/dialogs', session.message.text) :
            session.send("Hi, I'm %s", core.botname) && session.beginDialog('/auth')


        setInterval(() => {
            if (session.userData.authenticated === true) {
                session.send("You've been logged out for inactivity")
                session.userData.authenticated = null;
                session.endDialog();
                session.replaceDialog('/');
            }
        }, 1000000)
    }
])

core.bot.dialog('/dialogs', core.dialog)
    .matches('Help', scenario.help)
    .matches('Greet', [scenario.greetings])
    .matches('Gracias', [scenario.thanks])    
    .matches('Workflow', scenario.workflow)    
    .matches('None', [scenario.none])
    .onDefault((session) => {
        session.send('Sorry, \'%s\' is not recognized ', session.message.text)
    });

core.bot.dialog('/auth', scenario.auth)



module.exports = core;