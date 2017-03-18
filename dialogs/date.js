const botbuilder = require('botbuilder');
const limit = [
                function (session) {
                  botbuilder.Prompts.text(session, `What time period would you like to have this information for?`)
                },
                function (session, results) {
                    if (results.response) {
                        session.userData.prevSess += ` for ${results.response}`
                        session.message.text = session.userData.prevSess;
                        session.endDialog();
                    }else if (results.response.entity.toLowerCase() === 'no'){
                        session.endDialog();
                    }                 
                }
            ]
module.exports = limit
