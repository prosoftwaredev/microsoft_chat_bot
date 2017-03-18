var builder = require('botbuilder');

module.exports = function (session, args, entities) {
    entities.sales = builder.EntityRecognizer.findEntity(args.entities, 'help::sales');
    entities.promo = builder.EntityRecognizer.findEntity(args.entities, 'help::promo');
    entities.labor = builder.EntityRecognizer.findEntity(args.entities, 'help::labor');
    entities.food = builder.EntityRecognizer.findEntity(args.entities, 'help::food');

    console.log(entities);
    session.userData.sales = entities.sales;
    session.userData.promo = entities.promo;
    session.userData.labor = entities.labor;
    session.userData.food = entities.food;
}