const botbuilder = require('botbuilder');
const limit = [
                function (session) {
                     var options = {
                        listStyle: botbuilder.ListStyle.button
                    };
                        botbuilder.Prompts.confirm(session, `There are more than 10 records. Would you like to see the top 10?`,options);
                },
                function (session, results) {
                    if (results.response) {
                        session.userData.limit  = 10;                
                    }  else{
                        session.userData.limit  = 0;
                    }    
                    session.endDialog();           
                }
            ]
module.exports = limit
