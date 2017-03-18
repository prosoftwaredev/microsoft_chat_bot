var builder = require('botbuilder');

module.exports = function (session, args, entities) {
    entities.Group = builder.EntityRecognizer.findEntity(args.entities, 'Group');
    entities.By = builder.EntityRecognizer.findEntity(args.entities, 'By');
    entities.Filter = builder.EntityRecognizer.findEntity(args.entities, 'Filter');
    entities.Date = builder.EntityRecognizer.findEntity(args.entities, 'Date');
    entities.year = builder.EntityRecognizer.findEntity(args.entities, 'Date::year');
    entities.month = builder.EntityRecognizer.findEntity(args.entities, 'Date::month');
    entities.week = builder.EntityRecognizer.findEntity(args.entities, 'Date::week');
    entities.day = builder.EntityRecognizer.findEntity(args.entities, 'Date::day');
    entities.quarter = builder.EntityRecognizer.findEntity(args.entities, 'Date::quarter');
    entities.StartDate = builder.EntityRecognizer.findEntity(args.entities, 'Date::StartDate');
    entities.EndDate = builder.EntityRecognizer.findEntity(args.entities, 'Date::EndDate');
    entities.Time = builder.EntityRecognizer.findEntity(args.entities, 'Time');
    entities.Hour = builder.EntityRecognizer.findEntity(args.entities, 'Time::Hour');
    entities.Minute = builder.EntityRecognizer.findEntity(args.entities, 'Time::Minute');
    entities.Second = builder.EntityRecognizer.findEntity(args.entities, 'Time::Second');
    entities.DayPart = builder.EntityRecognizer.findEntity(args.entities, 'Time::DayPart');
}