const builder = require('botbuilder'),
    entity = require('./../entities'),
    helper = require('./../helpers')

const workflowChoices = ["List Based", "Calculations", "Normalized Calculations"]
const calcChoices = ["Sum", "Average", "Count"]


const workflow = [
    function (session, args, next) {
        var entities = {}
        entity.measures(session, args, entities)
        let ntt = helper.Measures(entities)
        // session.send("Found %s  ", ntt.map(n => ` \n* '${n.entity}' of type ${n.type} `))

        builder.Prompts.choice(session, "How would you like to see that?", workflowChoices)

    },
    function (session, results, next) {

        if (results.response.entity === workflowChoices[1]) {
            // return calculations
            session.userData.calculations = true;
            builder.Prompts.text(session, "What columns should appear in the data, seperate by comma")
        }else{
            session.send("TODO: Create more dialogs")
        }
    },
    function (session, results, next) {
        if (session.userData.calculations) {
            session.userData.column = results.response;
            builder.Prompts.choice(session, "What kind of calculation would you like to see", calcChoices)
        }
    },
    function (session, results, next) {
        if (session.userData.calculations) {
            session.userData.choice = results.response.entity;
            builder.Prompts.confirm(session, "Do you want that calculation normalized so you can compare?")
        }
    },
    function (session, results, next) {
        if (session.userData.calculations) {
            if (results.response === true) {
                session.userData.normalize = results.respose;
            }
            let form = session.userData;
            (form.normalize) ? session.send(`I have column ${form.column}, calculation choice  '${form.choice}'`) :
                session.send(`I have column ${form.column}, calculation choice  '${form.choice}' and you want to normalize the data`)
        }
    }
]


// calculations = new builder(
//     function (session) {
//         builder.Prompts.text(session, "What columns should appear in the data, seperate by comma")
//     },
//     function (session) {
//         builder.Prompts.choice(session, "What kind of calculation would you like to see", calcChoices)
//     },
//     function (session) {
//         builder.Prompts.confirm(session, "I need to know if you want that calculation normalized so you can compare")
//     }
// )


module.exports = workflow;