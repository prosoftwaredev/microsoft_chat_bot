const builder = require('botbuilder'),
    core = require('./../../src/core'),
    factory = require('./../../model/factory');

const auth = [
    function (session) {
        session.send("Can you please sign in ")
        builder.Prompts.text(session, "What is your username?")
    },
    function (session, results) {
        if (results.response) {
            session.userData.UN = results.response;
        }
        builder.Prompts.text(session, "What is your password?")
    },
    function (session, results, next) {
        if (results.response) {
            let PW = results.response;
            let UN = session.userData.UN;
            session.send("Checking...");
            factory.FindUser(UN, PW)
                .then((res) => {
                    if (res === null) session.endDialog("Sorry username or password does not match")

                    return (res.username === UN && res.password === PW)
                }).then((res) => {
                    if (res === true) {
                        session.userData.authenticated = true;
                        session.endDialog("Welcome %s! How can I help you? Type help if you're not sure!", UN)
                    } else {
                        session.endDialog("Sorry username or password does not match")
                    }
                }).catch((err) => {
                    console.log(err)
                })
        }
    }
]

module.exports = auth
