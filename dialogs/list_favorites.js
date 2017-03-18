const botbuilder = require('botbuilder');
const list_favorites = [
    function (session, args) {
        var options = {
            listStyle: botbuilder.ListStyle.button
        };

        let favorites = session.userData.favorites.map((x) => x.name)
        console.log(favorites)
        botbuilder.Prompts.choice(session, "Which query are you looking for", favorites, options)
    },
    function (session, results) {
        let choice = session.userData.favorites.filter((x) => x.name === results.response.entity)
        session.send(`${choice[0].query}`) // processMessage this response 
        session.endDialog();
    }
]
module.exports = list_favorites
