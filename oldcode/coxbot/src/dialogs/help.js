var builder = require('botbuilder'),
    entity = require('./../entities')

// Move helper functions and data

var helpData = {
    "sales": {
        "info": "Sales info"
    },
    "promo": {
        "info": "Promotional info"
    },
    "labor": {
        "info": "Labor info"
    },
    "food": {
        "info": "Food info"
    }
}

function checkEntities(obj) {
    let res = [];
    for (var Name in obj) {
        if (obj[Name] != null) {
            res.push(obj[Name])
        }
    }
    return res[0];
}

help = [
    function (session, args, next) {
        var entities = {}
        entity.help(session, args, entities)
        session.userData.ntt = checkEntities(entities)
        if (session.userData.ntt === undefined) {
            builder.Prompts.choice(session, "What would you like to know more about?", "Sales|Promo|Labor|Food")
        }else{
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            var choice = helpData[results.response.entity.toLowerCase()]
            session.send(choice.info)
        } else {
            var choice = helpData[session.userData.ntt.entity.toLowerCase()]
            session.send(choice.info)
        }
    }
]
module.exports = help