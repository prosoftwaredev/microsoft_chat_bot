const botbuilder = require('botbuilder');
const save_query = [
    function (session, args) {
        // var options = {
        //     listStyle: botbuilder.ListStyle.button
        // };
        botbuilder.Prompts.confirm(session, `Would you like to save this query in your favorites?`);
    },
    function (session, results) {
        if (results.response === true) {
            botbuilder.Prompts.text(session, "Please choose a name for this query")
        } else {
            session.send("Ok no problem.")
            session.endDialog();
        }
    },
    function (session, results) {
        if (results.response) {
            if (!session.userData.favorites)
                session.userData.favorites = [];


            let newFav = {
                "name": results.response,
                "query": session.userData.prevData
                /*
                    After demo perhaps add params here
                    and edit with NLP
                    run {name} for last 3 weeks
                    even though its saved as  last 2 weeks
                */
            }

            session.userData.favorites.push(newFav)
            session.send(`Saved '${newFav.name}'.  Type 'favorites' to view saved queries. `)
            session.endDialog();

        }
    }
]
module.exports = save_query
