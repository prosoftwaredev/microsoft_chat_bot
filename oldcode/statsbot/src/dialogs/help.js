var builder = require('botbuilder'),
    entity = require('./../entities'),
    helper = require('./../helpers');

var helpData = {
    "workflow": {
        "info": "You can say 'Workflows Started or 'Workflows Failed', then provide more accurate details through the dialog with the provided choices."
    },
    "measures": {
        "info": "Measures info"
    },
    "normalization": {
        "info": "Normalization will reduce the current data set to a more specific calculation..."
    }
}

help = [
    function (session, args, next) {
        var entities = {}
        entity.help(session, args, entities)
        session.userData.ntt = helper.checkEntities(entities)
        if (session.userData.ntt === undefined) {
            builder.Prompts.choice(session, "What would you like to know more about?", "Workflow|Measures|Normalization")
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